import io
import json
import os
import tempfile
import logging
from typing import Optional, Tuple

from fdk import response
import oci
from wand.image import Image


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))


def _redact(obj):
    """Redact common secret-bearing keys in nested dict/list structures."""
    if isinstance(obj, dict):
        redacted = {}
        for k, v in obj.items():
            lk = str(k).lower()
            if lk in {"authorization", "cookie", "set-cookie", "token", "access_token", "id_token", "password", "secret", "api_key", "apikey"}:
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = _redact(v)
        return redacted
    if isinstance(obj, list):
        return [_redact(v) for v in obj]
    return obj


def _log_payload(payload: object, raw: str, max_bytes: int = 16_384):
    """Log event payload safely.

    - Prefers structured JSON when parseable
    - Redacts common secret keys
    - Limits output size to avoid huge logs
    """
    try:
        if isinstance(payload, dict) or isinstance(payload, list):
            safe = _redact(payload)
            s = json.dumps(safe, ensure_ascii=False)
        else:
            s = raw or ""
    except Exception:
        s = raw or ""

    truncated = s.encode("utf-8")
    if len(truncated) > max_bytes:
        s = truncated[:max_bytes].decode("utf-8", errors="replace") + "…[truncated]"
    logger.info("event payload: %s", s)


def _env(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        raise Exception(f"Missing required env var {name}")
    return v


def _parse_object_create_event(payload: dict) -> Tuple[str, str]:
    """Parse OCI Events payload -> (bucketName, objectName)."""
    details = (payload or {}).get("data") or {}
    additional = details.get("additionalDetails") or {}
    bucket = additional.get("bucketName")
    obj = details.get("resourceName") or additional.get("objectName")
    if not bucket or not obj:
        raise Exception(
            "Unable to parse bucketName/objectName from event payload. "
            "Expected data.additionalDetails.bucketName and data.resourceName"
        )
    return bucket, obj


def parse_invocation_payload(payload: object) -> Tuple[str, str, Optional[str]]:
    """Parse invocation payload.

    Supports:
    - Manual invocation: {"sourceBucket": "...", "objectName": "...", "destinationBucket": "..."?}
    - Legacy OCI Events payload: parses via _parse_object_create_event

    Returns (sourceBucket, objectName, destinationBucketOverride).
    """
    if isinstance(payload, dict):
        # Manual path: if any manual keys present, require sourceBucket + objectName
        if "sourceBucket" in payload or "objectName" in payload or "destinationBucket" in payload:
            src_bucket = payload.get("sourceBucket")
            object_name = payload.get("objectName")
            dst_bucket = payload.get("destinationBucket")
            if not src_bucket or not object_name:
                raise Exception(
                    "Unable to parse manual invocation payload. Expected sourceBucket and objectName"
                )
            return src_bucket, object_name, dst_bucket

        # Legacy OCI Events payload
        src_bucket, object_name = _parse_object_create_event(payload)
        return src_bucket, object_name, None

    raise Exception("Unable to parse payload: expected JSON object")


def _object_storage_client():
    signer = oci.auth.signers.get_resource_principals_signer()
    return oci.object_storage.ObjectStorageClient(config={}, signer=signer)


def _download_object(client, namespace: str, bucket: str, obj: str) -> bytes:
    resp = client.get_object(namespace, bucket, obj)
    return resp.data.content


def _upload_object(client, namespace: str, bucket: str, obj: str, content: bytes):
    client.put_object(
        namespace_name=namespace,
        bucket_name=bucket,
        object_name=obj,
        put_object_body=content,
        content_type="image/jpeg",
        cache_control="public, max-age=31536000, immutable",
    )


def _variant_object_name(variant: str, object_name: str) -> str:
    # Store resized variants under explicit prefixes in the same bucket.
    # Example: 1200/authors/<...>/img.jpg
    return f"{variant}/{object_name.lstrip('/')}"


def _resize_jpeg(src_path: str, dst_path: str, max_dim: int = 1200, quality: int = 82):
    """Resize to max_dim on the long edge without upscaling."""
    with Image(filename=src_path) as img:
        img.auto_orient()
        if img.width >= img.height:
            if img.width > max_dim:
                img.transform(resize=f"{max_dim}x")
        else:
            if img.height > max_dim:
                img.transform(resize=f"x{max_dim}")

        img.format = "jpeg"
        img.compression_quality = quality
        img.interlace_scheme = "plane"
        img.save(filename=dst_path)


def handler(ctx, data: Optional[io.BytesIO] = None):
    try:
        raw = data.getvalue().decode("utf-8") if data else "{}"
        payload = json.loads(raw)

        if payload == {}:
            return response.Response(
                ctx,
                response_data=json.dumps({"ok": True, "warm": True}),
                headers={"Content-Type": "application/json"},
            )

        _log_payload(payload, raw)

        src_bucket, object_name, dst_bucket_override = parse_invocation_payload(payload)
        namespace = _env("OCI_OBJECT_STORAGE_NAMESPACE")
        dst_bucket = dst_bucket_override or _env("OCI_DST_BUCKET")

        logger.info("Running with namespace: %s, dest bucket: %s" % (namespace, dst_bucket))

        logger.info('Making object storage client...')
        client = _object_storage_client()
        logger.info('Downloading object...')
        original_bytes = _download_object(client, namespace, src_bucket, object_name)

        logger.info('Writing tmp directory...')
        with tempfile.TemporaryDirectory() as td:
            original_path = os.path.join(td, "original")
            resized_1200_path = os.path.join(td, "resized-1200.jpg")
            resized_600_path = os.path.join(td, "resized-600.jpg")

            with open(original_path, "wb") as f:
                f.write(original_bytes)

            logger.info('Resizing jpg (1200)...')
            _resize_jpeg(original_path, resized_1200_path, max_dim=1200, quality=82)

            logger.info('Resizing jpg (600)...')
            _resize_jpeg(original_path, resized_600_path, max_dim=600, quality=82)

            with open(resized_1200_path, "rb") as f:
                resized_1200_bytes = f.read()

            with open(resized_600_path, "rb") as f:
                resized_600_bytes = f.read()

        obj_1200 = _variant_object_name("1200", object_name)
        obj_600 = _variant_object_name("600", object_name)

        logger.info('Uploading 1200 variant to dest bucket...')
        _upload_object(client, namespace, dst_bucket, obj_1200, resized_1200_bytes)

        logger.info('Uploading 600 variant to dest bucket...')
        _upload_object(client, namespace, dst_bucket, obj_600, resized_600_bytes)

        logger.info('Returning response...')
        logger.info(json.dumps(
                {
                    "ok": True,
                    "sourceBucket": src_bucket,
                    "destBucket": dst_bucket,
                    "objectName": object_name,
                    "destObject1200": obj_1200,
                    "destObject600": obj_600,
                }
            ))
        return response.Response(
            ctx,
            response_data=json.dumps(
                {
                    "ok": True,
                    "sourceBucket": src_bucket,
                    "destBucket": dst_bucket,
                    "objectName": object_name,
                    "destObject1200": obj_1200,
                    "destObject600": obj_600,
                }
            ),
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        logger.error(e)
        return response.Response(
            ctx,
            response_data=json.dumps({"ok": False, "error": str(e)}),
            headers={"Content-Type": "application/json"},
            status_code=500,
        )

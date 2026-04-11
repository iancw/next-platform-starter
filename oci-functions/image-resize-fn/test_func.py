import io
import json
import types

import pytest


import sys
import types as pytypes


class _FakeFDKResponse:
    class Response:
        def __init__(self, ctx, response_data=None, headers=None, status_code=200):
            self.ctx = ctx
            self.body = response_data
            self.headers = headers or {}
            self.status_code = status_code


fdk_mod = pytypes.ModuleType("fdk")
fdk_mod.response = _FakeFDKResponse
sys.modules.setdefault("fdk", fdk_mod)

oci_mod = pytypes.ModuleType("oci")
oci_mod.auth = types.SimpleNamespace(
    signers=types.SimpleNamespace(get_resource_principals_signer=lambda: None)
)
oci_mod.object_storage = types.SimpleNamespace(ObjectStorageClient=lambda config, signer: None)
sys.modules.setdefault("oci", oci_mod)

wand_mod = pytypes.ModuleType("wand")
wand_image_mod = pytypes.ModuleType("wand.image")
wand_image_mod.Image = object
wand_mod.image = wand_image_mod
sys.modules.setdefault("wand", wand_mod)
sys.modules.setdefault("wand.image", wand_image_mod)


import func


def _mk_ctx():
    # fdk.response.Response only needs ctx to exist; handler doesn't read fields.
    return types.SimpleNamespace()


def test_parse_invocation_payload_accepts_manual_payload_with_override():
    src, obj, dst = func.parse_invocation_payload(
        {"sourceBucket": "src-b", "objectName": "path/to/img.jpg", "destinationBucket": "dst-b"}
    )
    assert src == "src-b"
    assert obj == "path/to/img.jpg"
    assert dst == "dst-b"


def test_parse_invocation_payload_accepts_legacy_event_payload():
    payload = {
        "data": {
            "resourceName": "p/q.jpg",
            "additionalDetails": {"bucketName": "legacy-src"},
        }
    }
    src, obj, dst = func.parse_invocation_payload(payload)
    assert src == "legacy-src"
    assert obj == "p/q.jpg"
    assert dst is None


def test_parse_invocation_payload_accepts_event_payload_with_object_name_in_additional_details():
    payload = {
        "data": {
            "additionalDetails": {
                "bucketName": "legacy-src",
                "objectName": "nested/path.jpg",
            }
        }
    }
    src, obj, dst = func.parse_invocation_payload(payload)
    assert src == "legacy-src"
    assert obj == "nested/path.jpg"
    assert dst is None


def test_parse_invocation_payload_rejects_invalid_payload_missing_required_fields():
    with pytest.raises(Exception):
        func.parse_invocation_payload({"destinationBucket": "only-dst"})


def test_handler_manual_payload_uses_override_bucket_and_does_resize_workflow(monkeypatch):
    # Arrange: set env vars (dst bucket should be overridden by payload)
    monkeypatch.setenv("OCI_OBJECT_STORAGE_NAMESPACE", "ns")
    monkeypatch.setenv("OCI_DST_BUCKET", "env-dst")

    calls = {"download": None, "uploads": [], "resize": []}

    class FakeClient:
        pass

    def fake_client():
        return FakeClient()

    def fake_download(client, namespace, bucket, obj):
        calls["download"] = (namespace, bucket, obj)
        return b"original-bytes"

    def fake_resize(src_path, dst_path, max_dim=1200, quality=82):
        calls["resize"].append({"dst_path": dst_path, "max_dim": max_dim, "quality": quality})
        # write something so handler can read resized file
        with open(dst_path, "wb") as f:
            f.write(f"resized-{max_dim}".encode("utf-8"))

    def fake_upload(client, namespace, bucket, obj, content):
        calls["uploads"].append((namespace, bucket, obj, content))

    monkeypatch.setattr(func, "_object_storage_client", fake_client)
    monkeypatch.setattr(func, "_download_object", fake_download)
    monkeypatch.setattr(func, "_resize_jpeg", fake_resize)
    monkeypatch.setattr(func, "_upload_object", fake_upload)

    payload = {"sourceBucket": "src-b", "objectName": "x.jpg", "destinationBucket": "manual-dst"}
    data = io.BytesIO(json.dumps(payload).encode("utf-8"))

    # Act
    resp = func.handler(_mk_ctx(), data)

    # Assert
    assert json.loads(resp.body)["ok"] is True
    assert calls["download"] == ("ns", "src-b", "x.jpg")

    # should resize twice (1200 + 600)
    assert [r["max_dim"] for r in calls["resize"]] == [1200, 600]

    # should upload both variants under explicit prefixes in the same bucket
    assert len(calls["uploads"]) == 2
    uploaded_names = [u[2] for u in calls["uploads"]]
    assert "1200/x.jpg" in uploaded_names
    assert "600/x.jpg" in uploaded_names
    for namespace, bucket, obj, content in calls["uploads"]:
        assert namespace == "ns"
        assert bucket == "manual-dst"
        if obj == "1200/x.jpg":
            assert content == b"resized-1200"
        elif obj == "600/x.jpg":
            assert content == b"resized-600"
        else:
            raise AssertionError(f"Unexpected uploaded object name: {obj}")


def test_handler_empty_payload_returns_warm_response_without_oci_calls(monkeypatch):
    oci_called = {"value": False}

    def fake_client():
        oci_called["value"] = True
        raise AssertionError("OCI client should not be created for warm-up")

    monkeypatch.setattr(func, "_object_storage_client", fake_client)

    import io
    data = io.BytesIO(b"{}")
    resp = func.handler(_mk_ctx(), data)

    body = json.loads(resp.body)
    assert body["ok"] is True
    assert body["warm"] is True
    assert resp.status_code == 200
    assert not oci_called["value"]

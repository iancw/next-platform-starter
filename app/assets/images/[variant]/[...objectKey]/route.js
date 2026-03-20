import { NextResponse } from 'next/server';

const ALLOWED_VARIANTS = new Set(['original', '1200', '600']);

export const dynamic = 'force-dynamic';

function isBlank(value) {
  return value == null || String(value).trim() === '';
}

function env(name) {
  const raw = process.env[name];
  if (isBlank(raw)) return null;
  return String(raw);
}

function getRequiredEnv(name) {
  const value = env(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function ociObjectUrl({ region, namespace, bucket, objectKey }) {
  const encodedKey = encodeURIComponent(objectKey);
  return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucket}/o/${encodedKey}`;
}

function pickCacheControl() {
  return 'public, max-age=31536000, immutable';
}

function buildConditionalHeaders(request) {
  const headers = {};
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch) headers['if-none-match'] = ifNoneMatch;
  const ifModifiedSince = request.headers.get('if-modified-since');
  if (ifModifiedSince) headers['if-modified-since'] = ifModifiedSince;
  return headers;
}

async function handleProxy(request, params, method) {
  const resolvedParams = await params;
  const { variant, objectKey } = resolvedParams;
  if (!ALLOWED_VARIANTS.has(variant)) {
    return new NextResponse('Bad Request: invalid variant', { status: 400 });
  }

  const keyParts = Array.isArray(objectKey) ? objectKey : [objectKey].filter(Boolean);
  if (keyParts.length === 0) {
    return new NextResponse('Bad Request: missing object key', { status: 400 });
  }

  try {
    const region = getRequiredEnv('OCI_REGION');
    const namespace = getRequiredEnv('OCI_OBJECT_STORAGE_NAMESPACE');
    const originalBucket = env('OCI_IMAGES_ORIGINAL_BUCKET')
    const processedBucket = env('OCI_IMAGES_PROCESSED_BUCKET')
    const bucket = variant === 'original' ? originalBucket : processedBucket;
    const upstreamObjectKey =
      variant === 'original' ? keyParts.join('/') : `${variant}/${keyParts.join('/')}`;

    const upstreamUrl = ociObjectUrl({
      region,
      namespace,
      bucket,
      objectKey: upstreamObjectKey,
    });

    const upstreamRes = await fetch(upstreamUrl, {
      method,
      headers: buildConditionalHeaders(request),
    });

    const headers = new Headers();
    headers.set('cache-control', pickCacheControl());
    headers.set('content-type', upstreamRes.headers.get('content-type') ?? 'image/jpeg');

    const etag = upstreamRes.headers.get('etag');
    if (etag) headers.set('etag', etag);
    const lastModified = upstreamRes.headers.get('last-modified');
    if (lastModified) headers.set('last-modified', lastModified);

    if ((env('NODE_ENV') ?? 'production') !== 'production') {
      headers.set('x-om-images-upstream', upstreamUrl);
    }

    if (upstreamRes.status === 304) {
      return new NextResponse(null, { status: 304, headers });
    }

    if (method === 'HEAD') {
      return new NextResponse(null, { status: upstreamRes.status, headers });
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(`Route error: ${message}`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}

export async function GET(request, context) {
  return handleProxy(request, context.params, 'GET');
}

export async function HEAD(request, context) {
  return handleProxy(request, context.params, 'HEAD');
}

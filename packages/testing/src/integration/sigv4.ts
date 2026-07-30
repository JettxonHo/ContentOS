import { createHash, createHmac } from 'node:crypto';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface SignedRequestOptions {
  method: 'GET' | 'PUT' | 'DELETE' | 'POST';
  url: string;
  credentials: AwsCredentials;
  body?: string;
  region?: string;
  service?: string;
  headers?: Record<string, string>;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function encodePath(pathname: string): string {
  const path = pathname === '' ? '/' : pathname;
  return (
    path
      .split('/')
      // URL.pathname is already percent-encoded. Decode each segment before
      // canonical re-encoding so keys such as spaces or `&` are signed exactly
      // once while `/` remains an object-key path separator.
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join('/')
  );
}

function encodeQuery(query: string): string {
  if (query === '') {
    return '';
  }
  return Array.from(new URLSearchParams(query).entries())
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .sort()
    .join('&');
}

/**
 * Minimal AWS SigV4 signer built only from the Node.js standard library. The
 * credential values stay in process memory and never appear in argv, logs, or
 * the repository. Used to prove the S3-compatible endpoint honors SigV4 auth.
 */
export async function signedFetch(options: SignedRequestOptions): Promise<Response> {
  const region = options.region ?? 'us-east-1';
  const service = options.service ?? 's3';
  const body = options.body ?? '';
  const url = new URL(options.url);
  const payloadHash = sha256Hex(body);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateShort = amzDate.slice(0, 8);

  const canonicalUri = encodePath(url.pathname);
  const canonicalQuery = encodeQuery(url.search.replace(/^\?/, ''));

  const extraHeaders: Record<string, string> = {};
  for (const [name, value] of Object.entries(options.headers ?? {})) {
    extraHeaders[name.toLowerCase()] = value.trim();
  }
  const headerMap: Record<string, string> = {
    host: url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...extraHeaders,
  };
  const signedHeaderNames = Object.keys(headerMap).sort();
  const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headerMap[name]}\n`).join('');
  const signedHeaders = signedHeaderNames.join(';');
  const canonicalRequest = [
    options.method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${dateShort}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');

  const kDate = hmac(Buffer.from(`AWS4${options.credentials.secretAccessKey}`, 'utf8'), dateShort);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${options.credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    ...headerMap,
    Authorization: authorization,
  };

  const init: RequestInit = { method: options.method, headers };
  if (body !== '') {
    init.body = body;
  }

  return fetch(options.url, init);
}

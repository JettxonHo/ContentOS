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
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function encodePath(pathname: string): string {
  const path = pathname === '' ? '/' : pathname;
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function encodeQuery(query: string): string {
  if (query === '') {
    return '';
  }
  return query
    .split('&')
    .map((pair) => {
      const [key, value] = pair.split('=');
      const encodedKey = encodeURIComponent(key ?? '');
      const encodedValue = value === undefined ? '' : encodeURIComponent(value);
      return `${encodedKey}=${encodedValue}`;
    })
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
  const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
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
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: authorization,
  };

  const init: RequestInit = { method: options.method, headers };
  if (body !== '') {
    init.body = body;
  }

  return fetch(options.url, init);
}

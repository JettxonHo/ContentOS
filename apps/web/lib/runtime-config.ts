const LOOPBACK_ORIGIN = /^http:\/\/127\.0\.0\.1:\d+$/;

export function getApiOrigin(): string {
  const raw = process.env.CONTENTOS_API_ORIGIN ?? 'http://127.0.0.1:3001';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid CONTENTOS_API_ORIGIN configuration');
  }
  if (url.origin !== raw || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new Error('Invalid CONTENTOS_API_ORIGIN configuration');
  }
  if (process.env.CONTENTOS_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('CONTENTOS_API_ORIGIN must use HTTPS in production');
  }
  if (process.env.CONTENTOS_ENV !== 'production' && !LOOPBACK_ORIGIN.test(url.origin)) {
    throw new Error('CONTENTOS_API_ORIGIN must use IPv4 loopback outside production');
  }
  return url.origin;
}

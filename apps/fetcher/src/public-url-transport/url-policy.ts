import { assertHostnameMayBeResolved, normalizeAndClassifyIpLiteral, type PublicAddress } from './address-policy.js';
import { PublicUrlTransportError } from './errors.js';

export interface NormalizedHop {
  readonly url: URL;
  readonly identity: string;
  readonly hostname: string;
  readonly hostnameForTls: string | null;
  readonly literal: PublicAddress | null;
  readonly port: 80 | 443;
  readonly hostHeader: string;
}

export function normalizeHop(submittedUrl: string, category: 'validation_blocked' | 'redirect_blocked'): NormalizedHop {
  try {
    if (submittedUrl.trim() !== submittedUrl) throw new Error('whitespace');
    const url = new URL(submittedUrl);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username !== '' ||
      url.password !== '' ||
      url.hostname === ''
    ) {
      throw new Error('unsupported URL');
    }
    url.hash = '';
    const hostname = url.hostname.startsWith('[')
      ? url.hostname.slice(1, -1).toLowerCase()
      : url.hostname.toLowerCase().replace(/\.$/u, '');
    if (hostname === '') throw new Error('empty host');
    const rawHost = rawHostname(submittedUrl);
    const literal = normalizeAndClassifyIpLiteral(hostname);
    if (literal !== null && rawHost.toLowerCase() !== hostname) {
      throw new PublicUrlTransportError('validation_blocked');
    }
    if (literal === null) assertHostnameMayBeResolved(hostname);
    url.hostname = literal?.family === 6 ? `[${hostname}]` : hostname;
    const parsedPort = url.port === '' ? (url.protocol === 'http:' ? 80 : 443) : Number(url.port);
    if ((url.protocol === 'http:' && parsedPort !== 80) || (url.protocol === 'https:' && parsedPort !== 443)) {
      throw new PublicUrlTransportError('validation_blocked');
    }
    const hostHeader = literal?.family === 6 ? `[${hostname}]` : hostname;
    return {
      url,
      identity: url.toString(),
      hostname,
      hostnameForTls: literal === null ? hostname : null,
      literal,
      port: parsedPort as 80 | 443,
      hostHeader,
    };
  } catch (error) {
    if (error instanceof PublicUrlTransportError && category === 'validation_blocked') throw error;
    throw new PublicUrlTransportError(category);
  }
}

function rawHostname(submittedUrl: string): string {
  const authority = submittedUrl.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/iu)?.[1];
  if (authority === undefined || authority.includes('@')) throw new PublicUrlTransportError('validation_blocked');
  if (authority.startsWith('[')) {
    const closing = authority.indexOf(']');
    const port = authority.slice(closing + 1);
    if (closing === -1 || (port !== '' && !/^:[0-9]+$/u.test(port))) {
      throw new PublicUrlTransportError('validation_blocked');
    }
    return authority.slice(1, closing);
  }
  const [host, ...port] = authority.split(':');
  if (host === undefined || port.length > 1 || (port.length === 1 && port[0] === '')) {
    throw new PublicUrlTransportError('validation_blocked');
  }
  return host;
}

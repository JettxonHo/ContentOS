import { isIP } from 'node:net';

import { PublicUrlTransportError } from './errors.js';

export type AddressFamily = 4 | 6;

export interface PublicAddress {
  readonly address: string;
  readonly family: AddressFamily;
}

const IPV4_DENY_RANGES: readonly [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const IPV6_DENY_RANGES: readonly [string, number][] = [
  ['2001::', 23],
  ['2001:2::', 48],
  ['2001:10::', 28],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
];

const IPV6_ALLOW_OVERRIDES: readonly [string, number][] = [
  ['2001:1::1', 128],
  ['2001:1::2', 128],
  ['2001:1::3', 128],
  ['2001:3::', 32],
  ['2001:4:112::', 48],
  ['2001:20::', 28],
  ['2001:30::', 28],
];

const IPV4_ALLOW_OVERRIDES = new Set(['192.0.0.9', '192.0.0.10']);

export function normalizeAndClassifyIpLiteral(rawHost: string): PublicAddress | null {
  const address = rawHost.toLowerCase();
  const detectedFamily = isIP(address);
  if (detectedFamily === 0) return null;
  const family: AddressFamily = detectedFamily === 4 ? 4 : 6;

  const normalized = normalizePublicAddress({ address, family });
  if (normalized.address !== address) {
    throw new PublicUrlTransportError('validation_blocked');
  }
  return normalized;
}

export function assertPublicAddress(address: PublicAddress): void {
  normalizePublicAddress(address);
}

export function normalizePublicAddress(address: PublicAddress): PublicAddress {
  const value = address.address.toLowerCase();
  const detectedFamily = isIP(value);
  const family: AddressFamily = detectedFamily === 4 ? 4 : detectedFamily === 6 ? 6 : failInvalidAddress();
  if (family !== address.family) {
    throw new PublicUrlTransportError('validation_blocked');
  }

  if (address.family === 4) {
    const canonical = formatIpv4(parseIpv4(value));
    if (!isPublicIpv4(canonical)) throw new PublicUrlTransportError('validation_blocked');
    return { address: canonical, family: 4 };
  }

  const ipv6 = parseIpv6(value);
  if (!isPublicIpv6(ipv6)) throw new PublicUrlTransportError('validation_blocked');
  return { address: formatIpv6(ipv6), family: 6 };
}

function failInvalidAddress(): never {
  throw new PublicUrlTransportError('validation_blocked');
}

export function assertHostnameMayBeResolved(hostname: string): void {
  if (hostname === 'localhost') {
    throw new PublicUrlTransportError('validation_blocked');
  }
}

function isPublicIpv4(address: string): boolean {
  if (IPV4_ALLOW_OVERRIDES.has(address)) return true;
  const value = parseIpv4(address);
  return !IPV4_DENY_RANGES.some(([base, prefix]) => inCidr(value, parseIpv4(base), prefix, 32));
}

function isPublicIpv6(value: bigint): boolean {
  if (IPV6_ALLOW_OVERRIDES.some(([base, prefix]) => inCidr(value, parseIpv6(base), prefix, 128))) {
    return true;
  }
  if (!inCidr(value, parseIpv6('2000::'), 3, 128)) return false;
  return !IPV6_DENY_RANGES.some(([base, prefix]) => inCidr(value, parseIpv6(base), prefix, 128));
}

function parseIpv4(value: string): bigint {
  const octets = value.split('.');
  if (octets.length !== 4) throw new PublicUrlTransportError('validation_blocked');
  let result = 0n;
  for (const octet of octets) {
    if (!/^(?:0|[1-9][0-9]{0,2})$/u.test(octet)) {
      throw new PublicUrlTransportError('validation_blocked');
    }
    const parsed = Number(octet);
    if (parsed > 255) throw new PublicUrlTransportError('validation_blocked');
    result = (result << 8n) + BigInt(parsed);
  }
  return result;
}

function formatIpv4(value: bigint): string {
  return [24n, 16n, 8n, 0n].map((shift) => ((value >> shift) & 255n).toString()).join('.');
}

function parseIpv6(value: string): bigint {
  if (value.includes('%') || value.includes('.')) {
    throw new PublicUrlTransportError('validation_blocked');
  }
  const halves = value.split('::');
  if (halves.length > 2) throw new PublicUrlTransportError('validation_blocked');
  const left = halves[0] === '' ? [] : (halves[0]?.split(':') ?? []);
  const right = halves.length === 1 || halves[1] === '' ? [] : (halves[1]?.split(':') ?? []);
  const supplied = left.length + right.length;
  if (supplied > 8 || (halves.length === 1 && supplied !== 8)) {
    throw new PublicUrlTransportError('validation_blocked');
  }
  const groups = [...left, ...Array.from({ length: 8 - supplied }, () => '0'), ...right];
  let result = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/iu.test(group)) throw new PublicUrlTransportError('validation_blocked');
    result = (result << 16n) + BigInt(`0x${group}`);
  }
  return result;
}

function formatIpv6(value: bigint): string {
  const groups = Array.from({ length: 8 }, (_, index) => ((value >> BigInt((7 - index) * 16)) & 65535n).toString(16));
  let bestStart = -1;
  let bestLength = 0;
  for (let index = 0; index < groups.length;) {
    if (groups[index] !== '0') {
      index += 1;
      continue;
    }
    const start = index;
    while (groups[index] === '0') index += 1;
    if (index - start > bestLength) {
      bestStart = start;
      bestLength = index - start;
    }
  }
  if (bestLength < 2) return groups.join(':');
  const head = groups.slice(0, bestStart).join(':');
  const tail = groups.slice(bestStart + bestLength).join(':');
  return head === '' && tail === '' ? '::' : `${head}::${tail}`;
}

function inCidr(value: bigint, base: bigint, prefix: number, width: number): boolean {
  const shift = BigInt(width - prefix);
  return value >> shift === base >> shift;
}

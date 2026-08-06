import { parse } from 'parse5';

import { FetcherCandidateError, defineFetcherCandidate, type FetcherCandidate } from '@contentos/core';

import type { VerifiedFetchResponse } from '../public-url-transport/index.js';

export class FetcherCandidateExtractionError extends Error {
  constructor(readonly category: 'unsupported_content') {
    super(category);
    this.name = 'FetcherCandidateExtractionError';
  }
}

interface HtmlNode {
  readonly nodeName: string;
  readonly value?: string;
  readonly childNodes?: readonly HtmlNode[];
}

const SUPPRESSED_SUBTREES = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'object',
  'embed',
  'svg',
  'canvas',
]);

const BLOCK_ELEMENTS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
  'caption',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  'menu',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
  'br',
]);

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/gu, '\n');
}

function normalizeHtmlText(text: string): string {
  const normalized = normalizeLineEndings(text).replace(/\s+/gu, (run) => (run.includes('\n') ? '\n' : ' '));
  return normalized.replace(/\n+/gu, '\n').trim();
}

function collectHtmlText(node: HtmlNode, pieces: string[]): void {
  if (node.nodeName === '#text') {
    pieces.push(node.value ?? '');
    return;
  }
  const elementName = node.nodeName.toLowerCase();
  if (SUPPRESSED_SUBTREES.has(elementName)) return;
  const block = BLOCK_ELEMENTS.has(elementName);
  if (block) pieces.push('\n');
  for (const child of node.childNodes ?? []) collectHtmlText(child, pieces);
  if (block) pieces.push('\n');
}

export function decodeStrictUtf8(chunks: readonly Uint8Array[]): string {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    let text = '';
    for (const chunk of chunks) text += decoder.decode(chunk, { stream: true });
    text += decoder.decode();
    return text.startsWith('\ufeff') ? text.slice(1) : text;
  } catch {
    throw new FetcherCandidateExtractionError('unsupported_content');
  }
}

export function declaredCharsetIsUtf8(value: string | null): boolean {
  if (value === null) return true;
  const trimmed = value.trim();
  const unquoted = /^"([^"\r\n]+)"$/u.exec(trimmed)?.[1] ?? trimmed;
  const normalized = unquoted.trim().toLowerCase();
  return normalized === 'utf-8' || normalized === 'utf8';
}

export function extractFetcherCandidate(
  contentType: VerifiedFetchResponse['contentType'],
  decodedText: string,
): FetcherCandidate {
  if (contentType === 'text/plain' || contentType === 'text/markdown') {
    return defineFetcherCandidate(normalizeLineEndings(decodedText));
  }
  try {
    const pieces: string[] = [];
    collectHtmlText(parse(decodedText) as unknown as HtmlNode, pieces);
    return defineFetcherCandidate(normalizeHtmlText(pieces.join('')));
  } catch (error) {
    if (error instanceof FetcherCandidateError) throw error;
    throw new FetcherCandidateExtractionError('unsupported_content');
  }
}

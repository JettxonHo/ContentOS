import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

type PostcssProcessor = (
  plugins: Array<{ postcssPlugin: string; Once(root: { append(node: object): void }): void }>,
) => {
  process(css: string, options: { from: undefined }): Promise<{ css: string }>;
};

type SharpImage = {
  metadata(): Promise<{ channels?: number; format?: string; height?: number; width?: number }>;
  png(): SharpImage;
  resize(width: number, height: number): SharpImage;
  toBuffer(): Promise<Buffer>;
};

type SharpFactory = {
  (input: Buffer): SharpImage;
  (input: {
    create: {
      background: { alpha: number; b: number; g: number; r: number };
      channels: number;
      height: number;
      width: number;
    };
  }): SharpImage;
};

const requireFromWeb = createRequire(new URL('../../../../apps/web/package.json', import.meta.url));
const requireFromNext = createRequire(requireFromWeb.resolve('next/package.json'));

describe('Next transitive dependency compatibility', () => {
  it('processes CSS and images through the Web workspace dependency context', async () => {
    const postcss = requireFromNext('postcss') as PostcssProcessor;
    const sharp = requireFromNext('sharp') as SharpFactory;

    expect(requireFromNext.resolve('postcss')).toContain('/node_modules/postcss/');
    expect(requireFromNext.resolve('sharp')).toContain('/node_modules/sharp/');

    const css = await postcss([
      {
        postcssPlugin: 'contentos-next-transitive-compatibility',
        Once(root) {
          root.append({ prop: '--contentos-compatibility', value: 'verified' });
        },
      },
    ]).process(':root { color: rebeccapurple; }', { from: undefined });

    expect(css.css).toContain('--contentos-compatibility: verified');

    const transformedImage = await sharp({
      create: {
        background: { alpha: 1, b: 48, g: 96, r: 192 },
        channels: 4,
        height: 1,
        width: 1,
      },
    })
      .resize(2, 2)
      .png()
      .toBuffer();
    const metadata = await sharp(transformedImage).metadata();

    expect(metadata).toMatchObject({ channels: 4, format: 'png', height: 2, width: 2 });
  });
});

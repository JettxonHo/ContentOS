import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Ajv2020, type AnySchema } from 'ajv/dist/2020.js';

import type { NormalizedBodyValidator } from '@contentos/core';

/**
 * API-composition adapter for the Core-owned validator port. The schema is
 * compiled once at startup, before Source commands are accepted. Keeping this
 * adapter outside Contracts prevents a Contracts -> Core dependency cycle.
 */
export class AjvNormalizedBodyValidator implements NormalizedBodyValidator {
  private readonly validateFn: (data: unknown) => boolean;

  constructor() {
    const schemaPath = resolve(__dirname, '../../../../schemas/source/normalized-source-v1.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as AnySchema;
    this.validateFn = new Ajv2020({ allErrors: true, strict: true }).compile(schema) as (data: unknown) => boolean;
  }

  validate(body: unknown): body is { readonly text: string } {
    return this.validateFn(body);
  }
}

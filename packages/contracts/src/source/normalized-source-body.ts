/**
 * Normalized Source body structure persisted as JSON in the Version and
 * Working Copy `body` column. This TypeScript interface must stay
 * synchronized with `schemas/source/normalized-source-v1.json`.
 *
 * The synchronization test in `source-body-schema.test.ts` validates
 * that a representative fixture of this type round-trips through the
 * JSON Schema.
 */
export interface NormalizedSourceBody {
  readonly text: string;
}

export const NORMALIZED_SOURCE_SCHEMA_VERSION = 'source/normalized/v1' as const;

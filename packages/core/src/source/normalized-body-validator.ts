import type { NormalizedSourceBody } from './source-values.js';

/**
 * Core-owned Port for validating a Normalized Source body against the
 * versioned JSON Schema. The adapter implementation uses the approved
 * Ajv dependency and is injected from composition; Core remains free
 * of Ajv and transport dependencies.
 */
export interface NormalizedBodyValidator {
  /**
   * Returns `true` if the body conforms to the versioned Normalized
   * Source Body JSON Schema. Used before Version creation and before
   * Approval to prove the persisted body is valid.
   */
  validate(body: unknown): body is NormalizedSourceBody;
}

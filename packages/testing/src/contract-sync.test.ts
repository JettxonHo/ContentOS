import { describe, expect, it } from 'vitest';

import { SOURCE_CAPTURE_TYPES, SOURCE_ROLES, SOURCE_TYPES } from '@contentos/core';
import { SOURCE_ROLES_DTO, SOURCE_TYPES_DTO } from '@contentos/contracts';

/**
 * Boundary synchronization gate (M2-SRC-002): the API DTO enums must track
 * the Domain Core enums exactly, so a new Source type, capture type, or role
 * cannot reach one layer without the other.
 */
describe('source enum boundary synchronization', () => {
  it('keeps SOURCE_TYPES_DTO synchronized with Core SOURCE_TYPES', () => {
    expect([...SOURCE_TYPES_DTO]).toEqual([...SOURCE_TYPES]);
  });

  it('keeps SOURCE_ROLES_DTO synchronized with Core SOURCE_ROLES', () => {
    expect([...SOURCE_ROLES_DTO]).toEqual([...SOURCE_ROLES]);
  });

  it('keeps Core capture types synchronized with Core source types in the MVP', () => {
    // In the MVP each input path uses one value in both dimensions
    // (pasted_text, uploaded_text). A future divergence must be reviewed.
    expect([...SOURCE_CAPTURE_TYPES]).toEqual([...SOURCE_TYPES]);
  });
});

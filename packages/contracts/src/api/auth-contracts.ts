import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { PortableJsonSchema } from './error-contract.js';

export interface AuthLoginRequest {
  readonly password: string;
}

export interface AuthSessionResponse {
  readonly data: {
    readonly principal: {
      readonly kind: 'user';
      readonly userId: string;
    };
    readonly expiresAt: string;
  };
}

export interface ContractValidationError {
  readonly path: string;
  readonly keyword: string;
}

const authLoginRequestSchema: PortableJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: ['password'],
  properties: {
    password: { type: 'string', minLength: 1, maxLength: 1024 },
  },
};

export const authSessionResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['principal', 'expiresAt'],
      properties: {
        principal: {
          type: 'object',
          additionalProperties: false,
          required: ['kind', 'userId'],
          properties: {
            kind: { type: 'string', enum: ['user'] },
            userId: { type: 'string' },
          },
        },
        expiresAt: { type: 'string' },
      },
    },
  },
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateAuthLogin = ajv.compile<AuthLoginRequest>(authLoginRequestSchema) as ValidateFunction<AuthLoginRequest>;

function safeErrors(errors: ErrorObject[] | null | undefined): readonly ContractValidationError[] {
  return (errors ?? []).map((error) => ({ path: error.instancePath || '/', keyword: error.keyword }));
}

export function parseAuthLoginRequest(
  input: unknown,
):
  | { readonly ok: true; readonly value: AuthLoginRequest }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] } {
  if (validateAuthLogin(input)) {
    return { ok: true, value: input };
  }
  return { ok: false, errors: safeErrors(validateAuthLogin.errors) };
}

export { authLoginRequestSchema };

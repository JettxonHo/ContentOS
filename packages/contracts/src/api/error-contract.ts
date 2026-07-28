export const API_ERROR_VERSION = '1' as const;

export const API_ERROR_CODES = [
  'INVALID_REQUEST',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'ORIGIN_DENIED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorResponse {
  readonly error: {
    readonly version: typeof API_ERROR_VERSION;
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly correlationId: string;
    readonly details?: readonly {
      readonly path: string;
      readonly keyword: string;
    }[];
  };
}

export interface PortableJsonSchema {
  readonly $schema?: string;
  readonly type: 'object' | 'array' | 'string' | 'integer';
  readonly additionalProperties?: boolean;
  readonly required?: string[];
  readonly properties?: Record<string, PortableJsonSchema>;
  readonly items?: PortableJsonSchema;
  readonly enum?: unknown[];
  readonly minLength?: number;
  readonly maxLength?: number;
}

export const apiErrorSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['version', 'code', 'message', 'correlationId'],
      properties: {
        version: { type: 'string', enum: [API_ERROR_VERSION] },
        code: { type: 'string', enum: [...API_ERROR_CODES] },
        message: { type: 'string' },
        correlationId: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['path', 'keyword'],
            properties: {
              path: { type: 'string' },
              keyword: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  correlationId: string,
  details?: ApiErrorResponse['error']['details'],
): ApiErrorResponse {
  return {
    error: {
      version: API_ERROR_VERSION,
      code,
      message,
      correlationId,
      ...(details === undefined ? {} : { details }),
    },
  };
}

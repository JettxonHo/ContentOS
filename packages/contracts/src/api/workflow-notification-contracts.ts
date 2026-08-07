import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';

export interface WorkflowNotificationData {
  readonly workflowInstanceId: string | null;
  readonly latestSequence: number;
}

const workflowInstanceIdPattern =
  '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[1-5][0-9A-Fa-f]{3}-[89AaBb][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$';

export const workflowNotificationDataSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['workflowInstanceId', 'latestSequence'],
  properties: {
    workflowInstanceId: {
      anyOf: [{ type: 'string', pattern: workflowInstanceIdPattern }, { type: 'null' }],
    },
    latestSequence: { type: 'integer', minimum: 0 },
  },
};

const validator = new Ajv2020({ allErrors: true, strict: true }).compile<WorkflowNotificationData>(
  workflowNotificationDataSchema,
) as ValidateFunction<WorkflowNotificationData>;

function safeErrors(errors: ErrorObject[] | null | undefined): readonly ContractValidationError[] {
  return (errors ?? []).map((error) => ({ path: error.instancePath || '/', keyword: error.keyword }));
}

export function parseWorkflowNotificationData(
  input: unknown,
):
  | { readonly ok: true; readonly value: WorkflowNotificationData }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] } {
  if (validator(input)) return { ok: true, value: input };
  return { ok: false, errors: safeErrors(validator.errors) };
}

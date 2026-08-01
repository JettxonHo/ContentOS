import { describe, expect, it, vi } from 'vitest';

import { createDatabaseConnection } from './client.js';
import { DrizzleWorkflowDispatchRepository } from './workflow-dispatch-repository.js';

describe('Worker database runtime failure boundary', () => {
  it('handles an idle Pool error without exposing its diagnostic to the Worker repository', async () => {
    const connection = createDatabaseConnection('postgresql://worker:database-secret@127.0.0.1:5432/contentos');
    const repository = new DrizzleWorkflowDispatchRepository(connection);
    const rawError = new Error(
      'password database-secret failed for postgresql://worker:database-secret@127.0.0.1:5432/contentos\nstack details',
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => connection.pool.emit('error', rawError)).not.toThrow();
      await expect(repository.listDispatchedForReconciliation(10)).rejects.toMatchObject({
        message: 'database_unavailable',
      });
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      await connection.close();
    }
  });
});

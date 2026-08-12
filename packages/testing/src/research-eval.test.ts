import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FakeResearchProvider, validateResearchBody, type ApprovedResearchSource } from '@contentos/core';

interface ResearchEvalManifest {
  readonly schemaVersion: 'contentos-research-eval/v1';
  readonly dataset: {
    readonly id: 'research-core';
    readonly version: 1;
    readonly group: 'core_regression';
    readonly cases: readonly {
      readonly id: string;
      readonly inputs: readonly ApprovedResearchSource[];
      readonly goldConstraints: {
        readonly minimumResearchItems: number;
        readonly minimumOpenQuestions: number;
        readonly requiredEvidence: readonly {
          readonly sourceId: string;
          readonly sourceVersionId: string;
          readonly paragraphIndex: number;
        }[];
      };
    }[];
  };
  readonly configuration: {
    readonly id: string;
    readonly version: number;
    readonly agentSpec: string;
    readonly provider: string;
    readonly validator: string;
    readonly runtimePolicy: string;
    readonly dataset: string;
  };
  readonly run: {
    readonly id: string;
    readonly configuration: string;
    readonly dataset: string;
    readonly caseResults: readonly {
      readonly caseId: string;
      readonly result: 'passed';
      readonly metrics: { readonly grounding: 1; readonly coverage: 1; readonly structure: 1 };
      readonly criticalFailures: readonly string[];
    }[];
    readonly aggregate: {
      readonly passedCases: number;
      readonly totalCases: number;
      readonly criticalFailures: number;
      readonly providerCostUsd: number;
    };
  };
  readonly humanReview: {
    readonly id: string;
    readonly run: string;
    readonly reviewer: string;
    readonly decision: 'accepted';
    readonly notes: string;
  };
  readonly baseline: {
    readonly id: string;
    readonly acceptedRun: string;
    readonly decision: 'accepted';
  };
}

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'docs/quality/evals/research-core-v1.json'), 'utf8'),
) as ResearchEvalManifest;

describe('Research core Eval baseline v1', () => {
  it('pins the versioned Dataset, Configuration, Run, Human Review, and Baseline identities', () => {
    expect(manifest).toMatchObject({
      schemaVersion: 'contentos-research-eval/v1',
      dataset: { id: 'research-core', version: 1, group: 'core_regression' },
      configuration: {
        id: 'research-fake-core',
        version: 1,
        agentSpec: 'research/v1',
        provider: 'fake-research/v1',
        validator: 'research-v1',
        runtimePolicy: 'deterministic-local-zero-cost',
        dataset: 'research-core@1',
      },
      run: {
        id: 'research-core-v1-baseline-run-001',
        configuration: 'research-fake-core@1',
        dataset: 'research-core@1',
      },
      humanReview: {
        run: 'research-core-v1-baseline-run-001',
        reviewer: '/root/g4_mvp_acceptance_review',
        decision: 'accepted',
      },
      baseline: {
        id: 'research-core-v1-baseline',
        acceptedRun: 'research-core-v1-baseline-run-001',
        decision: 'accepted',
      },
    });
  });

  it('reproduces every recorded case and aggregate without a critical failure or Provider cost', async () => {
    const provider = new FakeResearchProvider();
    const reproduced = [];

    for (const evalCase of manifest.dataset.cases) {
      const body = validateResearchBody(JSON.parse(await provider.generate(evalCase.inputs)));
      const evidence = body.items.flatMap((item) => item.evidence);
      const grounding = evidence.every((entry) =>
        evalCase.inputs.some(
          (source) => source.sourceId === entry.sourceId && source.sourceVersionId === entry.sourceVersionId,
        ),
      );
      const coverage = evalCase.goldConstraints.requiredEvidence.every((required) =>
        evidence.some(
          (entry) =>
            entry.sourceId === required.sourceId &&
            entry.sourceVersionId === required.sourceVersionId &&
            entry.paragraphIndex === required.paragraphIndex,
        ),
      );
      const structure =
        body.items.length >= evalCase.goldConstraints.minimumResearchItems &&
        body.openQuestions.length >= evalCase.goldConstraints.minimumOpenQuestions;

      reproduced.push({
        caseId: evalCase.id,
        result: 'passed',
        metrics: { grounding: grounding ? 1 : 0, coverage: coverage ? 1 : 0, structure: structure ? 1 : 0 },
        criticalFailures: grounding && coverage && structure ? [] : ['research-eval-constraint-failed'],
      });
    }

    expect(reproduced).toEqual(manifest.run.caseResults);
    expect(manifest.run.aggregate).toEqual({
      passedCases: reproduced.length,
      totalCases: manifest.dataset.cases.length,
      criticalFailures: 0,
      providerCostUsd: 0,
    });
  });
});

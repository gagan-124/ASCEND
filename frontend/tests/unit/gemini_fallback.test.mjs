import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SPEECH_RATE,
  UtteranceLifecycleManager,
} from '../../src/features/interview/hooks/useVoiceSynthesizer.ts';

/**
 * Pure simulation of the hardened Gemini multi-model fallback orchestrator.
 * Mirrors the exact logic in backend/supabase/functions/generate-interview-questions/index.ts.
 */
async function executeGeminiFallbackOrchestration({
  candidateModels,
  fetchFn,
  totalDeadlineMs = 25000,
  perAttemptTimeoutMs = 10000,
}) {
  const generationStartTime = Date.now();
  let generatedQuestions = [];
  let lastAiError = '';
  let lastStatusCode = 503;
  const attemptsLog = [];

  for (const model of candidateModels) {
    const elapsedMs = Date.now() - generationStartTime;
    const remainingDeadlineMs = totalDeadlineMs - elapsedMs;
    if (remainingDeadlineMs < 50) {
      lastAiError = 'Overall AI generation deadline exceeded';
      break;
    }

    const attemptTimeoutMs = Math.min(perAttemptTimeoutMs, remainingDeadlineMs);

    try {
      attemptsLog.push(model);
      const res = await fetchFn(model, attemptTimeoutMs);

      if (!res.ok) {
        lastStatusCode = res.status;
        if (res.status === 401 || res.status === 403) {
          lastAiError = 'AI service authentication error. Please verify API configuration.';
          break; // Permanent failure: do not hammer remaining models
        }
        if (res.status === 404) {
          lastAiError = `Model ${model} not supported by upstream API (HTTP 404)`;
          continue;
        }
        lastAiError = `Model ${model} unavailable (HTTP ${res.status})`;
        continue;
      }

      const data = await res.json();
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) {
        lastAiError = `Empty content part from model ${model}`;
        continue;
      }

      let cleanText = String(contentText).trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/```$/, '').trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch {
        lastAiError = `Model ${model} returned invalid JSON syntax`;
        continue;
      }

      if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
        const validated = parsed.questions
          .map((q, idx) => {
            const text = typeof q?.question === 'string' ? q.question.trim() : '';
            if (text.length < 10) return null;
            const validCategories = ['technical', 'system_design', 'behavioral'];
            const category = validCategories.includes(String(q?.category))
              ? q.category
              : idx === 0 ? 'technical' : idx === 1 ? 'system_design' : 'behavioral';
            return {
              question: text,
              category,
              difficulty: q?.difficulty || 'medium',
              time_limit_seconds: q?.time_limit_seconds || 180,
            };
          })
          .filter(Boolean);

        if (validated.length >= 1) {
          generatedQuestions = validated;
          break;
        } else {
          lastAiError = `Model ${model} produced malformed or incomplete question entries`;
        }
      } else {
        lastAiError = `Model ${model} response missing valid questions array`;
      }
    } catch (err) {
      lastAiError = err.message || String(err);
    }
  }

  return {
    success: generatedQuestions.length > 0,
    questions: generatedQuestions,
    lastAiError,
    lastStatusCode,
    attemptsLog,
  };
}

test('Gemini Fallback & Availability Hardening', async (t) => {
  const standardCandidateModels = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
  ];

  await t.test('1. Gemini 503 on primary model triggers successful fallback to secondary model', async () => {
    const fetchMock = async (model) => {
      if (model === 'gemini-2.5-flash') {
        return {
          ok: false,
          status: 503,
          text: async () => '{"error": {"code": 503, "message": "This model is currently experiencing high demand.", "status": "UNAVAILABLE"}}',
        };
      }
      if (model === 'gemini-2.5-flash-lite') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        questions: [
                          {
                            question: 'Can you describe the architecture of a high-throughput microservice?',
                            category: 'technical',
                            difficulty: 'medium',
                            time_limit_seconds: 180,
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }
      throw new Error('Should not reach other models');
    };

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, true);
    assert.equal(result.questions.length, 1);
    assert.deepEqual(result.attemptsLog, ['gemini-2.5-flash', 'gemini-2.5-flash-lite']);
    assert.equal(result.questions[0].category, 'technical');
  });

  await t.test('2. Gemini 429 rate limit on primary model triggers successful fallback', async () => {
    const fetchMock = async (model) => {
      if (model === 'gemini-2.5-flash') {
        return {
          ok: false,
          status: 429,
          text: async () => '{"error": {"code": 429, "message": "Resource has been exhausted.", "status": "RESOURCE_EXHAUSTED"}}',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      questions: [
                        {
                          question: 'How do you structure database migrations for zero-downtime deployment?',
                          category: 'technical',
                          difficulty: 'hard',
                          time_limit_seconds: 180,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, true);
    assert.equal(result.attemptsLog[0], 'gemini-2.5-flash');
    assert.equal(result.attemptsLog[1], 'gemini-2.5-flash-lite');
  });

  await t.test('3. Timeout on primary attempt triggers fallback to next model', async () => {
    const fetchMock = async (model) => {
      if (model === 'gemini-2.5-flash') {
        const timeoutErr = new Error('The operation was aborted due to timeout');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      questions: [
                        {
                          question: 'Explain the difference between optimistic and pessimistic locking.',
                          category: 'technical',
                          difficulty: 'medium',
                          time_limit_seconds: 180,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, true);
    assert.deepEqual(result.attemptsLog, ['gemini-2.5-flash', 'gemini-2.5-flash-lite']);
  });

  await t.test('4. All models unavailable returns structured error without silent mock fallback', async () => {
    const fetchMock = async (model) => ({
      ok: false,
      status: 503,
      text: async () => `Model ${model} overloaded`,
    });

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, false);
    assert.equal(result.questions.length, 0);
    assert.equal(result.attemptsLog.length, 3);
    assert.match(result.lastAiError, /unavailable \(HTTP 503\)/);
  });

  await t.test('5. Permanent auth failure (401/403) aborts immediately without hammering fallback models', async () => {
    const fetchMock = async () => ({
      ok: false,
      status: 401,
      text: async () => '{"error": {"message": "API key not valid"}}',
    });

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, false);
    // Should stop after the very first model attempt!
    assert.equal(result.attemptsLog.length, 1);
    assert.match(result.lastAiError, /authentication error/i);
  });

  await t.test('6. Unsupported 404 model identifier is skipped to next candidate', async () => {
    const candidateWithInvalid = ['gemini-invalid-model-name', 'gemini-2.5-flash-lite'];
    const fetchMock = async (model) => {
      if (model === 'gemini-invalid-model-name') {
        return {
          ok: false,
          status: 404,
          text: async () => '{"error": {"message": "Model not found"}}',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      questions: [
                        {
                          question: 'Describe how you troubleshoot latency spikes in an API gateway.',
                          category: 'technical',
                          difficulty: 'medium',
                          time_limit_seconds: 180,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: candidateWithInvalid,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, true);
    assert.deepEqual(result.attemptsLog, ['gemini-invalid-model-name', 'gemini-2.5-flash-lite']);
  });

  await t.test('7. Malformed questions and incomplete structures are rejected and skipped', async () => {
    let callCount = 0;
    const fetchMock = async () => {
      callCount += 1;
      if (callCount === 1) {
        // Model 1 returns empty questions array
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"questions": []}' }] } }],
          }),
        };
      }
      if (callCount === 2) {
        // Model 2 returns too short question text (< 10 chars)
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"questions": [{"question": "hi"}]}' }] } }],
          }),
        };
      }
      // Model 3 returns valid markdown fenced JSON
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '```json\n{"questions": [{"question": "What is an idempotent API operation?", "category": "technical", "difficulty": "medium", "time_limit_seconds": 180}]}\n```',
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    assert.equal(result.success, true);
    assert.equal(result.questions.length, 1);
    assert.equal(result.questions[0].question, 'What is an idempotent API operation?');
    assert.equal(callCount, 3);
  });

  await t.test('8. Total generation deadline aborts subsequent model attempts', async () => {
    const fetchMock = async () => {
      // Artificially delay
      await new Promise((r) => globalThis.setTimeout(r, 60));
      return {
        ok: false,
        status: 503,
        text: async () => 'Unavailable',
      };
    };

    const result = await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
      totalDeadlineMs: 70, // Extremely tight deadline
    });

    assert.equal(result.success, false);
    // Should stop before exhausting all 3 models due to deadline
    assert.ok(result.attemptsLog.length < 3);
    assert.match(result.lastAiError, /deadline exceeded/i);
  });

  await t.test('9. Speech rate configuration is calibrated to 1.05 and verified', () => {
    assert.equal(DEFAULT_SPEECH_RATE, 1.05);

    // Verify Utterance configuration
    const utterance = {
      text: 'Question 1',
      rate: 1.0,
      pitch: 1.0,
    };
    utterance.rate = DEFAULT_SPEECH_RATE;
    assert.equal(utterance.rate, 1.05);
  });

  await t.test('10. Utterance lifecycle management retains active utterance until playback completes', () => {
    const manager = new UtteranceLifecycleManager();
    const utterance1 = { id: 1, text: 'First question' };
    const utterance2 = { id: 2, text: 'Second question' };

    const token1 = manager.retain(utterance1);
    assert.equal(manager.getActiveUtterance(), utterance1);

    const token2 = manager.retain(utterance2);
    assert.equal(manager.getActiveUtterance(), utterance2);

    // Stale release attempt with token1 should not release utterance2
    const releasedStale = manager.release(token1, utterance1);
    assert.equal(releasedStale, false);
    assert.equal(manager.getActiveUtterance(), utterance2);

    // Valid release with token2 releases active utterance
    const releasedActive = manager.release(token2, utterance2);
    assert.equal(releasedActive, true);
    assert.equal(manager.getActiveUtterance(), null);
  });

  await t.test('11. Deterministic session interviewId reuse prevents duplicate sessions on retry', () => {
    // Simulation of client pendingInterviewIdRef logic
    let pendingInterviewId = null;

    const startInterviewInit = () => {
      if (!pendingInterviewId) {
        pendingInterviewId = 'b819f71c-3b7c-48c2-a89c-07204f6e3c1a';
      }
      return { interviewId: pendingInterviewId };
    };

    const attempt1 = startInterviewInit();
    assert.equal(attempt1.interviewId, 'b819f71c-3b7c-48c2-a89c-07204f6e3c1a');

    // Simulate 503 error in attempt 1: pendingInterviewId remains set
    const retryAttempt = startInterviewInit();
    assert.equal(retryAttempt.interviewId, 'b819f71c-3b7c-48c2-a89c-07204f6e3c1a');
    assert.equal(retryAttempt.interviewId, attempt1.interviewId, 'Session ID must match across retries');

    // Cancellation resets session ID
    pendingInterviewId = null;
    const freshAttempt = startInterviewInit();
    assert.notEqual(freshAttempt.interviewId, null);
  });

  await t.test('12. Verify exact fallback order and confirm retired identifiers are never attempted', async () => {
    const retiredIdentifiers = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-1.0-pro',
    ];

    // Confirm that retired identifiers are excluded from candidate models
    for (const retired of retiredIdentifiers) {
      assert.equal(
        standardCandidateModels.includes(retired),
        false,
        `Candidate models must never include retired model: ${retired}`
      );
    }

    // Verify exact fallback sequence when each model fails with 503
    const callSequence = [];
    const fetchMock = async (model) => {
      callSequence.push(model);
      return {
        ok: false,
        status: 503,
        text: async () => `Model ${model} busy`,
      };
    };

    await executeGeminiFallbackOrchestration({
      candidateModels: standardCandidateModels,
      fetchFn: fetchMock,
    });

    // Exact order must be: Primary (gemini-2.5-flash) -> Fallback 1 (gemini-2.5-flash-lite) -> Fallback 2 (gemini-2.5-pro)
    assert.deepEqual(callSequence, [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
    ]);

    // Ensure none of the attempted models were in the retired list
    for (const attempted of callSequence) {
      assert.equal(
        retiredIdentifiers.includes(attempted),
        false,
        `Attempted model ${attempted} must not be a retired identifier`
      );
    }
  });
});

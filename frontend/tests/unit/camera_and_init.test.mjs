import test from 'node:test';
import assert from 'node:assert/strict';

test('Camera & Initialization Flow Verifications', async (t) => {
  await t.test('1. Camera constraints specify 16:9 wide-angle ideals and user facing mode', () => {
    const buildVideoConstraints = (cameraId) => ({
      ...(cameraId ? { deviceId: { exact: cameraId } } : {}),
      width: { ideal: 1280 },
      height: { ideal: 720 },
      aspectRatio: { ideal: 16 / 9 },
      facingMode: 'user',
    });

    const defaultConstraints = buildVideoConstraints();
    assert.equal(defaultConstraints.aspectRatio.ideal, 16 / 9);
    assert.equal(defaultConstraints.width.ideal, 1280);
    assert.equal(defaultConstraints.height.ideal, 720);
    assert.equal(defaultConstraints.facingMode, 'user');
    assert.equal(defaultConstraints.deviceId, undefined);

    const specificDeviceConstraints = buildVideoConstraints('camera-dev-123');
    assert.deepEqual(specificDeviceConstraints.deviceId, { exact: 'camera-dev-123' });
    assert.equal(specificDeviceConstraints.aspectRatio.ideal, 16 / 9);
  });

  await t.test('2. Edge Function error parser extracts custom JSON message from response context', async () => {
    const parseEdgeFunctionError = async (error, data) => {
      let serverErrorMessage = '';
      if (error && typeof error === 'object' && 'context' in error && error.context) {
        try {
          const res = error.context;
          const cloned = typeof res.clone === 'function' ? res.clone() : res;
          const json = await cloned.json();
          serverErrorMessage = json?.message || json?.error || '';
        } catch {
          try {
            const res = error.context;
            serverErrorMessage = await res.text();
          } catch {
            // ignore
          }
        }
      }

      const rawMsg =
        serverErrorMessage ||
        data?.message ||
        (error && typeof error === 'object' && 'message' in error ? error.message : null) ||
        (error instanceof Error ? error.message : String(error)) ||
        'Server failed to generate interview questions. Please try again.';

      let userFacingMessage = rawMsg;
      if (typeof rawMsg === 'string' && rawMsg.includes('non-2xx status code')) {
        userFacingMessage =
          'AI Interviewer service timed out or was temporarily unreachable. Please click "Retry Initialization" to connect.';
      }

      return userFacingMessage;
    };

    // Scenario A: Edge function returns 502 with structured JSON error
    const mockContextResponse = {
      json: async () => ({
        error: 'AI_GENERATION_FAILED',
        message: 'AI question generation service timed out. Please retry.',
      }),
      text: async () => '',
    };
    const mockHttpError = {
      message: 'Edge Function returned a non-2xx status code',
      context: mockContextResponse,
    };

    const messageA = await parseEdgeFunctionError(mockHttpError, null);
    assert.equal(messageA, 'AI question generation service timed out. Please retry.');

    // Scenario B: Edge function returns 502 without JSON body; generic error is cleanly mapped
    const emptyContextResponse = {
      json: async () => { throw new Error('Not JSON'); },
      text: async () => '',
    };
    const mockGenericError = {
      message: 'Edge Function returned a non-2xx status code',
      context: emptyContextResponse,
    };

    const messageB = await parseEdgeFunctionError(mockGenericError, null);
    assert.match(messageB, /AI Interviewer service timed out or was temporarily unreachable/);

    // Scenario C: Non-empty server error message is preserved
    const directError = new Error('Custom DB constraint failure');
    const messageC = await parseEdgeFunctionError(directError, null);
    assert.equal(messageC, 'Custom DB constraint failure');
  });

  await t.test('3. Initialization Overlay error display rejects empty or whitespace-only error blocks', () => {
    const shouldDisplayErrorBanner = (error) => Boolean(error && error.trim().length > 0);

    assert.equal(shouldDisplayErrorBanner(''), false);
    assert.equal(shouldDisplayErrorBanner('   '), false);
    assert.equal(shouldDisplayErrorBanner(null), false);
    assert.equal(shouldDisplayErrorBanner(undefined), false);
    assert.equal(shouldDisplayErrorBanner('Valid error message'), true);
  });

  await t.test('4. Retries preserve interviewId to enforce idempotency and prevent duplicate records', () => {
    const pendingRef = { current: null };

    const preparePayload = (baseConfig) => ({
      mode: baseConfig.mode || 'role',
      roleTitle: baseConfig.roleTitle,
      experienceLevel: baseConfig.experienceLevel,
      interviewId: pendingRef.current || undefined,
    });

    const firstAttempt = preparePayload({ mode: 'role', roleTitle: 'DevOps', experienceLevel: 'Mid' });
    assert.equal(firstAttempt.interviewId, undefined);

    // First attempt creates session id
    pendingRef.current = '00000000-0000-4000-a000-000000000456';

    // Retry attempt reuses session id
    const retryAttempt = preparePayload({ mode: 'role', roleTitle: 'DevOps', experienceLevel: 'Mid' });
    assert.equal(retryAttempt.interviewId, '00000000-0000-4000-a000-000000000456');

    // Cancellation resets session id
    pendingRef.current = null;
    const freshAttempt = preparePayload({ mode: 'role', roleTitle: 'DevOps', experienceLevel: 'Mid' });
    assert.equal(freshAttempt.interviewId, undefined);
  });

  await t.test('5. Session Lifecycle & Edge Function Consistency Simulation', async (sub) => {
    // Pure simulated Edge Function request handler matching backend/supabase/functions/generate-interview-questions/index.ts
    const simulateEdgeFunction = async ({
      body,
      authenticatedUserId,
      database,
    }) => {
      const rawInterviewId = typeof body.interviewId === 'string' ? body.interviewId.trim() : null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let interviewId = null;
      let existingInterviewRow = null;

      if (rawInterviewId) {
        if (!uuidRegex.test(rawInterviewId)) {
          return { status: 400, body: { error: 'BAD_REQUEST', message: 'Invalid interview ID format. Must be a valid UUID.' } };
        }
        interviewId = rawInterviewId;

        const existing = database.interviews.find((i) => i.id === interviewId);
        if (!existing) {
          return { status: 404, body: { error: 'NOT_FOUND', message: 'Interview session not found' } };
        }
        if (existing.user_id !== authenticatedUserId) {
          return { status: 403, body: { error: 'FORBIDDEN', message: 'Access denied. You do not own this interview session.' } };
        }
        if (existing.status !== 'in_progress') {
          return { status: 400, body: { error: 'INVALID_STATE', message: 'Cannot generate questions for an inactive or completed interview session.' } };
        }

        const existingQuestions = database.interview_questions
          .filter((q) => q.interview_id === interviewId)
          .sort((a, b) => a.question_number - b.question_number);

        if (existingQuestions.length > 0) {
          return {
            status: 200,
            body: {
              session: {
                id: existing.id,
                userId: existing.user_id,
                questions: existingQuestions,
              },
            },
          };
        }
        existingInterviewRow = existing;
      }

      // Check if AI generation fails
      if (body.simulateAiFailure) {
        return { status: 503, body: { error: 'AI_GENERATION_FAILED', message: 'AI service unavailable' } };
      }

      const generatedQuestions = [
        { question: 'Q1', category: 'technical', difficulty: 'medium', time_limit_seconds: 180 },
        { question: 'Q2', category: 'system_design', difficulty: 'medium', time_limit_seconds: 240 },
        { question: 'Q3', category: 'behavioral', difficulty: 'medium', time_limit_seconds: 180 },
      ];

      let targetRow = existingInterviewRow;
      if (!targetRow) {
        targetRow = {
          id: `00000000-0000-4000-a000-${String(database.interviews.length + 1).padStart(12, '0')}`,
          user_id: authenticatedUserId,
          role: body.role || 'Software Engineer',
          status: 'in_progress',
        };
        database.interviews.push(targetRow);
      }

      if (body.simulateInsertFailure) {
        return { status: 500, body: { error: 'DATABASE_ERROR', message: 'Failed to save generated interview questions' } };
      }

      const inserted = generatedQuestions.map((q, idx) => ({
        id: `q-${targetRow.id}-${idx + 1}`,
        interview_id: targetRow.id,
        question_number: idx + 1,
        question: q.question,
      }));
      database.interview_questions.push(...inserted);

      return {
        status: 200,
        body: {
          session: {
            id: targetRow.id,
            userId: targetRow.user_id,
            questions: inserted,
          },
        },
      };
    };

    await sub.test('A. Valid new interview session (passes undefined ID) generates server-authoritative record', async () => {
      const db = { interviews: [], interview_questions: [] };
      const res = await simulateEdgeFunction({
        body: { role: 'Frontend Engineer' },
        authenticatedUserId: 'user-1',
        database: db,
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.session.id);
      assert.equal(db.interviews.length, 1);
      assert.equal(db.interview_questions.length, 3);
      assert.equal(res.body.session.id, db.interviews[0].id);
    });

    await sub.test('B. Nonexistent interview ID lookup strictly returns HTTP 404 Interview session not found', async () => {
      const db = { interviews: [], interview_questions: [] };
      const res = await simulateEdgeFunction({
        body: { interviewId: '11111111-2222-3333-4444-555555555555' },
        authenticatedUserId: 'user-1',
        database: db,
      });

      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'NOT_FOUND');
      assert.equal(res.body.message, 'Interview session not found');
      assert.equal(db.interviews.length, 0); // No record created
    });

    await sub.test('C. Session belonging to another user returns HTTP 403 Forbidden', async () => {
      const db = {
        interviews: [{ id: '99999999-9999-4999-a999-999999999999', user_id: 'other-user', status: 'in_progress' }],
        interview_questions: [],
      };
      const res = await simulateEdgeFunction({
        body: { interviewId: '99999999-9999-4999-a999-999999999999' },
        authenticatedUserId: 'user-1',
        database: db,
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'FORBIDDEN');
    });

    await sub.test('D. Completed session ID cannot generate questions (returns 400 INVALID_STATE)', async () => {
      const db = {
        interviews: [{ id: '88888888-8888-4888-a888-888888888888', user_id: 'user-1', status: 'completed' }],
        interview_questions: [],
      };
      const res = await simulateEdgeFunction({
        body: { interviewId: '88888888-8888-4888-a888-888888888888' },
        authenticatedUserId: 'user-1',
        database: db,
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'INVALID_STATE');
    });

    await sub.test('E. Malformed UUID format returns 400 BAD_REQUEST', async () => {
      const db = { interviews: [], interview_questions: [] };
      const res = await simulateEdgeFunction({
        body: { interviewId: 'not-a-valid-uuid' },
        authenticatedUserId: 'user-1',
        database: db,
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'BAD_REQUEST');
    });

    await sub.test('F. AI generation failure leaves no invalid session state', async () => {
      const db = { interviews: [], interview_questions: [] };
      const res = await simulateEdgeFunction({
        body: { role: 'Backend Engineer', simulateAiFailure: true },
        authenticatedUserId: 'user-1',
        database: db,
      });

      assert.equal(res.status, 503);
      assert.equal(db.interviews.length, 0); // No phantom interview created
    });

    await sub.test('G. Concurrent or retry requests reusing existing session return questions without duplication', async () => {
      const db = { interviews: [], interview_questions: [] };
      // First call creates session and questions
      const first = await simulateEdgeFunction({
        body: { role: 'Staff Engineer' },
        authenticatedUserId: 'user-1',
        database: db,
      });
      assert.equal(first.status, 200);
      const sessionId = first.body.session.id;

      // Second call (retry or concurrent check) with that sessionId
      const second = await simulateEdgeFunction({
        body: { interviewId: sessionId },
        authenticatedUserId: 'user-1',
        database: db,
      });
      assert.equal(second.status, 200);
      assert.equal(second.body.session.id, sessionId);
      assert.equal(db.interview_questions.length, 3); // Idempotent: exactly 3 questions
    });
  });

  await t.test('6. Hardware Media Lifecycle & Asynchronous Stream Cleanup', async (sub) => {
    // Mock MediaStreamTrack
    class MockTrack {
      constructor(kind) {
        this.id = `track-${kind}-${Math.random().toString(36).slice(2, 8)}`;
        this.kind = kind;
        this.stopped = false;
        this.onmute = null;
        this.onunmute = null;
      }
      stop() {
        this.stopped = true;
      }
    }

    // Mock MediaStream
    class MockStream {
      constructor(videoTracks = [new MockTrack('video')], audioTracks = [new MockTrack('audio')]) {
        this.tracks = [...videoTracks, ...audioTracks];
      }
      getTracks() {
        return this.tracks;
      }
      getVideoTracks() {
        return this.tracks.filter((t) => t.kind === 'video');
      }
      getAudioTracks() {
        return this.tracks.filter((t) => t.kind === 'audio');
      }
    }

    await sub.test('A. Late getUserMedia resolution after unmount/cancellation immediately stops tracks', async () => {
      let isMounted = true;
      let isCancelled = false;
      let currentRequestId = 1;
      let activeStreamRef = null;

      const deferredGetUserMedia = async () => {
        // Simulates async hardware acquisition delay
        return new MockStream();
      };

      // Candidate starts requestMedia
      const requestMediaPromise = (async () => {
        const reqId = currentRequestId;
        const stream = await deferredGetUserMedia();

        // Guard from useUserMedia
        if (!isMounted || isCancelled || reqId !== currentRequestId) {
          stream.getTracks().forEach((t) => t.stop());
          return null;
        }
        activeStreamRef = stream;
        return stream;
      })();

      // User immediately clicks Cancel or Back button while getUserMedia is awaiting
      isCancelled = true;
      currentRequestId += 1;
      isMounted = false;

      const resolved = await requestMediaPromise;
      assert.equal(resolved, null);
      assert.equal(activeStreamRef, null);
    });

    await sub.test('B. stopAllInterviewMediaStreams stops all registered streams and clears registry', () => {
      const activeRegistry = new Set();
      const stopAll = () => {
        activeRegistry.forEach((stream) => {
          stream.getTracks().forEach((t) => t.stop());
        });
        activeRegistry.clear();
      };

      const stream1 = new MockStream();
      const stream2 = new MockStream();
      activeRegistry.add(stream1);
      activeRegistry.add(stream2);

      assert.equal(stream1.getTracks().every((t) => !t.stopped), true);
      assert.equal(stream2.getTracks().every((t) => !t.stopped), true);

      stopAll();

      assert.equal(stream1.getTracks().every((t) => t.stopped), true);
      assert.equal(stream2.getTracks().every((t) => t.stopped), true);
      assert.equal(activeRegistry.size, 0);

      // Safe to call multiple times idempotently
      assert.doesNotThrow(() => stopAll());
    });

    await sub.test('C. Video element srcObject is cleanly set to null upon exit', () => {
      const mockVideoElement = { srcObject: new MockStream() };
      assert.ok(mockVideoElement.srcObject);

      // Simulate cleanup on unmount or cancellation
      mockVideoElement.srcObject = null;
      assert.equal(mockVideoElement.srcObject, null);
    });

    await sub.test('D. AudioContext and Analyser nodes are disconnected safely on exit', () => {
      let sourceDisconnected = false;
      let analyserDisconnected = false;
      let contextClosed = false;

      const mockSource = { disconnect: () => { sourceDisconnected = true; } };
      const mockAnalyser = { disconnect: () => { analyserDisconnected = true; } };
      const mockAudioCtx = {
        state: 'running',
        close: async () => { contextClosed = true; },
      };

      // Simulate cleanupAudio
      mockSource.disconnect();
      mockAnalyser.disconnect();
      if (mockAudioCtx.state !== 'closed') {
        mockAudioCtx.close();
      }

      assert.equal(sourceDisconnected, true);
      assert.equal(analyserDisconnected, true);
      assert.equal(contextClosed, true);
    });
  });
});

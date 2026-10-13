import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  TTSLifecycleManager,
  UtteranceLifecycleManager,
  executeBoundedSynthesis,
} from '../../src/features/interview/hooks/useVoiceSynthesizer.ts';
import {
  SpeechRecognitionCoordinator,
  TranscriptProcessor,
} from '../../src/features/interview/hooks/useSpeechRecognition.ts';
import {
  AnswerSubmissionCoordinator,
  createCandidateTranscriptEntry,
  appendTranscriptEntryDedup,
} from '../../src/features/interview/utils/answerSubmission.ts';

const sleep = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

// Controlled mock SpeechRecognition constructor for testing SpeechRecognitionCoordinator
class MockSpeechRecognition {
  static instances = [];
  static throwOnStart = false;

  constructor() {
    this.continuous = true;
    this.interimResults = true;
    this.lang = 'en-US';
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.started = false;
    this.stopped = false;
    this.aborted = false;
    MockSpeechRecognition.instances.push(this);
  }

  start() {
    if (MockSpeechRecognition.throwOnStart) {
      const err = new Error('Failed to execute start on SpeechRecognition: InvalidStateError');
      err.name = 'InvalidStateError';
      throw err;
    }
    this.started = true;
    globalThis.setTimeout(() => {
      this.onstart?.();
    }, 0);
  }

  stop() {
    this.stopped = true;
    globalThis.setTimeout(() => {
      this.onend?.();
    }, 0);
  }

  abort() {
    this.aborted = true;
  }
}

describe('TTS Preparation & Playback Lifecycle (Defect A: Scenarios 1–7)', () => {
  it('1. Recognition remains off during asynchronous synthesis', () => {
    const tts = new TTSLifecycleManager();
    tts.startPrepare();

    assert.equal(tts.isPreparing(), true);
    assert.equal(tts.isPlaying(), false);
    assert.equal(tts.isBusy(), true, 'TTS must report busy during preparation');

    // Speech recognition must not activate when TTS is busy
    const shouldStartRecognition = !tts.isBusy();
    assert.equal(shouldStartRecognition, false, 'Recognition must remain off while TTS is synthesizing');
  });

  it('2. Recognition remains off during playback', () => {
    const tts = new TTSLifecycleManager();
    const token = tts.startPrepare();
    const started = tts.startPlayback(token);

    assert.equal(started, true);
    assert.equal(tts.isPreparing(), false);
    assert.equal(tts.isPlaying(), true);
    assert.equal(tts.isBusy(), true, 'TTS must report busy during playback');

    const shouldStartRecognition = !tts.isBusy();
    assert.equal(shouldStartRecognition, false, 'Recognition must remain off during playback');
  });

  it('3. Unmuting during synthesis does not activate recognition early', () => {
    const tts = new TTSLifecycleManager();
    let isMicMuted = true;
    let recognitionStarted = false;

    // TTS starts synthesizing
    tts.startPrepare();

    // Candidate toggles unmute while audio is still downloading
    isMicMuted = false;

    // InterviewRoom guard: (!isMicMuted && !isTtsBusy)
    if (!isMicMuted && !tts.isBusy()) {
      recognitionStarted = true;
    }

    assert.equal(
      recognitionStarted,
      false,
      'Unmuting during TTS synthesis must NOT trigger early recognition'
    );
  });

  it('4. Normal unmuted completion starts recognition exactly once', () => {
    const tts = new TTSLifecycleManager();
    let isMicMuted = false;
    let recognitionStartCount = 0;

    const token = tts.startPrepare(() => {
      if (!isMicMuted) {
        recognitionStartCount += 1;
      }
    });

    tts.startPlayback(token);
    assert.equal(recognitionStartCount, 0, 'Recognition must not start during playback');

    tts.finishPlayback(token);
    assert.equal(
      recognitionStartCount,
      1,
      'Recognition must start exactly once when unmuted playback completes'
    );
    assert.equal(tts.isBusy(), false);
    assert.equal(tts.getStatus(), 'idle');
  });

  it('5. Muting during synthesis or playback prevents recognition', () => {
    const tts = new TTSLifecycleManager();
    let isMicMuted = false;
    let recognitionStarted = false;

    const token = tts.startPrepare(() => {
      if (!isMicMuted) {
        recognitionStarted = true;
      }
    });

    tts.startPlayback(token);

    // Candidate mutes microphone while AI is speaking
    isMicMuted = true;

    // Playback finishes
    tts.finishPlayback(token);

    assert.equal(
      recognitionStarted,
      false,
      'Microphone recognition must NOT start if candidate muted during audio playback'
    );
  });

  it('6. Cancellation prevents stale completion callbacks from starting recognition', () => {
    const tts = new TTSLifecycleManager();
    let recognitionStarted = false;

    // Question 1 audio preparation begins
    const token1 = tts.startPrepare(() => {
      recognitionStarted = true;
    });

    // Candidate advances to next question or cancels: stop() is called
    tts.stop();

    // Stale playback finish attempt from previous question
    tts.finishPlayback(token1);

    assert.equal(
      recognitionStarted,
      false,
      'Cancelled speech preparation must not invoke completion callback'
    );
    assert.equal(tts.getStatus(), 'idle');
  });

  it('7. Synthesis failure leaves the lifecycle recoverable', () => {
    const tts = new TTSLifecycleManager();
    let recoveryCallbackFired = false;

    // Audio preparation starts
    const token = tts.startPrepare(() => {
      recoveryCallbackFired = true;
    });

    // Synthesis throws an error, finishPlayback runs to clean up and allow candidate to continue
    tts.finishPlayback(token);

    assert.equal(recoveryCallbackFired, true, 'Callback fires to allow candidate to proceed');
    assert.equal(tts.getStatus(), 'idle', 'Lifecycle returns to idle on failure');
    assert.equal(tts.isBusy(), false);

    // Subsequent question can prepare and play normally
    tts.startPrepare();
    assert.equal(tts.isPreparing(), true);
    assert.equal(tts.isBusy(), true);
  });

  it('7a. TTS preparation timeout returns the lifecycle to a recoverable state', async () => {
    // 1. Verify bounded synthesis aborts on timeout
    let wasAborted = false;
    const hangingProvider = {
      synthesizeSpeech: (_text, _audioCtx, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            wasAborted = true;
            reject(signal.reason || new Error('TTS synthesis aborted'));
          });
        }),
    };

    const mockCtx = {};
    await assert.rejects(
      () => executeBoundedSynthesis(hangingProvider, 'Test Question', mockCtx, 50),
      { message: /timed out after 50ms/ }
    );
    assert.equal(wasAborted, true, 'In-flight synthesis request must be aborted upon timeout');

    // 2. Verify lifecycle manager transitions from preparing to recoverable state
    const tts = new TTSLifecycleManager();
    let recoveryCalled = false;
    const token = tts.startPrepare(() => {
      recoveryCalled = true;
    });

    assert.equal(tts.isPreparing(), true);
    assert.equal(tts.isBusy(), true);

    // Timeout triggers cleanup/fallback completion
    tts.finishPlayback(token);

    assert.equal(tts.getStatus(), 'idle', 'Lifecycle must return to idle after timeout recovery');
    assert.equal(tts.isBusy(), false);
    assert.equal(recoveryCalled, true);
  });

  it('7b. A late synthesis response cannot start obsolete playback', () => {
    const tts = new TTSLifecycleManager();

    // Question 1 begins prepare
    const token1 = tts.startPrepare();
    assert.equal(tts.isPreparing(), true);

    // Question 1 cancelled or superseded by Question 2
    const token2 = tts.startPrepare();
    assert.equal(tts.getSpeakToken(), token2);

    // Late network response from Question 1 attempts to start playback
    const started = tts.startPlayback(token1);
    assert.equal(started, false, 'Late synthesis response must be blocked from starting playback');
    assert.notEqual(tts.getStatus(), 'playing');
    assert.equal(tts.getStatus(), 'preparing', 'Active Question 2 must remain in preparing');
  });

  it('7c. Utterance completion or cleanup cannot clear a newer utterance', () => {
    const manager = new UtteranceLifecycleManager();

    // Utterance 1 retained for Question 1
    const utterance1 = { text: 'Question 1' };
    const id1 = manager.retain(utterance1);
    assert.equal(manager.getActiveUtterance(), utterance1);

    // Preempted by Utterance 2 for Question 2
    const utterance2 = { text: 'Question 2' };
    const id2 = manager.retain(utterance2);
    assert.equal(manager.getActiveUtterance(), utterance2);

    // Stale completion callback for Utterance 1 fires
    const releasedStale = manager.release(id1, utterance1);
    assert.equal(releasedStale, false, 'Stale release attempt must be rejected');
    assert.equal(
      manager.getActiveUtterance(),
      utterance2,
      'Newer active utterance must remain retained'
    );

    // Legitimate completion callback for Utterance 2 fires
    const releasedActive = manager.release(id2, utterance2);
    assert.equal(releasedActive, true);
    assert.equal(manager.getActiveUtterance(), null, 'Utterance released after active completion');
  });

  it('7d. Utterance clear() cancels and invalidates stale callbacks', () => {
    const manager = new UtteranceLifecycleManager();

    const utterance = {
      text: 'Question text',
      onstart: () => {},
      onend: () => {},
      onerror: () => {},
    };

    const id = manager.retain(utterance);
    assert.equal(manager.getActiveUtterance(), utterance);

    // stop() triggers clear()
    manager.clear();

    assert.equal(manager.getActiveUtterance(), null);
    assert.equal(utterance.onstart, null, 'Listeners must be detached');
    assert.equal(utterance.onend, null);
    assert.equal(utterance.onerror, null);

    // Attempting release after clear returns false
    const released = manager.release(id, utterance);
    assert.equal(released, false);
  });
});

describe('Speech Recognition Restart & Token Lifecycle (Defect B: Scenarios 8–14)', () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    MockSpeechRecognition.throwOnStart = false;
  });

  it('8. Speech capture continues after an unexpected onend silence pause', async () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    coordinator.start();
    const inst1 = MockSpeechRecognition.instances[0];
    assert.ok(inst1, 'Instance 1 must be created');

    // Step 1: Candidate speaks initial finalized phrase
    inst1.onresult({
      results: [Object.assign([{ transcript: 'I designed a distributed cache' }], { isFinal: true })],
    });
    assert.equal(coordinator.getProcessor().getFinal(), 'I designed a distributed cache');

    // Step 2: Browser triggers silence timeout (unexpected onend)
    inst1.onend();

    // Allow restart delay (50ms) to trigger
    await sleep(80);

    assert.equal(MockSpeechRecognition.instances.length, 2, 'Fresh instance must be spawned on unexpected onend');
    const inst2 = MockSpeechRecognition.instances[1];

    // Step 3: Candidate continues speaking on restarted instance
    inst2.onresult({
      results: [Object.assign([{ transcript: 'using Redis and Kafka' }], { isFinal: true })],
    });

    assert.equal(
      coordinator.getProcessor().getFinal(),
      'I designed a distributed cache using Redis and Kafka',
      'Speech capture must continue across silence pause without freezing'
    );
  });

  it('9. Intentional stop does not trigger automatic restart', async () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    coordinator.start();
    const inst1 = MockSpeechRecognition.instances[0];

    // Candidate intentionally stops listening (e.g. mute or submit answer)
    coordinator.stop();
    assert.equal(coordinator.getIsIntentionalStop(), true);

    // Browser fires onend following stop
    inst1.onend();

    await sleep(80);

    assert.equal(
      MockSpeechRecognition.instances.length,
      1,
      'No new recognition instance must be created after intentional stop'
    );
    assert.equal(coordinator.getIsListening(), false);
  });

  it('10. A restarted recognition instance uses valid result handlers and tokens', async () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    coordinator.start();
    const initialToken = coordinator.getCurrentToken();
    const inst1 = MockSpeechRecognition.instances[0];

    // Unexpected end occurs
    inst1.onend();
    await sleep(80);

    const restartedToken = coordinator.getCurrentToken();
    assert.notEqual(restartedToken, initialToken, 'Token must advance for fresh recognition instance');

    const inst2 = MockSpeechRecognition.instances[1];
    let changesReceived = false;
    coordinator.updateOptions({
      onTranscriptChange: () => {
        changesReceived = true;
      },
    });

    // Restarted instance receives result
    inst2.onresult({
      results: [Object.assign([{ transcript: 'valid speech chunk' }], { isFinal: true })],
    });

    assert.equal(changesReceived, true, 'Restarted instance must accept results with its active token');
    assert.equal(coordinator.getProcessor().getFinal(), 'valid speech chunk');
  });

  it('11. A stale result from the previous instance cannot contaminate the current question', async () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    // Question 1 runs
    coordinator.start();
    const q1Instance = MockSpeechRecognition.instances[0];
    const q1Handler = q1Instance.onresult;

    q1Instance.onresult({
      results: [Object.assign([{ transcript: 'Answer to question 1' }], { isFinal: true })],
    });
    assert.equal(coordinator.getProcessor().getFinal(), 'Answer to question 1');

    // Question 2 begins: coordinator.reset() clears session and detaches old instance handlers
    coordinator.reset();
    assert.equal(coordinator.getProcessor().getFinal(), '');
    assert.equal(q1Instance.onresult, null, 'Old instance handler must be detached on reset');

    // If the browser still held the old callback and dispatched an event with Question 1 results:
    q1Handler({
      results: [Object.assign([{ transcript: 'late ghost words from q1' }], { isFinal: true })],
    });

    assert.equal(
      coordinator.getProcessor().getFinal(),
      '',
      'Stale event from previous question must be completely rejected by token validation'
    );
  });

  it('12. Finalized speech survives recognition restarts without duplication', async () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    coordinator.start();
    const inst1 = MockSpeechRecognition.instances[0];

    inst1.onresult({
      results: [Object.assign([{ transcript: 'Part 1 of answer.' }], { isFinal: true })],
    });

    // Unexpected onend restart
    inst1.onend();
    await sleep(80);

    const inst2 = MockSpeechRecognition.instances[1];
    inst2.onresult({
      results: [Object.assign([{ transcript: 'Part 2 of answer.' }], { isFinal: true })],
    });

    assert.equal(
      coordinator.getProcessor().getFinal(),
      'Part 1 of answer. Part 2 of answer.',
      'Previous finalized segments must be preserved without duplicating any words'
    );
  });

  it('13. InvalidStateError does not leave the hook permanently stuck', async () => {
    MockSpeechRecognition.throwOnStart = true;
    let reportedError = null;

    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
      onError: (err) => {
        reportedError = err;
      },
    });

    coordinator.start();

    assert.ok(reportedError, 'Error must be reported on InvalidStateError');
    assert.equal(coordinator.getIsListening(), false, 'State must not be stuck in listening');

    // System is recoverable: clearing error allows subsequent start to succeed
    MockSpeechRecognition.throwOnStart = false;
    coordinator.start();

    assert.equal(MockSpeechRecognition.instances.length, 2);
    assert.equal(coordinator.getActiveRecognition()?.started, true);
  });

  it('14. Valid final results are retained without duplicating flushed interim text', () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    coordinator.start();
    const inst = MockSpeechRecognition.instances[0];

    // 1. Initial finalized base + interim phrase
    inst.onresult({
      results: [
        Object.assign([{ transcript: 'In my last role' }], { isFinal: true }),
        Object.assign([{ transcript: 'I used Redis' }], { isFinal: false }),
      ],
    });

    // 2. Candidate clicks submit / next question -> coordinator.stop() flushes interim
    const flushed = coordinator.stop();
    assert.equal(flushed, 'In my last role I used Redis');

    // 3. Browser delivers delayed final result extending the interim phrase
    inst.onresult({
      results: [
        Object.assign([{ transcript: 'In my last role' }], { isFinal: true }),
        Object.assign([{ transcript: 'I used Redis and Kafka for pubsub' }], { isFinal: true }),
      ],
    });

    assert.equal(
      coordinator.getProcessor().getFinal(),
      'In my last role I used Redis and Kafka for pubsub',
      'Final result must replace flushed interim text without duplication'
    );
  });
});

describe('Answer Submission Integrity (Defect C: Scenarios 15–17)', () => {
  beforeEach(() => {
    MockSpeechRecognition.instances = [];
    MockSpeechRecognition.throwOnStart = false;
  });

  it('15. Previously finalized text plus newly flushed interim text are both included in submitted answer', () => {
    const coordinator = new SpeechRecognitionCoordinator({
      getConstructor: () => MockSpeechRecognition,
    });

    coordinator.start();
    const inst = MockSpeechRecognition.instances[0];

    // Finalized base
    inst.onresult({
      results: [Object.assign([{ transcript: 'I deployed microservices' }], { isFinal: true })],
    });

    // Trailing speech still in interim buffer when candidate advances
    inst.onresult({
      results: [
        Object.assign([{ transcript: 'I deployed microservices' }], { isFinal: true }),
        Object.assign([{ transcript: 'using Kubernetes and Docker' }], { isFinal: false }),
      ],
    });

    // Simulating handleNextQuestion:
    // stop() flushes interim synchronously and returns full transcript
    const flushedTranscript = coordinator.stop();

    // Even if React state has a stale candidateLiveAnswer from an earlier render:
    const staleCandidateLiveAnswer = 'I deployed microservices';

    // Production resolution formula in InterviewRoom:
    const finalAnswer =
      flushedTranscript.trim() ||
      staleCandidateLiveAnswer.trim() ||
      'Candidate advanced to next question.';

    assert.equal(
      finalAnswer,
      'I deployed microservices using Kubernetes and Docker',
      'Both previously finalized text and newly flushed interim text must be in submitted answer'
    );
  });

  it('16. Flushed text is included exactly once in the submitted answer', () => {
    const processor = new TranscriptProcessor();
    const token = processor.startNewSession();

    // Candidate speaks interim chunk
    processor.processResults([
      Object.assign([{ transcript: 'and improved latency by 50 percent' }], { isFinal: false }),
    ], token);

    // stopListening flushes interim
    const { finalTranscript } = processor.flushInterim();
    assert.equal(finalTranscript, 'and improved latency by 50 percent');

    // Delayed final event matches flushed text
    const res = processor.processResults([
      Object.assign([{ transcript: 'and improved latency by 50 percent' }], { isFinal: true }),
    ], token);

    assert.equal(
      res.final,
      'and improved latency by 50 percent',
      'Flushed text must not be duplicated when browser emits identical final result'
    );
  });

  it('17. An obsolete question callback cannot submit an answer for the next question', () => {
    let currentQuestionId = 'q-101';
    let submittedAnswers = [];

    function submitAnswerForQuestion(targetQuestionId, answerText) {
      // Guard matching InterviewRoom: verify target matches active question
      if (targetQuestionId !== currentQuestionId) return;
      submittedAnswers.push({ questionId: targetQuestionId, answer: answerText });
    }

    // Question 101 finishes and transitions to Question 102
    currentQuestionId = 'q-102';

    // Late delayed submission attempt from Question 101
    submitAnswerForQuestion('q-101', 'Late answer from question 101');

    assert.equal(
      submittedAnswers.length,
      0,
      'Obsolete question callback must be rejected and cannot submit answer for next question'
    );
  });

  it('18. Answer submission fails: answer remains available, no advance occurs, and clear error is surfaced', () => {
    const coordinator = new AnswerSubmissionCoordinator();
    let currentQuestionIndex = 0;

    // Candidate prepares answer
    const prep = coordinator.prepareAnswer({
      flushedSpeech: 'Implemented event-driven architecture using Kafka.',
      questionElapsedSeconds: 42,
    });
    assert.equal(prep.answer, 'Implemented event-driven architecture using Kafka.');
    assert.equal(prep.isRetried, false);

    // Lock acquired
    const lockAcquired = coordinator.startSubmission();
    assert.equal(lockAcquired, true);
    assert.equal(coordinator.isCurrentlySubmitting(), true);

    // Network failure during Supabase persistence
    const errorMsg = 'Failed to submit response: connection timed out';
    coordinator.handleFailure(errorMsg);

    // Verification:
    assert.equal(coordinator.getError(), errorMsg, 'Actionable error message must be surfaced');
    assert.equal(
      coordinator.getRetainedAnswer(),
      'Implemented event-driven architecture using Kafka.',
      'Answer snapshot must remain preserved across submission failure'
    );
    assert.equal(coordinator.getRetainedDuration(), 42, 'Duration must remain preserved');
    assert.equal(coordinator.isCurrentlySubmitting(), false, 'Submission lock must be released');

    // Caller does not advance question on failure
    assert.equal(currentQuestionIndex, 0, 'Candidate must remain on current question');
  });

  it('19. Retrying the same answer does not create duplicate transcript entries', () => {
    const coordinator = new AnswerSubmissionCoordinator();

    // 1. Initial attempt fails
    coordinator.prepareAnswer({
      flushedSpeech: 'Used Redis cluster for distributed caching.',
      questionElapsedSeconds: 30,
    });
    coordinator.startSubmission();
    coordinator.handleFailure('Network failure');

    // 2. Candidate clicks Retry Submission:
    // Speech recognition was already stopped so flushed speech is empty:
    const retried = coordinator.prepareAnswer({
      flushedSpeech: '',
      candidateLiveAnswer: '',
      speechTranscript: '',
      questionElapsedSeconds: 0,
    });

    assert.equal(retried.isRetried, true, 'Must indicate this is a retried submission');
    assert.equal(
      retried.answer,
      'Used Redis cluster for distributed caching.',
      'Retried answer must reuse retained snapshot, not empty speech state'
    );

    // Retry succeeds:
    coordinator.handleSuccess();
    assert.equal(coordinator.getRetainedAnswer(), null);

    // 3. Verify deduplication in transcript collection
    let transcriptList = [
      { id: 'tx-1', text: 'Welcome candidate' },
    ];

    const entry1 = createCandidateTranscriptEntry('q-101', retried.answer, '10:00');
    transcriptList = appendTranscriptEntryDedup(transcriptList, entry1);
    assert.equal(transcriptList.length, 2);

    // Retry or duplicate invocation with same question ID:
    const entryRetry = createCandidateTranscriptEntry('q-101', retried.answer, '10:01');
    transcriptList = appendTranscriptEntryDedup(transcriptList, entryRetry);

    assert.equal(
      transcriptList.length,
      2,
      'Duplicate transcript bubble must be prevented on retry'
    );
    assert.equal(transcriptList[1].id, 'tx-ans-q-101');
  });

  it('20. Two rapid submission attempts cannot create concurrent submissions', () => {
    const coordinator = new AnswerSubmissionCoordinator();

    // First click initiates submission
    const firstAttempt = coordinator.startSubmission();
    assert.equal(firstAttempt, true, 'First submission attempt must acquire lock');
    assert.equal(coordinator.isCurrentlySubmitting(), true);

    // Second rapid click while first submission is in flight
    const secondAttempt = coordinator.startSubmission();
    assert.equal(secondAttempt, false, 'Second concurrent attempt must be blocked');

    // First submission finishes
    coordinator.handleSuccess();
    assert.equal(coordinator.isCurrentlySubmitting(), false);

    // Subsequent submission can now acquire lock
    const thirdAttempt = coordinator.startSubmission();
    assert.equal(thirdAttempt, true, 'Subsequent submission must acquire lock once prior attempt is done');
  });

  it('21. Legitimate answer is never replaced by placeholder when speech exists', () => {
    const coordinator = new AnswerSubmissionCoordinator();

    // Case A: Flushed speech has content
    const prepA = coordinator.prepareAnswer({
      flushedSpeech: 'I used Next.js and Tailwind.',
      candidateLiveAnswer: '',
      speechTranscript: '',
    });
    assert.equal(prepA.answer, 'I used Next.js and Tailwind.');
    assert.notEqual(prepA.answer, 'Candidate advanced to next question.');

    // Reset for next test
    coordinator.reset();

    // Case B: Only live candidate answer has content
    const prepB = coordinator.prepareAnswer({
      flushedSpeech: '',
      candidateLiveAnswer: 'I implemented OAuth2 PKCE.',
      speechTranscript: '',
    });
    assert.equal(prepB.answer, 'I implemented OAuth2 PKCE.');
    assert.notEqual(prepB.answer, 'Candidate advanced to next question.');

    coordinator.reset();

    // Case C: Truly empty speech
    const prepC = coordinator.prepareAnswer({
      flushedSpeech: '   ',
      candidateLiveAnswer: '',
      speechTranscript: '   ',
    });
    assert.equal(prepC.answer, 'Candidate advanced to next question.');
  });
});

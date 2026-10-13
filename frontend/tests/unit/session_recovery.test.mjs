import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSessionRecoveryState } from '../../src/services/api/sessionRecovery.ts';

describe('Session Refresh Recovery Logic', () => {
  it('starts at Question 1 (index 0) when no questions have been answered', () => {
    const questions = [
      { id: 'q-1', question: 'Q1', candidate_response: null },
      { id: 'q-2', question: 'Q2', candidate_response: null },
      { id: 'q-3', question: 'Q3', candidate_response: null },
    ];

    const result = calculateSessionRecoveryState('in_progress', questions);
    assert.equal(result.currentQuestionIndex, 0);
    assert.equal(result.currentState, 'READY');
    assert.equal(result.allAnswered, false);
  });

  it('resumes at Question 2 (index 1) when Question 1 has been answered', () => {
    const questions = [
      { id: 'q-1', question: 'Q1', candidate_response: 'Answer to Q1' },
      { id: 'q-2', question: 'Q2', candidate_response: null },
      { id: 'q-3', question: 'Q3', candidate_response: null },
    ];

    const result = calculateSessionRecoveryState('in_progress', questions);
    assert.equal(result.currentQuestionIndex, 1);
    assert.equal(result.currentState, 'READY');
  });

  it('resumes at Question 3 (index 2) when Questions 1 and 2 have been answered', () => {
    const questions = [
      { id: 'q-1', question: 'Q1', candidate_response: 'Answer to Q1' },
      { id: 'q-2', question: 'Q2', candidate_response: 'Answer to Q2' },
      { id: 'q-3', question: 'Q3', candidate_response: null },
    ];

    const result = calculateSessionRecoveryState('in_progress', questions);
    assert.equal(result.currentQuestionIndex, 2);
    assert.equal(result.currentState, 'READY');
  });

  it('never restarts Question 1 when all questions have been answered', () => {
    const questions = [
      { id: 'q-1', question: 'Q1', candidate_response: 'Answer to Q1' },
      { id: 'q-2', question: 'Q2', candidate_response: 'Answer to Q2' },
      { id: 'q-3', question: 'Q3', candidate_response: 'Answer to Q3' },
    ];

    const result = calculateSessionRecoveryState('in_progress', questions);
    assert.equal(result.allAnswered, true);
    assert.equal(result.currentState, 'COMPLETE');
    assert.notEqual(result.currentQuestionIndex, 0);
    assert.equal(result.currentQuestionIndex, 2);
  });

  it('correctly classifies cancelled interview as TERMINATED', () => {
    const questions = [
      { id: 'q-1', question: 'Q1', candidate_response: 'Answer to Q1' },
    ];

    const result = calculateSessionRecoveryState('cancelled', questions);
    assert.equal(result.currentState, 'TERMINATED');
  });

  it('handles empty response strings as unanswered questions', () => {
    const questions = [
      { id: 'q-1', question: 'Q1', candidate_response: 'Answer 1' },
      { id: 'q-2', question: 'Q2', candidate_response: '   ' }, // whitespace-only
      { id: 'q-3', question: 'Q3', candidate_response: null },
    ];

    const result = calculateSessionRecoveryState('in_progress', questions);
    assert.equal(result.currentQuestionIndex, 1);
  });
});

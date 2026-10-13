import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TranscriptProcessor } from '../../src/features/interview/hooks/useSpeechRecognition.ts';

describe('Speech Transcript Accumulation Engine (Production Unit)', () => {
  it('does not overwrite finalized transcript when interim results arrive', () => {
    const processor = new TranscriptProcessor();
    const token = processor.startNewSession();

    // Step 1: User speaks and finalizes first phrase
    processor.processResults([
      [{ transcript: 'I designed a distributed cache' }],
    ], token);

    const res1 = processor.processResults([
      Object.assign([{ transcript: 'I designed a distributed cache' }], { isFinal: true }),
    ], token);

    assert.equal(processor.getFinal(), 'I designed a distributed cache');
    assert.equal(res1.combined, 'I designed a distributed cache');

    // Step 2: Interim speech arrives for subsequent phrase
    const res2 = processor.processResults([
      Object.assign([{ transcript: 'I designed a distributed cache' }], { isFinal: true }),
      [{ transcript: ' using Redis' }],
    ], token);

    assert.equal(processor.getFinal(), 'I designed a distributed cache');
    assert.equal(processor.getInterim(), 'using Redis');
    assert.equal(res2.combined, 'I designed a distributed cache using Redis');
  });

  it('replaces interim phrase when browser revises it to a different final phrase (Scenario A)', () => {
    const processor = new TranscriptProcessor();
    const token = processor.startNewSession();

    // Candidate speaks interim "I used Redis"
    processor.processResults([
      [{ transcript: 'I used Redis' }],
    ], token);

    assert.equal(processor.getInterim(), 'I used Redis');
    assert.equal(processor.getFinal(), '');

    // Browser revises speech to final "I used PostgreSQL"
    const res = processor.processResults([
      Object.assign([{ transcript: 'I used PostgreSQL' }], { isFinal: true }),
    ], token);

    assert.equal(processor.getFinal(), 'I used PostgreSQL');
    assert.equal(processor.getInterim(), '');
    assert.equal(res.combined, 'I used PostgreSQL');
  });

  it('prevents duplication of finalized segments when repeated events occur', () => {
    const processor = new TranscriptProcessor();
    const token = processor.startNewSession();

    const batch = [
      Object.assign([{ transcript: 'First sentence.' }], { isFinal: true }),
      Object.assign([{ transcript: 'Second sentence.' }], { isFinal: true }),
    ];

    processor.processResults(batch, token);
    assert.equal(processor.getFinal(), 'First sentence. Second sentence.');

    // Re-processing the same batch must not re-append
    processor.processResults(batch, token);
    assert.equal(processor.getFinal(), 'First sentence. Second sentence.');
  });

  it('flushes pending interim transcript on flushInterim so no speech is discarded', () => {
    const processor = new TranscriptProcessor();
    const token = processor.startNewSession();

    // Candidate speaks words that are still interim when candidate submits
    processor.processResults([
      [{ transcript: 'and that improved throughput by 40 percent' }],
    ], token);

    assert.equal(processor.getFinal(), '');
    assert.equal(processor.getInterim(), 'and that improved throughput by 40 percent');

    // Submitting triggers flushInterim
    const flushed = processor.flushInterim();

    assert.equal(flushed.flushedText, 'and that improved throughput by 40 percent');
    assert.equal(flushed.finalTranscript, 'and that improved throughput by 40 percent');
    assert.equal(processor.getFinal(), 'and that improved throughput by 40 percent');
    assert.equal(processor.getInterim(), '');
  });

  it('preserves accumulated transcript across recognition restarts (silence pause)', () => {
    const processor = new TranscriptProcessor();

    // Session 1: Finalizes "Hello world"
    const token1 = processor.startNewSession();
    processor.processResults([
      Object.assign([{ transcript: 'Hello world' }], { isFinal: true }),
    ], token1);
    assert.equal(processor.getFinal(), 'Hello world');

    // Speech recognition pauses, onend fires and restarts session
    const token2 = processor.startNewSession();
    assert.equal(processor.getFinal(), 'Hello world');

    // Session 2: New results in fresh recognition instance
    processor.processResults([
      Object.assign([{ transcript: 'I am ready.' }], { isFinal: true }),
    ], token2);
    assert.equal(processor.getFinal(), 'Hello world I am ready.');
  });

  it('clears transcript only when reset is explicitly invoked', () => {
    const processor = new TranscriptProcessor();
    const token = processor.startNewSession();

    processor.processResults([
      Object.assign([{ transcript: 'Answer to question 1' }], { isFinal: true }),
    ], token);
    assert.equal(processor.getFinal(), 'Answer to question 1');

    processor.flushInterim();
    assert.equal(processor.getFinal(), 'Answer to question 1');

    processor.reset();
    assert.equal(processor.getFinal(), '');
    assert.equal(processor.getInterim(), '');
  });
});

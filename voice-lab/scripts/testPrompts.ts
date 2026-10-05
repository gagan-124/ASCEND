/**
 * ASCEND VOICE LAB — Standardized Technical Interview Test Prompts
 * 
 * Standardized test suite evaluated across all candidate TTS providers.
 * Do not modify wording between providers to ensure strict parity.
 */

export interface TestPrompt {
  id: string;
  name: string;
  category: string;
  text: string;
  evaluationGoal: string;
}

export const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 'test_1',
    name: 'Introduction / Welcome',
    category: 'Greeting',
    text: "Hello, welcome to your interview. I'll be conducting your technical interview today.",
    evaluationGoal: 'Warmth, natural welcome cadence, confidence, calm demeanor without mechanical sharpness.'
  },
  {
    id: 'test_2',
    name: 'Icebreaker / Experience Question',
    category: 'Open Question',
    text: "Let's start with a simple question. Can you tell me about a project you're particularly proud of?",
    evaluationGoal: 'Question inflection, natural comma pause, conversational invitation.'
  },
  {
    id: 'test_3',
    name: 'Follow-up Probe',
    category: 'Follow-up',
    text: "That's interesting. What was the most challenging part of that project?",
    evaluationGoal: 'Conversational reaction inflection, empathy, question intonation.'
  },
  {
    id: 'test_4',
    name: 'Deep-dive Technical Decision',
    category: 'Technical Inquiry',
    text: "Can you explain the technical decision you made and why you chose that approach?",
    evaluationGoal: 'Professional technical tone, distinct question rise, natural phrasing.'
  },
  {
    id: 'test_5',
    name: 'Transition / Wrap-up',
    category: 'Transition',
    text: "Thank you. Let's move on to the next question.",
    evaluationGoal: 'Calm closure, professional transitional pacing, non-rushed cadence.'
  }
];

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionCategory = 'technical' | 'behavioral' | 'system_design' | 'situational';

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  timeLimitSeconds?: number;
}

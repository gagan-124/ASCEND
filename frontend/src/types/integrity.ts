export type IntegrityLevel = 0 | 1 | 2 | 3;

export interface IntegritySignal {
  timestamp: string;
  type: string;
  level: IntegrityLevel;
  details?: string;
}

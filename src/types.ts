export type StepType = 
  | 'choice' 
  | 'scale' 
  | 'pain' 
  | 'slider' 
  | 'text' 
  | 'exercise';

export interface Option {
  label: string;
  value: string;
  nextStepId?: string; // For branching logic
}

export interface ExerciseData {
  title: string;
  description: string;
  duration: number; // in seconds
  targetReps?: number;
  illustrationUrl?: string;
  feedback: {
    low: string;
    medium: string;
    high: string;
    thresholds: [number, number]; // [medium_start, high_start]
  };
}

export interface AssessmentStep {
  id: string;
  type: StepType;
  question: string;
  options?: Option[];
  min?: number;
  max?: number;
  exercise?: ExerciseData;
  condition?: (answers: Record<string, any>) => boolean;
}

export interface AssessmentPath {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  steps: AssessmentStep[];
}

export interface AssessmentResult {
  id: string;
  date: string;
  patientName: string;
  pathId: string;
  pathTitle: string;
  answers: Record<string, any>;
  exerciseResults: Record<string, { reps: number; feedback: string }>;
}

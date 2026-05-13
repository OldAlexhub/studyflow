export type BlockType = 'prestudy' | 'focus' | 'break' | 'review';

export interface StudyBlock {
  id: string;
  type: BlockType;
  title: string;
  durationSeconds: number;
  instruction: string;
  suggestion?: string;
}

export type RootStackParamList = {
  Home: undefined;
  PlanPreview: { durationMinutes: number };
  PreStudy: { durationMinutes: number };
  Session: { durationMinutes: number };
  Complete: { durationMinutes: number };
};

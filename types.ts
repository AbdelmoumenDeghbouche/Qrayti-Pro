
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface Flashcard {
  front: string;
  back: string;
}

export type InputType = 'image' | 'text';
export type ActiveResultTab = 'summary' | 'explanation' | 'quiz' | 'mindmap' | 'flashcards';

export interface GeneratedContent {
  summary: string;
  explanation: string;
  quiz: QuizQuestion[];
  mindMap: string;
  flashcards: Flashcard[];
}

export interface LoadingStates {
  generating: boolean;
  summary: boolean;
  explanation: boolean;
  quiz: boolean;
  mindMap: boolean;
  flashcards: boolean;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
  // Other types of chunks can be added here if needed
}
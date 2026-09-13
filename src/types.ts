export interface CroftcAnalysis {
  context: string;
  role: string;
  objective: string;
  format: string;
  temperature: string;
  constraints: string;
}

export interface GoogleStepsAnalysis {
  task: string;
  context: string;
  references: string;
  evaluation: string;
  iteration: string;
}

export interface TokenomicsAnalysis {
  estimatedInputTokens: number;
  promptCachingPotential: boolean;
  promptCachingReason: string;
}

export interface PromptAnalysis {
  score: number;
  croftc: CroftcAnalysis;
  googleSteps: GoogleStepsAnalysis;
  suggestions: string[];
  cognitiveLoadNote: string;
  tokenomics: TokenomicsAnalysis;
  scientificRefinement: string;
}

export interface Interaction {
  id: string;
  title: string;
  timestamp: string;
  prompt: string;
  dataContext?: string;
  analysis?: PromptAnalysis;
  refinedPrompt?: string;
}

export interface KanbanTask {
  id: string;
  text: string;
  column: "backlog" | "fazendo" | "concluido";
  timestamp: string;
}

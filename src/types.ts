export type ReflectionMode = 'reflection' | 'brainstorm' | 'action_plan' | 'mindful';

export interface JournalTurn {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ActionPlan {
  keyInsight: string;
  suggestedGoal: string;
  actionSteps: string[];
  actionPlan?: string[];
  nextStep: string;
  generatedAt: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  createdAt: string;
  updatedAt: string;
  turns: JournalTurn[];
  summary?: string;
  keyInsights?: string[];
  tags?: string[];
  plan?: ActionPlan;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface ReflectionModeConfig {
  id: ReflectionMode;
  label: string;
  description: string;
  iconName: string;
  accentColor: string;
  badgeBg: string;
  systemPrompt: string;
  examplePrompts: string[];
}

export interface GenerateReplyRequest {
  turns: JournalTurn[];
  userPrompt: string;
  mode: ReflectionMode;
  title?: string;
}

export interface GenerateReplyResponse {
  reply: string;
  modelUsed: string;
}

export interface GenerateSummaryRequest {
  turns: JournalTurn[];
  mode: ReflectionMode;
  currentTitle?: string;
}

export interface GenerateSummaryResponse {
  title: string;
  summary: string;
  keyInsights: string[];
  tags: string[];
  modelUsed: string;
}

export interface GeneratePlanRequest {
  turns: JournalTurn[];
  mode?: ReflectionMode;
  currentTitle?: string;
  summary?: string;
}

export interface GeneratePlanResponse {
  plan: ActionPlan;
  modelUsed: string;
}

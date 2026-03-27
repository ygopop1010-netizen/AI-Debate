export interface Agent {
  id: 'A' | 'B' | 'C';
  title: string;
  emoji: string;
  expertise: string;
  role_in_meeting: string;
}

export interface TeamComposition {
  topic_analysis: string;
  industry: string;
  agents: Agent[];
}

export interface ActionItem {
  priority: string;
  task: string;
  owner: string;
  timeline: string;
  kpi: string;
}

export interface ActionPlan {
  title: string;
  summary: string;
  action_items: ActionItem[];
  risks: string[];
  expected_outcome: string;
}

export interface Preset {
  id: string;
  emoji: string;
  label: string;
  topic: string;
  context_placeholder: string;
}

export interface MeetingHistory {
  id: string;
  topic: string;
  context: string;
  team: TeamComposition;
  meetingContent: string;
  actionPlan: ActionPlan | null;
  createdAt: string;
}

export type AppPhase = 'input' | 'composing' | 'meeting' | 'done';

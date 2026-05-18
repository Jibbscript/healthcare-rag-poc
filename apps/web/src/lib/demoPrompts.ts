export type DemoPromptKind = 'covered' | 'ambiguous' | 'safety' | 'pii' | 'no-evidence';

export type DemoPrompt = {
  id: DemoPromptKind;
  label: string;
  summary: string;
  message: string;
};

export const demoPrompts: DemoPrompt[] = [
  {
    id: 'covered',
    label: 'Covered',
    summary: 'Urgent care copay for the PPO demo plan',
    message: 'What is the in-network urgent care copay for the PPO demo plan?'
  },
  {
    id: 'ambiguous',
    label: 'Ambiguous',
    summary: 'Orthodontia lifetime maximum',
    message: 'What is the orthodontia lifetime maximum?'
  },
  {
    id: 'safety',
    label: 'Safety',
    summary: 'Medical advice refusal',
    message: 'Should I take antibiotics for chest pain?'
  },
  {
    id: 'pii',
    label: 'PII',
    summary: 'Member id redaction behavior',
    message: 'My member id DEMO-MEMBER-ID asks what is the urgent care copay?'
  },
  {
    id: 'no-evidence',
    label: 'No evidence',
    summary: 'International evacuation coverage',
    message: 'Does the plan cover international evacuation?'
  }
];

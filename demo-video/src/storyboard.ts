export type DemoScene = {
  id: string;
  title: string;
  kicker: string;
  body: string;
  image?: string;
  durationSeconds: number;
  accent: 'green' | 'blue' | 'amber' | 'red';
};

export const fps = 30;
export const width = 1920;
export const height = 1080;
export const totalDurationSeconds = 60;
export const durationInFrames = totalDurationSeconds * fps;

export const scenes: DemoScene[] = [
  {
    id: 'intro',
    title: 'Healthcare RAG PoC in 60 seconds',
    kicker: 'Fixture playback plus aws-smoke summary-only proof',
    body: 'A publishable Remotion cut with two explicit lanes: GitHub Pages fixture playback and separate sanitized AWS smoke evidence.',
    durationSeconds: 5,
    accent: 'green'
  },
  {
    id: 'fixture-answer',
    title: 'Fixture playback: cited benefit answer',
    kicker: 'GitHub Pages fixture playback',
    body: 'The hosted dashboard shows a synthetic urgent-care benefits answer with citation and trace evidence. It is not an aws-smoke browser call.',
    image: 'evidence/07-synthetic-fixture-covered-citation.png',
    durationSeconds: 13,
    accent: 'green'
  },
  {
    id: 'no-evidence',
    title: 'Fixture playback: no-evidence refusal',
    kicker: 'Guardrail montage',
    body: 'Unsupported benefit questions resolve to an explicit refusal state instead of unsupported coverage claims.',
    image: 'evidence/08-no-evidence-refusal.png',
    durationSeconds: 5,
    accent: 'blue'
  },
  {
    id: 'medical-refusal',
    title: 'Fixture playback: safety refusal',
    kicker: 'Guardrail montage',
    body: 'Medical advice prompts are blocked and labeled as policy refusals before they can become benefits answers.',
    image: 'evidence/09-medical-advice-refusal.png',
    durationSeconds: 5,
    accent: 'red'
  },
  {
    id: 'pii-redaction',
    title: 'Fixture playback: PII redaction evidence',
    kicker: 'Guardrail montage',
    body: 'Synthetic member identifiers become redaction labels and evidence hashes, not publishable raw identifiers.',
    image: 'evidence/10-pii-redaction-evidence.png',
    durationSeconds: 6,
    accent: 'amber'
  },
  {
    id: 'pages-run',
    title: 'Pages deploy is gated by verification',
    kicker: 'GitHub Actions Pages dashboard run',
    body: 'The public fixture dashboard deploys after install, lint, typecheck, tests, eval, web tests, build, and Pages deployment.',
    image: 'evidence/01-pages-run.png',
    durationSeconds: 10,
    accent: 'blue'
  },
  {
    id: 'smoke-summary',
    title: 'aws-smoke summary-only proof',
    kicker: 'Manual smoke evidence, not product UI',
    body: 'The smoke proof is a distinct summary artifact: resource shape, trace IDs, hashes, provenance, and deploy/destroy status only.',
    image: 'evidence/11-aws-smoke-summary.png',
    durationSeconds: 10,
    accent: 'amber'
  },
  {
    id: 'outro',
    title: 'Publishable boundary verified',
    kicker: '60 seconds, 1800 frames, no raw content',
    body: 'The artifact safety gate keeps smoke keys, account IDs, request bodies, raw model content, and real identifiers out of the video.',
    durationSeconds: 6,
    accent: 'green'
  }
];

const plannedDurationInFrames = scenes.reduce((sum, scene) => sum + scene.durationSeconds * fps, 0);
if (plannedDurationInFrames !== durationInFrames) {
  throw new Error(`Demo storyboard must be ${durationInFrames} frames; got ${plannedDurationInFrames}`);
}

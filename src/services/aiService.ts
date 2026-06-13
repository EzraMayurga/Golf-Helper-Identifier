// ==========================================
// BUSINESS LOGIC LAYER - AI Service
// Simulates AI analysis workflow
// ==========================================

import { AnalysisResult, SwingPhase } from '@/data/mockData';

const SWING_PHASES: SwingPhase[] = ['address', 'backswing', 'downswing', 'impact', 'follow-through'];

const PHASE_FEEDBACK: Record<SwingPhase, string[]> = {
  'address': ['Good stance width.', 'Align shoulders to target.', 'Slightly narrow base.', 'Weight distribution is balanced.'],
  'backswing': ['Maintain wrist angle.', 'Club past parallel, shorten it.', 'Good shoulder turn.', 'Keep left arm straight.'],
  'downswing': ['Good hip rotation.', 'Casting motion detected.', 'Maintain lag longer.', 'Transition is smooth.'],
  'impact': ['Square clubface at impact.', 'Slight open face detected.', 'Good ball compression.', 'Adjust low point.'],
  'follow-through': ['Complete the rotation.', 'Good extension.', 'Balance on finish.', 'Hold the finish position.'],
};

const RECOMMENDATIONS = [
  'Practice alignment drills with alignment sticks',
  'Work on tempo with a metronome at 72 BPM',
  'Strengthen core rotation with medicine ball exercises',
  'Use impact tape to check contact point',
  'Practice half-swings to build proper lag',
  'Focus on maintaining wrist hinge through downswing',
  'Try the towel drill to prevent casting',
  'Practice pre-shot routine consistently',
];

const INJURY_AREAS = ['Lower back', 'Left wrist', 'Right elbow', 'Left knee', 'Right shoulder', 'Neck'];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function simulateAIAnalysis(videoId: string): Promise<AnalysisResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const phaseScores = SWING_PHASES.map(phase => ({
    phase,
    score: randomBetween(60, 95),
    feedback: pickRandom(PHASE_FEEDBACK[phase], 1)[0],
  }));

  const avgScore = Math.round(phaseScores.reduce((s, p) => s + p.score, 0) / phaseScores.length);

  return {
    id: `analysis_${Date.now()}`,
    videoId,
    swingScore: avgScore,
    swingPhases: phaseScores,
    recommendation: pickRandom(RECOMMENDATIONS, randomBetween(3, 5)),
    injuryRiskScore: randomBetween(10, 50),
    injuryRiskAreas: pickRandom(INJURY_AREAS, randomBetween(1, 3)),
    keypointsDetected: 33,
    createdAt: new Date().toISOString(),
  };
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-brand';
  if (score >= 70) return 'text-emerald-deep';
  if (score >= 55) return 'text-gold';
  return 'text-destructive';
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Developing';
  return 'Needs Work';
}

export function getRiskColor(risk: number): string {
  if (risk <= 20) return 'text-green-brand';
  if (risk <= 40) return 'text-gold';
  return 'text-destructive';
}

export function getRiskLabel(risk: number): string {
  if (risk <= 20) return 'Low Risk';
  if (risk <= 40) return 'Moderate Risk';
  return 'High Risk';
}

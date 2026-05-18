export type DashboardMode = 'fixture-demo' | 'local-api';

export const defaultDashboardMode: DashboardMode = 'fixture-demo';

export function dashboardModeLabel(mode: DashboardMode): string {
  return mode === 'fixture-demo' ? 'Fixture playback' : 'Local API';
}

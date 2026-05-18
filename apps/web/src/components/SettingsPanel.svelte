<script lang="ts">
  import type { DashboardMode } from '../lib/demoMode';
  import { dashboardModeLabel } from '../lib/demoMode';

  export let apiBaseUrl = '';
  export let mode: DashboardMode = 'fixture-demo';
  export let onApiBaseUrlChange: (value: string) => void = () => {};
  export let onModeChange: (value: DashboardMode) => void = () => {};

  $: apiTarget = mode === 'fixture-demo' ? 'bundled fixtures' : apiBaseUrl.trim() || 'dev proxy /chat';
</script>

<section class="settings-panel" aria-label="API settings">
  <details>
    <summary>Demo target</summary>
    <form class="settings-grid" aria-label="API target configuration" on:submit|preventDefault>
      <label>
        Mode
        <select value={mode} on:change={(event) => onModeChange((event.currentTarget as HTMLSelectElement).value as DashboardMode)}>
          <option value="fixture-demo">Fixture playback</option>
          <option value="local-api">Local API</option>
        </select>
      </label>

      {#if mode === 'local-api'}
        <label>
          API base URL
          <input
            value={apiBaseUrl}
            placeholder="dev proxy /chat"
            on:input={(event) => onApiBaseUrlChange((event.currentTarget as HTMLInputElement).value)}
          />
        </label>
      {/if}
    </form>
    <p class="settings-note">Target: {apiTarget} · Mode: {dashboardModeLabel(mode)}</p>
  </details>
</section>

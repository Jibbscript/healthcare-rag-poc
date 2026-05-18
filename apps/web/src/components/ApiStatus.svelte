<script lang="ts">
  import type { RequestState } from '../lib/viewModels';
  import { apiStatusText, apiStatusTone } from '../lib/viewModels';
  import type { DashboardMode } from '../lib/demoMode';

  export let state: RequestState;
  export let mode: DashboardMode;
  export let apiBaseUrl: string;

  $: tone = apiStatusTone(state);
  $: label = apiStatusText({ state, mode, apiBaseUrl });
</script>

<div class={`api-status ${tone}`} aria-live="polite">
  <span class="status-dot" aria-hidden="true"></span>
  <span>{label}</span>
</div>

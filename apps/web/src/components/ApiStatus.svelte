<script lang="ts">
  import type { RequestState } from '../lib/viewModels';
  import { apiStatusText, apiStatusTone } from '../lib/viewModels';
  import type { DemoProfile } from '../lib/apiClient';

  export let state: RequestState;
  export let profile: DemoProfile;
  export let apiBaseUrl: string;

  $: tone = apiStatusTone(state);
  $: label = apiStatusText({ state, profile, apiBaseUrl });
</script>

<div class={`api-status ${tone}`} aria-live="polite">
  <span class="status-dot" aria-hidden="true"></span>
  <span>{label}</span>
</div>

<script lang="ts">
  import type { DemoProfile } from '../lib/apiClient';
  import { maskSecret } from '../lib/privacy';

  export let apiBaseUrl = '';
  export let apiKey = '';
  export let profile: DemoProfile = 'local';
  export let onApiBaseUrlChange: (value: string) => void = () => {};
  export let onApiKeyChange: (value: string) => void = () => {};
  export let onProfileChange: (value: DemoProfile) => void = () => {};

  $: apiTarget = apiBaseUrl.trim() || 'dev proxy /chat';
</script>

<section class="settings-panel" aria-label="API settings">
  <details>
    <summary>API settings</summary>
    <form class="settings-grid" aria-label="API target configuration" on:submit|preventDefault>
      <label>
        Profile
        <select value={profile} on:change={(event) => onProfileChange((event.currentTarget as HTMLSelectElement).value as DemoProfile)}>
          <option value="local">Local fixture</option>
          <option value="aws-smoke">AWS smoke</option>
        </select>
      </label>

      <label>
        API base URL
        <input
          value={apiBaseUrl}
          placeholder="dev proxy /chat"
          on:input={(event) => onApiBaseUrlChange((event.currentTarget as HTMLInputElement).value)}
        />
      </label>

      <label>
        Smoke API key
        <input
          value={apiKey}
          type="password"
          autocomplete="off"
          placeholder="optional"
          on:input={(event) => onApiKeyChange((event.currentTarget as HTMLInputElement).value)}
        />
      </label>
    </form>
    <p class="settings-note">Target: {apiTarget} · Key: {maskSecret(apiKey)}</p>
  </details>
</section>

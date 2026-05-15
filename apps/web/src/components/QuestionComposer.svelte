<script lang="ts">
  import type { RedactionMode } from '../lib/apiClient';

  export let message = '';
  export let loading = false;
  export let debug = true;
  export let redactionMode: RedactionMode = 'strict';
  export let onMessageChange: (message: string) => void = () => {};
  export let onDebugChange: (debug: boolean) => void = () => {};
  export let onRedactionModeChange: (mode: RedactionMode) => void = () => {};
  export let onSubmit: () => void = () => {};

  function submit() {
    if (!loading && message.trim()) onSubmit();
  }
</script>

<section class="composer" aria-label="Question composer">
  <label for="question">Question</label>
  <textarea
    id="question"
    value={message}
    rows="5"
    spellcheck="true"
    on:input={(event) => onMessageChange((event.currentTarget as HTMLTextAreaElement).value)}
  ></textarea>

  <div class="composer-actions">
    <div class="inline-controls" aria-label="Request controls">
      <label class="select-label">
        Redaction
        <select
          value={redactionMode}
          on:change={(event) => onRedactionModeChange((event.currentTarget as HTMLSelectElement).value as RedactionMode)}
        >
          <option value="strict">Strict</option>
          <option value="standard">Standard</option>
        </select>
      </label>

      <label class="check-label">
        <input
          type="checkbox"
          checked={debug}
          on:change={(event) => onDebugChange((event.currentTarget as HTMLInputElement).checked)}
        />
        Debug retrieval
      </label>
    </div>

    <button class="primary-action" type="button" disabled={loading || !message.trim()} on:click={submit}>
      {loading ? 'Running' : 'Run question'}
    </button>
  </div>
</section>

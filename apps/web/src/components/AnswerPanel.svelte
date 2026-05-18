<script lang="ts">
  import type { ChatResponse } from '@healthcare-rag/core';
  import type { ChatClientError } from '../lib/apiClient';
  import { citationCountLabel, errorHeading } from '../lib/viewModels';

  export let response: ChatResponse | null = null;
  export let error: ChatClientError | null = null;
  export let loading = false;
  export let sourceLabel = 'Fixture playback';
</script>

<section class="answer-panel" aria-live="polite">
  {#if loading}
    <div class="empty-state">
      <h2>Running retrieval</h2>
      <p>The selected demo target is processing the active turn.</p>
    </div>
  {:else if error}
    <div class="answer-box warning">
      <span class="answer-label">{errorHeading(error)}</span>
      <p>{error.message}</p>
      <small>Trace: {error.traceId}</small>
    </div>
  {:else if response}
    <div class:warning={response.refusal} class="answer-box">
      <div class="answer-heading">
        <span class="answer-label">{response.refusal ? 'Refusal' : 'Answer'}</span>
        <span class="source-chip">{sourceLabel}</span>
      </div>
      <p>{response.answer}</p>
      <small>{citationCountLabel(response)} · Trace: {response.traceId}</small>
    </div>
  {:else}
    <div class="empty-state">
      <h2>Ready</h2>
      <p>Select a demo prompt or enter a benefits question.</p>
    </div>
  {/if}
</section>

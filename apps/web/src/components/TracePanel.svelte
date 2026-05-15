<script lang="ts">
  import type { ChatResponse } from '@healthcare-rag/core';

  export let response: ChatResponse | null = null;
</script>

<section class="evidence-section" aria-label="Safety and trace">
  <div class="panel-title">
    <h2>Safety and trace</h2>
    <span>{response?.guardrail.action ?? 'idle'}</span>
  </div>

  <div class="metric-list">
    <div class="metric-row">
      <strong>Guardrail</strong>
      <span>{response ? response.guardrail.action : 'not run'}</span>
    </div>
    <div class="metric-row">
      <strong>Labels</strong>
      <span>{response && response.guardrail.labels.length ? response.guardrail.labels.join(', ') : 'none'}</span>
    </div>
    <div class="metric-row">
      <strong>Refusal</strong>
      <span>{response ? (response.refusal ? response.refusalLabels.join(', ') || 'true' : 'false') : 'not run'}</span>
    </div>
    <div class="metric-row">
      <strong>Trace id</strong>
      <span>{response?.traceId ?? 'unavailable'}</span>
    </div>
  </div>

  {#if response?.debug?.retrievalTrace?.length}
    <div class="retrieval-list" aria-label="Retrieval trace">
      {#each response.debug.retrievalTrace as chunk}
        <div class="retrieval-row">
          <span>{chunk.chunkId}</span>
          <strong>{chunk.fusedScore?.toFixed(3) ?? chunk.score?.toFixed(3) ?? 'n/a'}</strong>
        </div>
      {/each}
    </div>
  {/if}
</section>

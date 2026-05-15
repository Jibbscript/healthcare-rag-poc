<script lang="ts">
  import type { Citation } from '@healthcare-rag/core';

  export let citations: Citation[] = [];
  export let selectedCitationId = '';
  export let onSelect: (citationId: string) => void = () => {};
</script>

<section class="evidence-section" aria-label="Citations">
  <div class="panel-title">
    <h2>Citations</h2>
    <span>{citations.length}</span>
  </div>

  {#if citations.length}
    <div class="citation-list">
      {#each citations as citation}
        <button
          type="button"
          class:active={citation.citationId === selectedCitationId}
          class="citation-row"
          on:click={() => onSelect(citation.citationId)}
        >
          <strong>{citation.citationId} · {citation.title}</strong>
          <span>{citation.rendered}</span>
        </button>
      {/each}
    </div>
  {:else}
    <p class="muted-copy">No citations available for the current state.</p>
  {/if}
</section>

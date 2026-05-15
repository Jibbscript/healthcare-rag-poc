<script lang="ts">
  import type { DemoPrompt } from '../lib/demoPrompts';

  export let prompts: DemoPrompt[] = [];
  export let selectedId = '';
  export let onSelect: (prompt: DemoPrompt) => void = () => {};
</script>

<section class="prompt-rail" aria-label="Demo prompts">
  <div class="panel-title">
    <h2>Demo prompts</h2>
    <span>{prompts.length} cases</span>
  </div>

  <div class="prompt-list">
    {#each prompts as prompt}
      <button
        class:active={prompt.id === selectedId}
        class="prompt-card"
        type="button"
        on:click={() => onSelect(prompt)}
        aria-pressed={prompt.id === selectedId}
      >
        <span>{prompt.label}</span>
        <strong>{prompt.summary}</strong>
      </button>
    {/each}
  </div>
</section>

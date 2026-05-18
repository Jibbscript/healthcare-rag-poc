<script lang="ts">
  import type { ChatResponse } from '@healthcare-rag/core';
  import AnswerPanel from './components/AnswerPanel.svelte';
  import ApiStatus from './components/ApiStatus.svelte';
  import CitationList from './components/CitationList.svelte';
  import DemoPromptRail from './components/DemoPromptRail.svelte';
  import QuestionComposer from './components/QuestionComposer.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import TracePanel from './components/TracePanel.svelte';
  import { ChatClientError, defaultSettings, sendChat, type RedactionMode } from './lib/apiClient';
  import { defaultDashboardMode, dashboardModeLabel, type DashboardMode } from './lib/demoMode';
  import { getDemoFixtureResponse } from './lib/demoFixtures';
  import { demoPrompts, type DemoPrompt } from './lib/demoPrompts';
  import { createEphemeralSessionId } from './lib/privacy';
  import { requestStateForResponse, type RequestState } from './lib/viewModels';

  const sessionId = createEphemeralSessionId();
  const configuredApiBase = import.meta.env.VITE_API_BASE_URL ?? defaultSettings.apiBaseUrl;

  let selectedPrompt = demoPrompts[0];
  let selectedCitationId = '';
  let message = selectedPrompt.message;
  let apiBaseUrl = configuredApiBase;
  let mode: DashboardMode = configuredApiBase ? 'local-api' : defaultDashboardMode;
  let redactionMode: RedactionMode = defaultSettings.redactionMode;
  let debug = defaultSettings.debug;
  let requestState: RequestState = 'idle';
  let response: ChatResponse | null = null;
  let error: ChatClientError | null = null;

  function selectPrompt(prompt: DemoPrompt) {
    selectedPrompt = prompt;
    message = prompt.message;
    response = null;
    error = null;
    selectedCitationId = '';
    requestState = 'idle';
  }

  async function submitQuestion() {
    const trimmed = message.trim();
    if (!trimmed || requestState === 'loading') return;

    response = null;
    error = null;
    selectedCitationId = '';
    requestState = 'loading';

    try {
      const result = mode === 'fixture-demo'
        ? getDemoFixtureResponse({ prompt: selectedPrompt, message: trimmed })
        : await sendChat({
            sessionId,
            message: trimmed,
            settings: {
              apiBaseUrl,
              apiKey: defaultSettings.apiKey,
              profile: 'local',
              redactionMode,
              debug
            }
          });
      response = result;
      requestState = requestStateForResponse(result);
      selectedCitationId = result.citations[0]?.citationId ?? '';
    } catch (caught) {
      error = caught instanceof ChatClientError
        ? caught
        : new ChatClientError('network_error', 'The request could not be completed.');
      requestState = 'error';
    }
  }

  function setMode(nextMode: DashboardMode) {
    mode = nextMode;
    response = null;
    error = null;
    requestState = 'idle';
  }

  $: sourceLabel = dashboardModeLabel(mode);
</script>

<div class="app-frame">
  <header class="topbar">
    <div class="brand-lockup" aria-label="Healthcare RAG Demo Console">
      <div class="brand-mark" aria-hidden="true">R</div>
      <div>
        <h1>Healthcare RAG Demo Console</h1>
        <p>Fixture playback · public benefits corpus</p>
      </div>
    </div>

    <ApiStatus state={requestState} {mode} {apiBaseUrl} />
  </header>

  <main class="console-layout">
    <DemoPromptRail prompts={demoPrompts} selectedId={selectedPrompt.id} onSelect={selectPrompt} />

    <section class="workbench" aria-label="Benefits question workbench">
      <QuestionComposer
        {message}
        loading={requestState === 'loading'}
        {debug}
        {redactionMode}
        onMessageChange={(value) => (message = value)}
        onDebugChange={(value) => (debug = value)}
        onRedactionModeChange={(value) => (redactionMode = value)}
        onSubmit={submitQuestion}
      />

      <AnswerPanel {response} {error} loading={requestState === 'loading'} {sourceLabel} />
    </section>

    <aside class="evidence-panel" aria-label="Evidence and safety">
      <TracePanel {response} />
      <CitationList
        citations={response?.citations ?? []}
        {selectedCitationId}
        onSelect={(citationId) => (selectedCitationId = citationId)}
      />
      <SettingsPanel
        {apiBaseUrl}
        {mode}
        onApiBaseUrlChange={(value) => (apiBaseUrl = value)}
        onModeChange={setMode}
      />
    </aside>
  </main>
</div>

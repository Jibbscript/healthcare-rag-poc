# Demo questions

- Covered: What is the in-network urgent care copay for the PPO demo plan?
- Ambiguous: What is the orthodontia lifetime maximum?
- Medical advice: Should I take antibiotics for chest pain?
- PII: My member id ABC12345 asks what is the urgent care copay?
- No evidence: Does the plan cover international evacuation?

Local curl:

```bash
curl -s http://127.0.0.1:8787/chat -H 'content-type: application/json' -d '{"sessionId":"demo","message":"What is the in-network urgent care copay for the PPO demo plan?","profile":"local"}'
```

Local web console:

```bash
pnpm api-local
pnpm web:dev
```

The web console sends `profile: "local"` by default. For static preview or hosted use, configure `VITE_API_BASE_URL`; the development proxy is only available from the Vite dev server.

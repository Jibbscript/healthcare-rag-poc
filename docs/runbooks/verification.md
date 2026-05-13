# Smoke verification

- Missing index: handler should return safe error/refusal with trace id.
- Bedrock timeout: no raw prompt logged; error maps to model_error trace.
- Guardrail block: request exits before retrieval/model call.
- DDB write failure: returns explicit audit status or fails closed by config.
- Private endpoint: synth contains exactly one bedrock-runtime VPCE and no NAT.

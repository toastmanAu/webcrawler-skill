# Research Finding: nemoclaw-local-inference-fork

Date: 2026-03-18
Source: Direct code analysis of ~/useful-repos/NemoClaw/

---

## Executive Summary

**Forking NemoClaw to use local Ollama inference is extremely clean — the groundwork is already done by NVIDIA themselves.** The `ollama` endpoint type is already a first-class citizen in the codebase. Integrating the advanced task switcher (orchestrator on port 11435) requires one minor addition. Total fork scope: ~30 lines of new code + one YAML stanza.

---

## Finding 1: Ollama Support Already Built In

`nemoclaw/src/onboard/config.ts` defines:
```typescript
export type EndpointType = "build" | "ncp" | "nim-local" | "vllm" | "ollama" | "custom";
```

`nemoclaw/src/commands/onboard.ts` has full Ollama handling:
- `detectOllama()` — auto-detects local Ollama installation + running state
- `resolveProfile("ollama")` → returns `"ollama"` profile
- `resolveProviderName("ollama")` → returns `"ollama-local"`
- `resolveCredentialEnv("ollama")` → returns `"OPENAI_API_KEY"` (dummy, no real key needed)
- `defaultCredentialForEndpoint("ollama")` → returns `"ollama"`

The ONLY thing missing: the `blueprint.yaml` doesn't have an `ollama` profile stanza yet. The code references it, the profile name is defined, but the YAML entry is absent — NVIDIA started implementing it but didn't ship it.

**The fix:** Add one stanza to `nemoclaw-blueprint/blueprint.yaml`:
```yaml
ollama:
  provider_type: "openai"
  provider_name: "ollama-local"
  endpoint: "http://192.168.68.79:11434/v1"
  model: "qwen3:30b"
  credential_env: "OPENAI_API_KEY"
  credential_default: "ollama"
```

And add the network policy to whitelist the NucBox IP in `openclaw-sandbox.yaml`:
```yaml
ollama_service:
  name: ollama_service
  endpoints:
    - host: "192.168.68.79"
      port: 11434
      protocol: rest
```

That's it. ~15 lines. The sandbox then routes all inference through NucBox Ollama with full Landlock + seccomp + egress protection still in place.

---

## Finding 2: Advanced Orchestrator Integration

Our orchestrator (`http://192.168.68.89:11435`) is also OpenAI-compatible (FastAPI). Integrating it is identical — just point the endpoint there instead:

```yaml
orchestrator:
  provider_type: "openai"
  provider_name: "wyltek-orchestrator"
  endpoint: "http://192.168.68.89:11435/v1"
  model: "auto"  # orchestrator picks model based on task
  credential_env: "OPENAI_API_KEY"
  credential_default: "dummy"
```

**One catch:** The orchestrator needs to expose an OpenAI-compatible `/v1/chat/completions` endpoint. Currently it has `/inference` (custom format). Two options:

**Option A (easy):** Add a thin `/v1/chat/completions` wrapper to orchestrator.py — ~20 lines of FastAPI. The wrapper translates OpenAI format → orchestrator format → returns OpenAI-format response. NemoClaw/OpenShell never knows it's talking to our custom router.

**Option B (standalone):** Keep orchestrator standalone. Use NemoClaw with the plain Ollama profile for sandbox isolation, and manually invoke the orchestrator from scripts/skills when needed. No code changes required.

**Recommendation:** Option A. The wrapper is trivial and unlocks the full "sandboxed agent with intelligent task routing" vision. ~20 lines in orchestrator.py.

---

## Finding 3: Network Policy for LAN Endpoints

NemoClaw's egress control (`openclaw-sandbox.yaml`) requires explicit whitelisting of every outbound host. Currently only NVIDIA endpoints are listed. For a LAN fork we need to add:

```yaml
# In nemoclaw-blueprint/policies/openclaw-sandbox.yaml
- name: ollama_nucbox
  endpoints:
    - host: "192.168.68.79"
      port: 11434
      protocol: rest

- name: orchestrator_opi5p
  endpoints:
    - host: "192.168.68.89"
      port: 11435
      protocol: rest
```

The sandbox will still BLOCK any other unexpected outbound connections and surface them in the OpenShell TUI for approval. This is exactly the security property we want for a public-facing agent.

---

## Finding 4: ExperimentalEnabled Flag

`onboard.ts` has this check:
```typescript
const SUPPORTED_ENDPOINT_TYPES: EndpointType[] = ["build", "ncp"];

function isExperimentalEnabled(): boolean {
  return process.env.NEMOCLAW_EXPERIMENTAL === "1";
}
```

The ollama/vllm/nim-local endpoints are gated behind `NEMOCLAW_EXPERIMENTAL=1`. In our fork we should just remove the gate and make them first-class — they're already fully implemented.

---

## Fork Scope Summary

| Change | File | Lines |
|--------|------|-------|
| Add `ollama` profile | `blueprint.yaml` | +8 |
| Add `orchestrator` profile | `blueprint.yaml` | +8 |
| Add LAN network policies | `openclaw-sandbox.yaml` | +12 |
| Remove experimental gate | `onboard.ts` | -5 |
| OpenAI wrapper for orchestrator | `orchestrator.py` | +20 |
| **Total** | | **~43 lines** |

**No architectural changes. No new dependencies. No OpenShell internals to modify.**

---

## Recommendation

**Do the fork.** It's ~43 lines across 4 files. Call it `WyltekClaw` or similar. The result:

- Full OpenShell sandbox isolation (Landlock, seccomp, network egress control)
- Inference via NucBox Ollama (free, local, private)
- Optional: intelligent task routing via our orchestrator
- Public-facing agent capability with controlled egress
- Still fully OpenClaw-compatible (same config, same skills, same channels)

**Implementation order:**
1. Fork repo, remove experimental gate
2. Add Ollama profile + LAN network policies
3. Test basic sandbox with Ollama
4. Add OpenAI wrapper to orchestrator.py
5. Add orchestrator profile, test full routing
6. Deploy on a Pi as public-facing Wyltek agent

---

## Open Questions (need external research)

1. What does OpenShell's `host.openshell.internal` DNS resolve to? Can sandbox reach LAN IPs directly or only via host gateway?
2. Does OpenShell's k3s networking allow direct LAN access or does everything route through the host? (Affects whether `192.168.68.79` is directly reachable from sandbox)
3. Is there a way to use Tailscale addresses (`100.x.x.x`) from inside the sandbox for more robust LAN routing?

# Multi-Agent Collective — Design Notes
# Kernel (Pi5, primary) + FreeAgent (Pi target) + future agents

## The Vision

A small network of OpenClaw agents on different hardware/model tiers:
- Share observations via a common Telegram group
- Compare what works across model quality levels  
- Self-report performance, errors, rate limits
- Collectively tune their own config and HEARTBEAT tasks
- You observe and steer — but they do the benchmarking themselves

---

## Network Topology

```
                    ┌─────────────────────────────────┐
                    │   Telegram Group: "Agent Collective" │
                    │   (one group, all agents present) │
                    └──────┬──────┬──────┬─────────────┘
                           │      │      │
              ┌────────────┘  ┌───┘  ┌──┘
              │               │      │
    ┌─────────▼──────┐  ┌────▼─────┐  ┌▼──────────── ┐
    │  Kernel (me)   │  │ FreeAgent│  │ Future agents │
    │  Pi5, primary  │  │  Pi ?    │  │  Pi3, N100,   │
    │  Claude Sonnet │  │  HF free │  │  etc.         │
    │  @PinchyToast  │  │ @NewBot  │  │               │
    └────────────────┘  └──────────┘  └───────────────┘
         ↕ SSH                ↕ SSH (when you set it up)
    [your DM]           [autonomous]
```

Each agent has:
- Its own Telegram bot token (free via BotFather)
- Its own workspace + memory
- Access to the shared group
- A COLLECTIVE.md file with shared learnings

---

## Communication Model

### Option A: Shared Telegram Group (simplest, works NOW)
- Create a Telegram group, add all bot accounts
- Each bot has `groupPolicy: allowlist` with the group ID
- Bots can READ and WRITE to the group
- Natural async comms — agents post observations, others read on next heartbeat
- Downside: no structured protocol, just text

### Option B: sessions_send (cross-gateway)
- Agents on the same gateway can use `sessions_send(sessionKey, message)`  
- For cross-machine: need gateway linking (SSH tunnel or Tailscale)
- More reliable for task delegation, less for open discussion

### Recommended: BOTH
- Telegram group = the "pub" — casual updates, observations, findings
- sessions_send = direct work delegation (spawn a sub-agent on the other machine)

---

## What Agents Should Log to the Group

Each agent posts to the group when it notices something useful:

```
[Kernel/Pi5] Model check: Anthropic billing limit hit again.
  CKBDev fallback: OK. Routing all sessions there.
  Suggestion: FreeAgent, are HF rate limits better right now?

[FreeAgent/Pi?] HF status: DeepSeek-V3.2 responding in ~4s avg.
  Llama 3.3 70B hit 429 x3 this hour — rotating to Qwen3-32B.
  Task completion rate: 7/8 last 12h (1 timeout).

[Kernel/Pi5] Noted. Adding Qwen3-32B higher in my fallback chain for next hour.
```

---

## COLLECTIVE.md — Shared Knowledge File

Each agent maintains a local `COLLECTIVE.md` with learnings from the group.
When an agent reads something useful in the group chat, it updates its own copy.

Structure:
```markdown
# COLLECTIVE.md — Shared Agent Learnings

## Model Performance (updated by agents, dated)
- DeepSeek-V3.2: good general tasks, ~3-5s, rate limits at peak UTC hours (2026-02-23, FreeAgent)
- Llama 3.3 70B:  slower but reliable for longer context (2026-02-23, FreeAgent)
- Qwen3-32B:      good fallback when DeepSeek throttled (2026-02-23, FreeAgent)

## Rate Limit Patterns
- HF free tier: peak congestion 08:00-12:00 UTC (US morning)
- Best HF window: 14:00-22:00 UTC (2026-02-23, FreeAgent)

## Task Suitability by Model
- Code review: DeepSeek-R1 > DeepSeek-V3.2 > Llama (2026-02-23, FreeAgent)
- Quick Q&A: Qwen3-8B sufficient, faster (2026-02-23, FreeAgent)
- Long analysis: Gemini CLI > HF free (context window) (2026-02-23, FreeAgent)

## Config Recommendations from Collective
- (agents add here when they find something that works better)
```

---

## HEARTBEAT addition — Collective Reporting

Each agent's HEARTBEAT should include a "collective post" step:

```markdown
## Collective Report (post to group 1x/day)
Post a brief status to the agent group:
- Model working / rate-limited / slow
- Any tasks completed or failed
- Anything interesting observed
- Ask for help if stuck

Keep it short. Other agents read it on their own heartbeat cycle.
```

---

## Setup Checklist

### Phase 1 — Now (before Pi arrives)
- [x] Free agent kit ready (workspace/free-agent-kit/)
- [ ] Create Telegram group "Agent Collective" (or similar private name)
- [ ] Add @PinchyToastBot (Kernel) to the group
- [ ] Note the group chat_id (forward a message to @userinfobot or check antiscam logs)
- [ ] Create a new bot via @BotFather for the free agent — save token

### Phase 2 — Pi setup
- [ ] SSH access from this Pi5 to the new Pi
- [ ] Run free-agent-kit/setup.sh with the new bot token
- [ ] Add new bot to the collective group
- [ ] Update both agents' config with the group chat_id
- [ ] Test: both agents can post to and read the group

### Phase 3 — Collective intelligence
- [ ] Add COLLECTIVE.md to both workspaces
- [ ] Add collective reporting to both HEARTBEAT.md files
- [ ] Let them run for 48h and compare notes
- [ ] Review what they learned, tune accordingly

---

## Config Snippet — Joining the Collective Group

Add to each agent's HEARTBEAT.md once group is created:

```markdown
## Collective Group
Group ID: -100XXXXXXXXXX  (fill in after creating)
Post a brief model/task status report once per day.
Read recent messages and update COLLECTIVE.md with anything useful.
```

Add to openclaw.json channels.telegram:
```json
"groupPolicy": "allowlist",
"allowedGroups": ["-100XXXXXXXXXX"]
```

---

## Longer-Term Ideas

- **Benchmark tasks**: Kernel assigns the same task to FreeAgent, compares
  output quality and time — builds a real performance matrix per model
- **Load balancing**: if Kernel is rate-limited, delegate to FreeAgent's models
- **Distributed heartbeat**: one agent monitors what the other is running,
  restarts services across machines
- **Model voting**: both agents attempt a task, compare outputs, flag disagreements
- **Cost tracking**: FreeAgent tracks "what would this have cost on paid tier" —
  gives Phill a running $ savings counter

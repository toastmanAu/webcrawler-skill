## Research Task: Perun Payment Channels for Games

**Source:** Matt (CEO Polycrypt) — implemented chess using Perun app channels
**Repo:** https://github.com/perun-network/perun-examples/tree/master/app-channel
**Status:** PENDING
**Priority:** MEDIUM
**Context:** FiberQuest currently uses Fiber for settlement. Perun is an alternative payment channel framework — good to understand trade-offs, architecture, game integration patterns.

### Questions to Answer

1. **Perun architecture** — How does app-channel work? What's the programming model?
2. **Game integration** — How does chess example use Perun? State updates, signing, dispute resolution?
3. **vs Fiber** — Key differences in:
   - Channel opening/closing costs
   - State update latency
   - Dispute handling
   - Scriptability (can you encode game logic on-chain?)
4. **CKB compatibility** — Is Perun deployed on CKB testnet? Mainnet? Or only Ethereum?
5. **Cross-chain potential** — Could Perun work with CKB Fiber bridge?

### What NOT to Do

❌ Don't integrate Perun into FiberQuest MVP (stick with Fiber for now)
❌ Don't refactor settlement logic (too late, it works)
✅ Just understand the design + trade-offs

### Deliverable

Research finding with:
- Perun app-channel architecture summary
- Chess example walkthrough (how state updates work)
- Fiber vs Perun comparison table
- Recommendation: "Fiber is better for FiberQuest because..." or "Consider Perun if..."

---

**Task ID:** perun-gamestate-channels
**Created:** 2026-03-15 00:02 GMT+10:30
**Assigned to:** Kernel (when resumed)

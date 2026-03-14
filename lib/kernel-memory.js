/**
 * Agent Memory Integration for Kernel & Cline
 * Semantic storage for decisions, patterns, and learnings
 */

const AgentMemory = require('agent-memory');

class KernelMemory {
  constructor() {
    this.memory = new AgentMemory({
      storePath: '/home/phill/.openclaw/workspace/memory/.semantic-store',
      embeddingModel: 'nomic-embed-text', // Local on NucBox
      maxContextSize: 8000,
      retentionDays: 90,
    });
  }

  async captureDecision(category, content, metadata = {}) {
    /**
     * Auto-capture decisions:
     * - FiberQuest architecture changes
     * - Cline approval patterns
     * - Infrastructure learnings
     */
    return this.memory.capture({
      category,
      content,
      metadata: {
        timestamp: new Date(),
        agent: 'Kernel',
        ...metadata,
      },
    });
  }

  async searchContext(query, limit = 5) {
    /**
     * Semantic search for past decisions
     * Returns most relevant context without bloat
     */
    return this.memory.search(query, { limit, threshold: 0.7 });
  }

  async rememberValidator(gameName, pattern, testCases) {
    /**
     * Store validator patterns so Cline learns them
     */
    return this.captureDecision('validator-pattern', {
      game: gameName,
      bounds: pattern,
      tests: testCases,
    });
  }

  async rememberFiberSetup(config, lessons) {
    /**
     * Remember Fiber configuration learnings
     */
    return this.captureDecision('fiber-setup', {
      config,
      lessons,
    });
  }

  async rememberInfrastructure(component, status, notes) {
    /**
     * Track infrastructure decisions
     */
    return this.captureDecision('infrastructure', {
      component,
      status,
      notes,
    });
  }
}

module.exports = KernelMemory;

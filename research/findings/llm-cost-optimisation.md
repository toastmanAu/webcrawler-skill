# Research: llm-cost-optimisation-strategy

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/BerriAI/litellm/main/README.md, https://raw.githubusercontent.com/ollama/ollama/main/README.md, https://openrouter.ai/docs/quick-start, https://huggingface.co/docs/api-inference/index, https://raw.githubusercontent.com/google-gemini/cookbook/main/README.md, https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/README.md

---

Date: 2026-03-03

## Summary
This research explores LLM cost optimization strategies by analyzing provided documentation for LiteLLM, Ollama, OpenRouter, HuggingFace Inference Providers, Google Gemini, and Anthropic. LiteLLM is highlighted as a versatile tool for managing multiple LLM providers, offering features like routing, load balancing, and cost tracking, which are essential for minimizing premium token spend. Ollama provides a platform for local inference, potentially reducing cloud costs for suitable tasks. While these tools offer mechanisms for optimization, specific pricing details for various models, detailed free tier limits, concrete performance benchmarks for local inference, and practical routing recommendations for different task types were not available in the provided content.

## Questions to Answer

### 1. Current prices per million tokens for: Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B (HF free), DeepSeek V3?
The provided content does not contain specific pricing information per million tokens for any of the listed models (Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B, DeepSeek V3).

### 2. HuggingFace free inference: actual rate limits, queue times, reliability for sustained use?
The Hugging Face Inference Providers documentation mentions a "generous free tier" and "additional credits for PRO users and Team & Enterprise organizations." However, it does not specify actual rate limits, typical queue times, or reliability guarantees for sustained use of the free inference tier.

### 3. Gemini 2.5 Flash free tier: RPM/TPD limits vs paid?
The Google Gemini Cookbook mentions a "Batch API" for sending "large volume of non-time-sensitive requests to the model and get up to 90% discount." However, it does not provide details on specific RPM (Requests Per Minute) or TPD (Tokens Per Day) limits for the Gemini 2.5 Flash free tier, nor does it compare these limits to paid tiers.

### 4. OpenRouter: meaningful cost difference vs direct API for Claude/Gemini?
The OpenRouter Quickstart Guide mentions "Models & Routing," "Model Fallbacks," "Provider Selection," and "Cost Tracking" as features. However, the provided content does not offer any specific cost comparisons or indicate whether there is a "meaningful cost difference" when using OpenRouter versus direct API access for Claude or Gemini models.

### 5. LiteLLM: can it auto-route to cheapest capable model? Setup complexity?
LiteLLM's Python SDK includes a "Router with retry/fallback logic across multiple deployments (e.g. Azure/OpenAI)" and supports "application-level load balancing and cost tracking." The AI Gateway (Proxy Server) also offers "multi-tenant cost tracking and spend management per project/user." While it doesn't explicitly state "auto-route to cheapest capable model," the combination of routing, load balancing, and cost tracking strongly suggests that it provides the foundational capabilities to implement such a strategy, or can be configured to do so.

Setup complexity appears relatively low. For the Python SDK, it's a `pip install litellm` followed by simple `litellm.completion` calls. For the AI Gateway, it involves `pip install 'litellm[proxy]'`, running `litellm --model gpt-4o`, and then making OpenAI-compatible API requests to the local proxy.

### 6. Prompt caching (Anthropic): real savings for repeated system prompts like our AGENTS.md + memory?
LiteLLM's AI Gateway lists "caching" as a key feature under "per-project customization." This indicates that LiteLLM supports caching. However, the provided content does not specify the exact caching mechanism (e.g., if it specifically targets system prompts, full responses, or memory), nor does it provide data on "real savings" for repeated system prompts like `AGENTS.md` or how it interacts with memory for Anthropic models. The Anthropic SDK documentation does not mention caching.

### 7. Local inference (Ryzen qwen2.5:14b): which task types can fully replace cloud?
The Ollama README describes how to set up and run local models, providing examples for `ollama run gemma3` and a REST API for interaction. It focuses on the mechanics of local inference. However, the provided content does not offer information on specific hardware like "Ryzen," performance benchmarks for a "qwen2.5:14b" model, or guidance on which specific task types can *fully replace* cloud inference based on performance or quality metrics.

### 8. Practical routing table: heartbeat / research crawl / code gen / chat / memory write — optimal model per task?
The provided content does not include a practical routing table or recommendations for optimal models per specific task type (heartbeat, research crawl, code gen, chat, memory write). While LiteLLM and OpenRouter offer routing capabilities, they do not provide the domain-specific knowledge required to map these tasks to optimal models.

### 9. Realistic weekly token budget for our workload, optimised vs unoptimised?
The provided content does not contain any information about your specific workload, token usage patterns, or financial data. Therefore, it is not possible to provide a realistic weekly token budget, whether optimized or unoptimized.

## Gaps / Follow-up
1.  **LLM Pricing:** Obtain current pricing per million tokens for all target models (Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B, DeepSeek V3) directly from their respective providers' documentation or pricing pages.
2.  **Free Tier Specifics:** Research actual rate limits, queue times, and reliability for sustained use of HuggingFace's free inference tier and Gemini 2.5 Flash/Pro free tiers (RPM/TPD limits).
3.  **OpenRouter Cost Analysis:** Investigate specific cost differences between OpenRouter and direct API access for Claude and Gemini models to determine if there's a meaningful saving.
4.  **LiteLLM Auto-routing Configuration:** Explore LiteLLM's documentation for detailed configuration options for its router, specifically how to implement cost-based routing to the cheapest capable model.
5.  **LiteLLM Caching Details:** Investigate the specifics of LiteLLM's caching mechanism (what is cached, cache invalidation, configuration) and look for benchmarks or case studies on savings, especially for repeated system prompts.
6.  **Local Inference Benchmarks:** Conduct or find benchmarks for `qwen2.5:14b` (or similar models) running on a Ryzen system for various task types to determine which can reliably replace cloud inference.
7.  **Optimal Model Selection:** Research and define a practical routing table by identifying optimal models for specific task types (heartbeat, research crawl, code gen, chat, memory write) based on performance, quality, and cost, potentially using external benchmarks or provider recommendations.
8.  **Workload Analysis & Budgeting:** Provide details on the current workload (e.g., number of requests per task type, average token usage per request) to enable a realistic token budget estimation.

## Relevant Code/API Snippets

### LiteLLM Python SDK
```python
from litellm import completion
import os

os.environ["OPENAI_API_KEY"] = "your-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "your-anthropic-key"

# OpenAI example
response = completion(model="openai/gpt-4o", messages=[{"role": "user", "content": "Hello!"}])

# Anthropic example
response = completion(model="anthropic/claude-sonnet-4-20250514", messages=[{"role": "user", "content": "Hello!"}])
```
*(Source: https://raw.githubusercontent.com/BerriAI/litellm/main/README.md)*

### LiteLLM AI Gateway (Proxy Server)
```python
import openai
client = openai.OpenAI(api_key="anything", base_url="http://0.0.0.0:4000")
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```
*(Source: https://raw.githubusercontent.com/BerriAI/litellm/main/README.md)*

### Ollama Local Inference (CLI)
```shell
ollama run gemma3
```
*(Source: https://raw.githubusercontent.com/ollama/ollama/main/README.md)*

### Ollama REST API
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma3",
  "messages": [{ "role": "user", "content": "Why is the sky blue?" }],
  "stream": false
}'
```
*(Source: https://raw.githubusercontent.com/ollama/ollama/main/README.md)*

### Ollama Python SDK
```python
from ollama import chat
response = chat(model='gemma3', messages=[
  {
    'role': 'user',
    'content': 'Why is the sky blue?',
  },
])
print(response.message.content)
```
*(Source: https://raw.githubusercontent.com/ollama/ollama/main/README.md)*
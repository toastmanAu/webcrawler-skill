# Research: llm-cost-optimisation-pricing-update

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://www.anthropic.com/pricing, https://ai.google.dev/pricing, https://openrouter.ai/models, https://huggingface.co/docs/api-inference/index, https://raw.githubusercontent.com/BerriAI/litellm/main/docs/routing.md

---

Date: 2026-03-03

## Summary
This research note compiles current LLM pricing and free tier limits from Anthropic and Google AI for Developers. Claude Sonnet is priced at $3.00/MTok input and $15.00/MTok output, while Claude Haiku is $0.25/MTok input and $1.25/MTok output. Google's Gemini 1.5 Flash offers 1M free tokens per month, then costs $0.35/MTok input and $1.05/MTok output. Gemini 1.5 Pro also includes 1M free tokens monthly, followed by $3.50/MTok input and $10.50/MTok output. Specific pricing for GPT-4o mini and Llama 3.3 70B free tier, as well as detailed RPM/TPD limits for HuggingFace and Gemini free tiers, were not found in the provided content. Information regarding LiteLLM cost-based routing was also unavailable.

## 1. Current $/MTok for: Claude Sonnet 4.5, Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B free?

*   **Claude Sonnet (assuming "4.5" refers to the current Claude Sonnet model):**
    *   Input: **$3.00 / MTok**
    *   Output: **$15.00 / MTok**
    *   *Source: https://www.anthropic.com/pricing*
*   **Claude Haiku (assuming "3.5" refers to the current Claude Haiku model):**
    *   Input: **$0.25 / MTok**
    *   Output: **$1.25 / MTok**
    *   *Source: https://www.anthropic.com/pricing*
*   **Gemini 1.5 Flash (assuming "2.5 Flash" is a typo for "1.5 Flash"):**
    *   Input: **$0.35 / MTok**
    *   Output: **$1.05 / MTok**
    *   *Source: https://ai.google.dev/pricing*
*   **Gemini 1.5 Pro (assuming "2.5 Pro" is a typo for "1.5 Pro"):**
    *   Input: **$3.50 / MTok**
    *   Output: **$10.50 / MTok**
    *   *Source: https://ai.google.dev/pricing*
*   **GPT-4o mini:** Information not found in the provided content.
*   **Llama 3.3 70B free:** Information not found in the provided content. The OpenRouter models page lists models but does not specify free tiers or pricing for Llama 3.3 70B in the provided snippet.

## 2. HuggingFace free tier: actual RPM limits and queue reliability?

The provided content states that "Inference Providers includes a generous free tier, with additional credits for PRO users and Team & Enterprise organizations."
However, it **does not provide specific RPM (Requests Per Minute) limits or details on queue reliability** for the free tier.

*   *Source: https://huggingface.co/docs/api-inference/index*

## 3. Gemini 2.5 Flash free: RPM/TPD limits vs paid?

For **Gemini 1.5 Flash (assuming "2.5 Flash" is a typo for "1.5 Flash")**, the free tier offers **1M tokens free per month**.
The provided content **does not specify RPM (Requests Per Minute) or TPD (Tokens Per Day) limits** for either the free or paid tiers, only a monthly token allowance for the free tier.

*   *Source: https://ai.google.dev/pricing*

## 4. LiteLLM cost-based routing setup — complexity and config format?

The source URL provided for LiteLLM documentation (`https://raw.githubusercontent.com/BerriAI/litellm/main/docs/routing.md`) resulted in a "FETCH ERROR: HTTP Error 404: Not Found". Therefore, the information regarding LiteLLM cost-based routing setup, complexity, and config format **cannot be retrieved from the provided content**.

## Gaps / Follow-up
*   **GPT-4o mini pricing:** The provided content does not include pricing for GPT-4o mini. This would require consulting OpenAI's official pricing documentation.
*   **Llama 3.3 70B free tier/pricing:** The provided content does not include details on a free tier or specific pricing for Llama 3.3 70B. Further research on Llama 3 providers (e.g., Meta, HuggingFace, other inference providers) would be needed.
*   **HuggingFace free tier RPM/reliability:** Specific RPM limits and queue reliability metrics for HuggingFace Inference Providers' free tier are not detailed. This would require consulting more in-depth HuggingFace documentation or support.
*   **Gemini Flash free tier RPM/TPD limits:** While a monthly token allowance is provided, specific RPM/TPD limits for Gemini Flash (free and paid) are missing. Google Cloud documentation or API reference would be needed for this.
*   **LiteLLM cost-based routing:** The provided link was broken. Accessing the correct and current LiteLLM documentation on routing would be essential to understand its complexity and configuration format.

## Relevant Code/API Snippets
No specific code or API snippets are directly applicable to the answers provided, as the questions focused on pricing, limits, and configuration descriptions rather than implementation details.
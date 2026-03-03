# Research: local-repo-mirror-strategy

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository, https://raw.githubusercontent.com/nicowillis/git-mirror/main/README.md, https://api.github.com/repos/nervosnetwork/fiber, https://api.github.com/repos/nervosnetwork/ckb, https://api.github.com/repos/sporeprotocol/spore-sdk

---

## Research Note: local-repo-mirror-strategy

**Date:** 2026-03-03

### Summary
Mirroring key Nervos/CKB repositories locally offers significant speed benefits for AI-assisted code search due to direct disk access compared to network fetches. The total disk cost for full clones of the identified repos (ckb, fiber, spore-sdk) is relatively small, well within the capacity of both proposed hosts. A nightly `git fetch --all` strategy is suitable for keeping mirrors fresh. However, specific GitHub rate limits for `raw.githubusercontent.com` and advanced semantic search tools beyond `grep` are not detailed in the provided content.

### 1. What's the actual size of key Nervos repos (ckb, fiber, rfcs, spore-sdk)? Shallow vs full clone disk cost?

Based on the GitHub API responses, the sizes (in kilobytes, representing the full repository size) are:

*   **nervosnetwork/ckb**: 44362 KB (approx. 44.36 MB)
*   **nervosnetwork/fiber**: 8918 KB (approx. 8.92 MB)
*   **sporeprotocol/spore-sdk**: 879 KB (approx. 0.88 MB)
*   **nervosnetwork/rfcs**: Not found in the provided content.
*   **ckb-ccc**: Not found in the provided content.

The `size` field from the GitHub API typically represents the full repository size, including all history and the working tree. A shallow clone (`git clone --depth 1`) would generally consume less disk space as it only fetches the latest commit, but the exact disk cost for a shallow clone is not provided in the source content.

### 2. For AI-assisted code search: local ripgrep vs web_fetch of raw files — when does each win?

Local `ripgrep` will almost always win over `web_fetch` for AI-assisted code search in terms of speed and efficiency, especially for frequent or complex searches.

*   **Local `ripgrep`**:
    *   **Wins on speed**: Accessing files directly from local disk is significantly faster than fetching them over a network, eliminating network latency and bandwidth constraints. `ripgrep` is highly optimized for speed.
    *   **Wins on cost**: No network data transfer costs.
    *   **Wins on reliability**: Not dependent on external network connectivity or GitHub's service availability.
    *   **Wins on scope**: Can search across the entire mirrored repository history (if a full clone) and all files without individual fetch requests.
*   **`web_fetch` of raw files**:
    *   **Wins on initial setup**: No local storage required, simpler for one-off or very infrequent access to a small number of files.
    *   **Loses on speed**: Each file fetch incurs network latency and download time. For 50+ fetches/day, this would accumulate significant delays.
    *   **Loses on cost**: Incurs network data transfer costs.
    *   **Loses on reliability**: Subject to network issues, GitHub's uptime, and potential rate limits.
    *   **Loses on scope**: Requires knowing which specific files to fetch, making broad or exploratory searches inefficient.

Given an AI agent workflow that likely performs numerous searches, local `ripgrep` against a mirror is the superior strategy for both speed and cost-effectiveness.

### 3. Best cron strategy for keeping mirrors fresh — git fetch --all nightly?

A `git fetch --all` nightly cron job is an effective and common strategy for keeping local mirrors fresh.

*   **`git fetch --all`**: This command fetches all branches and tags from all configured remotes. It updates the remote-tracking branches in the local repository without modifying the local working directory. This is ideal for a mirror that primarily serves as a data source for searching.
*   **Nightly cron**: Running this nightly ensures the mirror is updated regularly, typically outside peak usage hours, minimizing impact on other operations while keeping the data reasonably fresh for the next day's workflow.

Example cron entry (adjust path and timing as needed):
```cron
0 3 * * * cd /path/to/local/mirror/repo && git fetch --all
```

For a bare mirror (created with `git clone --mirror`), the command would be `git remote update`.

### 4. Does GitHub rate-limit raw.githubusercontent.com at the scale of our crawler (50+ fetches/day)?

The provided content does **not** contain information regarding GitHub's rate limits for `raw.githubusercontent.com`. While GitHub's API has documented rate limits, the content does not specify if or how these apply to raw content delivery, especially at the scale of 50+ fetches per day.

### 5. Would Ryzen (Ethernet, 214GB free) or Pi5 (828GB free) be the better mirror host?

The **Pi5 (828GB free)** would be the better mirror host based on the provided information, primarily due to its significantly larger free disk space.

*   **Disk Space**: The total size of the known repositories (ckb, fiber, spore-sdk) is approximately 54.16 MB. Even if `rfcs` and `ckb-ccc` were considerably larger, the total would likely remain well under 1 GB. However, if the AI agent workflow involves storing additional data, logs, or other large datasets alongside the mirrors, the Pi5's 828GB free space offers much more headroom and future scalability compared to the Ryzen's 214GB.
*   **Network**: Both have Ethernet, which is suitable for fetching updates.
*   **Processing Power**: For simply hosting git repositories and running `git fetch`, the processing power difference between Ryzen and Pi5 is unlikely to be a bottleneck. For `ripgrep` searches, a Ryzen would generally be faster, but the question is about the *mirror host*, not necessarily the search engine host. If the search engine runs on the same machine, the Ryzen would be preferred for search performance, but for *hosting the mirror*, disk space is the most differentiating factor here.

### 6. Any tools that auto-index a local git repo for semantic search beyond grep?

The provided content does **not** mention any tools that auto-index a local git repo for semantic search beyond `grep`.

### Gaps / Follow-up
*   **Repository Sizes**: The actual sizes for `nervosnetwork/rfcs` and `ckb-ccc` are missing. These would need to be queried via the GitHub API (e.g., `https://api.github.com/repos/nervosnetwork/rfcs`).
*   **Shallow Clone Disk Cost**: The exact disk cost for shallow clones is not available. This would require performing actual shallow clones and measuring disk usage.
*   **GitHub Raw Content Rate Limits**: Specific documentation on rate limits for `raw.githubusercontent.com` is needed to fully assess the risk of hitting limits with 50+ fetches/day.
*   **Semantic Search Tools**: Research into existing tools for semantic code search (e.g., OpenGrok, Sourcegraph, various AI-powered code search engines) would be beneficial.
*   **AI Agent Workflow Details**: Understanding the frequency, depth, and nature of the AI agent's searches would help refine the cost/speed benefit analysis and host selection.

### Relevant Code/API Snippets
*   **GitHub API for Repository Details (e.g., `fiber`):**
    ```json
    {
        "id": 770731915,
        "name": "fiber",
        "full_name": "nervosnetwork/fiber",
        "size": 8918, // Size in kilobytes
        "clone_url": "https://github.com/nervosnetwork/fiber.git",
        // ... other fields
    }
    ```
*   **GitHub API for Repository Details (e.g., `ckb`):**
    ```json
    {
        "id": 158225088,
        "name": "ckb",
        "full_name": "nervosnetwork/ckb",
        "size": 44362, // Size in kilobytes
        "clone_url": "https://github.com/nervosnetwork/ckb.git",
        // ... other fields
    }
    ```
*   **GitHub API for Repository Details (e.g., `spore-sdk`):**
    ```json
    {
        "id": 665858556,
        "name": "spore-sdk",
        "full_name": "sporeprotocol/spore-sdk",
        "size": 879, // Size in kilobytes
        "clone_url": "https://github.com/sporeprotocol/spore-sdk.git",
        // ... other fields
    }
    ```
*   **Git command for cloning a repository:**
    ```bash
    git clone https://github.com/nervosnetwork/ckb.git
    ```
*   **Git command for updating a mirror:**
    ```bash
    git fetch --all
    # or for a bare mirror:
    git remote update
    ```
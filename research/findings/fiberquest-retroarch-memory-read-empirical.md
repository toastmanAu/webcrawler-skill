# Research: fiberquest-retroarch-memory-read-empirical

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c, https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/scriptmodules/emulators/retroarch.sh, https://retropie.org.uk/docs/RetroArch-Network-Commands/, https://raw.githubusercontent.com/nicowillis/retroarch-memory/master/README.md, https://raw.githubusercontent.com/libretro/RetroArch/master/tasks/task_netplay_lan.c

---

## Research Note: fiberquest-retroarch-memory-read-empirical

**Date:** 2026-03-06

### Summary
The research goal was to determine the exact empirical wire format for RetroArch `READ_CORE_MEMORY` and `WRITE_CORE_MEMORY` network commands, along with relevant `retroarch.cfg` keys and working code snippets. Unfortunately, the most relevant source files (`net_retropad_core.c`, `retroarch-memory/README.md`) and documentation (`retropie.org.uk/docs/RetroArch-Network-Commands/`) were either inaccessible (HTTP 404 or browser verification) or did not contain the specific information required. Consequently, the exact wire formats and working code snippets could not be empirically determined from the provided content. The `retroarch.sh` script, while accessible, did not contain `iniSet` calls for network command configuration keys.

### Questions to Answer

1.  **Exact plaintext format of READ_CORE_MEMORY request — is it "READ_CORE_MEMORY 0xADDR SIZE" or different?**
    The exact plaintext format for the `READ_CORE_MEMORY` request could not be determined from the provided content. The file `https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c`, which would likely contain this information, returned an HTTP 404 error.

2.  **Exact response format — "0xADDR=0xVALUE\n" or different?**
    The exact response format for `READ_CORE_MEMORY` could not be determined from the provided content. The file `https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c`, which would likely contain this information, returned an HTTP 404 error.

3.  **WRITE_CORE_MEMORY request and response format?**
    The request and response formats for `WRITE_CORE_MEMORY` could not be determined from the provided content. The file `https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c`, which would likely contain this information, returned an HTTP 404 error.

4.  **retroarch.cfg keys to enable network commands (network_cmd_enable, network_cmd_port)?**
    The `retroarch.sh` script, which configures `retroarch.cfg` settings, was reviewed. It contains numerous `iniSet` calls for various RetroArch options (e.g., `cache_directory`, `video_threaded`, `input_enable_hotkey`). However, no `iniSet` calls for `network_cmd_enable`, `network_cmd_port`, or similar network command-related configuration keys were found in the provided `retroarch.sh` content.

5.  **Any working Node.js or Python snippets that have been confirmed working?**
    No working Node.js or Python snippets were found in the provided content. The `https://raw.githubusercontent.com/nicowillis/retroarch-memory/master/README.md` link, which might have contained such snippets, returned an HTTP 404 error.

### Gaps / Follow-up
*   The primary gap is the lack of access to the `net_retropad_core.c` source file and the `retroarch-memory/README.md` file, which are crucial for understanding the empirical wire formats and finding working code examples.
*   The `retropie.org.uk/docs/RetroArch-Network-Commands/` documentation page was inaccessible due to a browser verification step. Gaining access to this page would likely provide the necessary configuration keys and command formats.
*   Further investigation would require direct access to the RetroArch source code (specifically the `network/net_retropad` directory) or official documentation that details these network commands.

### Relevant Code/API Snippets
No relevant code or API snippets directly answering the research questions could be extracted from the provided content due to the reasons stated above. The `retroarch.sh` script provided examples of `iniSet` usage for other configuration parameters, but not for network commands.
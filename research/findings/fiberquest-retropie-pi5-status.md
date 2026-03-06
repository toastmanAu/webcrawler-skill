# Research: fiberquest-retropie-pi5-status

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://retropie.org.uk/docs/Raspberry-Pi-5/, https://github.com/RetroPie/RetroPie-Setup/discussions, https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/scriptmodules/emulators/retroarch.sh, https://forums.libretro.com/t/retroarch-pi5-wayland/, https://raw.githubusercontent.com/libretro/RetroArch/master/Makefile.griffin

---

Date: 2026-03-06

## Research Note: fiberquest-retropie-pi5-status

### Summary
The provided web content does not definitively confirm official RetroPie installer support for Raspberry Pi 5 with Pi OS Bookworm as of December 2024. Cloudflare blocks and 404 errors prevented access to key documentation and discussion forums. The RetroPie RetroArch setup script (`retroarch.sh`) indicates that Wayland support is explicitly disabled during compilation if the platform is not X11, and RetroArch is configured to run in fullscreen by default on X11 or Mesa platforms. Information regarding specific SNES core performance or recommended installation approaches for unsupported configurations is not available in the provided sources.

### Questions to Answer

**(1) Does the official RetroPie installer support Pi 5 + Pi OS Bookworm (Dec 2024 status)?**
The provided content does not allow for a definitive answer. The `https://retropie.org.uk/docs/Raspberry-Pi-5/` page was blocked by Cloudflare, and `https://github.com/RetroPie/RetroPie-Setup/discussions` returned a 404 error. The `retroarch.sh` script is generic for Raspberry Pi (`isPlatform "rpi"`) and does not specify "Pi 5" or "Bookworm" support status.

**(2) If not officially supported, what's the recommended approach — manual RetroArch install via apt, or a fork?**
Since official support could not be confirmed, a recommended alternative approach cannot be determined from the provided content. The `retroarch.sh` script details how RetroPie's setup script configures RetroArch, but it does not suggest alternative installation methods outside of the RetroPie framework.

**(3) Best SNES core on Pi5 (snes9x vs bsnes-mercury vs mesen-s) for accuracy + performance?**
The provided content does not contain any information regarding specific SNES emulator cores (snes9x, bsnes-mercury, mesen-s) or their performance/accuracy on the Raspberry Pi 5.

**(4) Any known issues with RetroArch + Wayland on Pi OS Bookworm?**
The provided content does not explicitly list known issues with RetroArch + Wayland on Pi OS Bookworm. However, the `retroarch.sh` script indicates a specific configuration choice: Wayland support is disabled during RetroArch compilation if the platform is not identified as X11. This is shown by the line `! isPlatform "x11" && params+=(--disable-wayland)`. This suggests that RetroPie's default build process for RetroArch may not enable Wayland support in certain environments, rather than detailing specific issues. The content does not mention "Bookworm" in this context.

**(5) Side-by-side window setup — can RetroArch run in a window (not fullscreen) alongside an Electron app?**
The `retroarch.sh` script configures RetroArch to run in fullscreen by default on X11 and Mesa platforms, as indicated by:
- `isPlatform "x11" && iniSet "video_fullscreen" "true"`
- `isPlatform "mesa" && iniSet "video_fullscreen" "true"`
While this is the default configuration set by the RetroPie script, RetroArch itself is generally capable of running in a windowed mode by changing the `video_fullscreen` setting to `false` in its configuration file. The provided content does not explicitly confirm a side-by-side setup with an Electron app, but the ability to disable fullscreen mode suggests it is technically feasible to run RetroArch in a window alongside other desktop applications, assuming sufficient system resources.

### Gaps / Follow-up
*   **Official Pi 5 / Bookworm Support:** Direct access to the RetroPie Raspberry Pi 5 documentation page (`https://retropie.org.uk/docs/Raspberry-Pi-5/`) and the RetroPie-Setup discussions is needed to confirm official support status and any specific instructions or known issues.
*   **Recommended Installation Approach:** If official support is lacking, further research is required to identify community-recommended installation methods (e.g., manual `apt` install, specific forks, or workarounds) for RetroArch on Pi 5 with Bookworm.
*   **SNES Core Performance:** Benchmarking or community discussions on SNES core performance (snes9x, bsnes-mercury, mesen-s) on the Raspberry Pi 5 are needed to determine the best option for accuracy and performance.
*   **Wayland Issues:** More specific information on known issues or successful configurations for RetroArch running under Wayland on Pi OS Bookworm is required, beyond the default `disable-wayland` compilation flag in the RetroPie script.

### Relevant Code/API Snippets

From `https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/scriptmodules/emulators/retroarch.sh`:

**Wayland configuration:**
```bash
! isPlatform "x11" && params+=(--disable-wayland)
```

**Fullscreen configuration:**
```bash
isPlatform "x11" && iniSet "video_fullscreen" "true"
isPlatform "mesa" && iniSet "video_fullscreen" "true"
```
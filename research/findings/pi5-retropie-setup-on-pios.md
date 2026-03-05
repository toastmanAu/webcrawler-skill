# Research: pi5-retropie-setup-on-pios

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://retropie.org.uk/docs/Raspberry-Pi-5/, https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/README.md, https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/retropie_setup.sh, https://www.raspberrypi.com/documentation/computers/os.html, https://retropie.org.uk/docs/First-Installation/

---

Date: 2026-03-05

## Summary

The RetroPie-Setup script provides general installation instructions for Raspberry Pi OS, including steps to update packages, install Git, clone the setup script, and execute it. While a dedicated documentation page for Raspberry Pi 5 exists (`https://retropie.org.uk/docs/Raspberry-Pi-5/`), its content was inaccessible during this research. Consequently, specific details regarding official Pi 5 support within the installer script, RetroArch performance on Pi 5 with VideoCore VII/v3d, known issues with Pi OS Bookworm, and recommendations for SNES cores could not be determined from the provided sources.

## Questions to Answer

### 1. Does the official RetroPie installer script support Pi 5 yet, or is there a fork/workaround?

Based on the provided content, the `RetroPie-Setup/README.md` states the script is "designed for use on Raspberry Pi OS (previously called Raspbian) on the Raspberry Pi." It does not explicitly mention support for the Raspberry Pi 5 specifically.

A URL titled `https://retropie.org.uk/docs/Raspberry-Pi-5/` was provided, which strongly suggests that information regarding Pi 5 support exists. However, the content of this URL was inaccessible, returning "Verifying... Verifying your browser...". Therefore, explicit confirmation of official Pi 5 support in the installer script or details about forks/workarounds cannot be provided from the accessible content.

### 2. What are the exact install steps — which packages, which script version?

The exact installation steps provided in `RetroPie-Setup/README.md` are as follows:

1.  Ensure APT repositories are up-to-date and Git is installed:
    ```shell
    sudo apt-get update
    sudo apt-get dist-upgrade
    sudo apt-get install git
    ```
2.  Download the latest RetroPie setup script:
    ```shell
    cd
    git clone --depth=1 https://github.com/RetroPie/RetroPie-Setup.git
    ```
3.  Execute the script:
    ```shell
    cd RetroPie-Setup
    sudo ./retropie_setup.sh
    ```

The primary package explicitly mentioned for installation is `git`. The `README.md` also notes that "When you first run the script it may install some additional packages that are needed."

The script version obtained by `git clone --depth=1 https://github.com/RetroPie/RetroPie-Setup.git` will be the latest version available on the `master` branch of the RetroPie-Setup repository at the time of execution.

### 3. Does RetroArch run well on Pi 5 with VideoCore VII / v3d driver?

The provided content does not contain any information regarding the performance of RetroArch on the Raspberry Pi 5, nor does it mention the VideoCore VII or v3d driver in relation to RetroArch.

### 4. Any known issues with Pi OS Bookworm + RetroPie?

The provided content does not contain any information about known issues specifically with Pi OS Bookworm and RetroPie. The `RetroPie-Setup/README.md` refers generally to "Raspberry Pi OS (previously called Raspbian)."

### 5. Best SNES core for Pi 5 (snes9x vs bsnes vs mesen-s)?

The provided content does not contain any information or recommendations regarding specific SNES cores (snes9x, bsnes, mesen-s) or their performance on the Raspberry Pi 5.

## Gaps / Follow-up

The following questions could not be fully answered due to inaccessible or missing information in the provided content:

*   **Official Pi 5 Support:** The content of `https://retropie.org.uk/docs/Raspberry-Pi-5/` was inaccessible, which would likely contain definitive information on official Pi 5 support for the RetroPie installer script and any specific considerations.
*   **RetroArch Performance:** There is no information on RetroArch performance on the Pi 5, specifically concerning the VideoCore VII / v3d driver.
*   **Pi OS Bookworm Issues:** No known issues with Pi OS Bookworm and RetroPie were detailed.
*   **SNES Core Recommendations:** There is no guidance on the best SNES core for the Pi 5.
*   The content of `https://retropie.org.uk/docs/First-Installation/` was also inaccessible and might contain relevant general installation details.

Accessing the content of `https://retropie.org.uk/docs/Raspberry-Pi-5/` and `https://retropie.org.uk/docs/First-Installation/` would be the primary follow-up step to address these gaps.

## Relevant Code/API Snippets

```shell
# Update APT repositories and install git
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install git

# Download the latest RetroPie setup script
cd
git clone --depth=1 https://github.com/RetroPie/RetroPie-Setup.git

# Execute the setup script
cd RetroPie-Setup
sudo ./retropie_setup.sh
```
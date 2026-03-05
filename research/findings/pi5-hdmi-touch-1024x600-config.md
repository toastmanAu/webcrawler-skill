# Research: pi5-hdmi-touch-1024x600-config

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://www.raspberrypi.com/documentation/computers/config_txt.html, https://raw.githubusercontent.com/raspberrypi/firmware/master/boot/overlays/README, https://www.raspberrypi.com/documentation/computers/raspberry-pi.html, https://forums.raspberrypi.com/viewtopic.php?t=364817

---

Date: 2026-03-05

## Summary
The research goal is to identify `config.txt` settings for a 1024x600 HDMI touchscreen on a Raspberry Pi 5, including display mode, touch driver setup, calibration, rotation, and Pi 5 specific syntax changes. Due to "FETCH ERROR: HTTP Error 403: Forbidden" for the primary Raspberry Pi documentation links (`config_txt.html` and `raspberry-pi.html`), critical information regarding `hdmi_group`, `hdmi_mode`, `hdmi_cvt`, display rotation, and detailed Pi 5 `config.txt` syntax changes is unavailable. The provided `overlays/README` offers general insights into Device Tree overlays (`dtoverlay`) and parameters (`dtparam`) but lacks the specific display and touchscreen configuration details required.

## Questions to Answer

### 1. Exact hdmi_group, hdmi_mode or hdmi_cvt settings for 1024x600
The exact `hdmi_group`, `hdmi_mode`, or `hdmi_cvt` settings for a 1024x600 resolution display cannot be determined from the provided content. The authoritative documentation for `config.txt` (https://www.raspberrypi.com/documentation/computers/config_txt.html) was inaccessible due to a fetch error.

### 2. Touch driver setup — common ICs used on 1024x600 HDMI touchscreens (FT5406, GT911, USB HID)
The provided `overlays/README` describes the general mechanism for configuring additional hardware using Device Tree overlays (`dtoverlay`). For example, `dtoverlay=i2c-rtc,ds1307` is used to load an I2C Real Time Clock driver. This suggests that I2C-based touchscreens would likely be configured via `dtoverlay` in `config.txt`, potentially with parameters for the specific IC and I2C address.

However, the provided content does not list common ICs like FT5406 or GT911, nor does it specify the corresponding `dtoverlay` names or parameters for these touch controllers. It also does not explicitly detail driver setup for USB HID touchscreens, which are typically handled by the kernel without explicit `config.txt` entries for the driver itself.

### 3. Touch calibration on Pi OS Bookworm (Wayland vs X11 differences)
The provided content does not contain any information regarding touch calibration on Pi OS Bookworm, nor does it discuss differences between Wayland and X11 environments for such calibration.

### 4. Display rotation if needed
The provided content does not contain any information regarding display rotation settings for Raspberry Pi. This information would typically be found in the `config.txt` documentation, which was inaccessible.

### 5. Any known Pi 5 config.txt syntax changes from Pi 4 (Pi 5 uses different dtparam/dtoverlay syntax)
The `overlays/README` confirms that `dtparam` and `dtoverlay` are the mechanisms for controlling Device Tree usage and loading overlays on Raspberry Pi, stating: "On Raspberry Pi, Device Tree usage is controlled from /boot/config.txt." and "Overlays are loaded using the "dtoverlay" config.txt setting."

The README also lists parameters specific to the Pi 5's RP1 chip, such as `drm_fb0_rp1_dpi`, `drm_fb0_rp1_dsi0`, `drm_fb1_rp1_dpi`, etc., which assign framebuffers to different RP1 display outputs. These are new parameters/overlays relevant to the Pi 5's architecture.

However, the provided content does not explicitly state that the *syntax* for `dtparam` or `dtoverlay` has changed between Pi 4 and Pi 5. It demonstrates the same `dtparam=key=value` and `dtoverlay=name,param=value` syntax. While new parameters and overlays exist for Pi 5's unique hardware (like RP1), the fundamental syntax for using `dtparam` and `dtoverlay` appears consistent based on the available `overlays/README`. Without the `config_txt.html` documentation, a definitive answer on specific syntax *changes* (as opposed to new parameters/overlays) cannot be given.

## Gaps / Follow-up
1.  **Access to `config_txt.html`:** The most significant gap is the inability to access `https://www.raspberrypi.com/documentation/computers/config_txt.html`. This document is crucial for answering questions about `hdmi_group`, `hdmi_mode`, `hdmi_cvt`, display rotation, and comprehensive Pi 5 `config.txt` syntax changes.
2.  **Specific Overlay Names for Touchscreens:** While `dtoverlay` is the mechanism, the specific overlay names (e.g., `ft5406`, `gt911`) and their parameters for common touchscreen ICs are not provided.
3.  **Touch Calibration Documentation:** Information on touch calibration tools and procedures for Pi OS Bookworm, especially considering Wayland vs. X11, is entirely missing.
4.  **General Pi 5 Documentation:** `https://www.raspberrypi.com/documentation/computers/raspberry-pi.html` would likely contain more context on Pi 5 hardware and software configuration, which was also inaccessible.

## Relevant Code/API Snippets
From `https://raw.githubusercontent.com/raspberrypi/firmware/master/boot/overlays/README`:

*   **Enabling interfaces:**
    ```
    dtparam=i2c=on,i2s=on,spi=on
    ```
*   **Loading an overlay with parameters:**
    ```
    dtoverlay=i2c-rtc,ds1307
    dtoverlay=i2c-rtc,ds1307,addr=0x68
    ```
*   **Pi 5 specific display output assignments (RP1):**
    ```
    drm_fb0_rp1_dpi
    drm_fb0_rp1_dsi0
    drm_fb0_rp1_dsi1
    ```
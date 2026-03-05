# Research: pi5-gpio-fan-mosfet-control

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/raspberrypi/firmware/master/boot/overlays/README, https://www.raspberrypi.com/documentation/computers/config_txt.html, https://www.raspberrypi.com/documentation/computers/raspberry-pi.html, https://gpiozero.readthedocs.io/en/latest/api_output.html

---

Date: 2026-03-05

## Summary

For Raspberry Pi 5 GPIO fan control, the `cooling_fan` overlay is mentioned as being automatically enabled by the firmware, specifically for the Pi 5. The provided documentation does not detail specific `config.txt` parameters for temperature thresholds or GPIO pin selection for this overlay, nor does it explicitly state if the older `gpio-fan` overlay is still applicable or how the RP1 IO controller impacts GPIO fan setup. While PWM control is generally superior for fan speed management, the source content does not compare software vs. hardware PWM or mention `pigpio` in this context.

## Questions to Answer

### 1. Which dtoverlay controls GPIO fan on Pi 5 — is it still gpio-fan or has it changed?

The provided `overlays/README` indicates a specific overlay for the Pi 5 cooling fan:
*   **Name:** `cooling_fan`
*   **Info:** "Enables the Pi 5 cooling fan (enabled automatically by the firmware)"

This suggests that for the Pi 5, the `cooling_fan` overlay is the relevant one, and it's handled automatically by the firmware. The document does not explicitly state whether the `gpio-fan` overlay (which is common on older Pis) is still used or superseded for the Pi 5.

### 2. What config.txt lines control the temperature thresholds and GPIO pin?

The `overlays/README` entry for `cooling_fan` only states "Enables the Pi 5 cooling fan (enabled automatically by the firmware)". It **does not list any parameters** for controlling temperature thresholds or specifying a GPIO pin. This information is not available in the provided content.

### 3. PWM fan control vs simple on/off — which is better for a MOSFET-switched fan?

Based on the `gpiozero` documentation, PWM (Pulse Width Modulation) allows for variable control, as seen with `PWMLED` which can have a `value` between 0.0 (off) and 1.0 (fully on) for varying brightness. In contrast, `LED` only supports `on()` and `off()` states.

For a MOSFET-switched fan, PWM control is generally better as it allows for smooth, variable fan speed adjustment based on temperature, reducing noise and power consumption compared to simple on/off control. A MOSFET can be used to switch both simple on/off (digital output) and PWM signals (variable duty cycle). The provided content does not explicitly state which is "better" for a fan, but the existence of `PWMLED` implies variable control is a desired feature for output devices.

### 4. Does Pi 5's RP1 IO controller change any GPIO fan setup vs Pi 4?

The `overlays/README` mentions the RP1 IO controller in the context of display outputs (e.g., `drm_fb0_rp1_dpi`, `drm_fb0_rp1_dsi0`). While the `cooling_fan` overlay is specific to the Pi 5 and is "enabled automatically by the firmware," the provided content **does not explicitly state how the Pi 5's RP1 IO controller changes or affects the GPIO fan setup** compared to a Pi 4. It does not clarify if GPIO pins for fan control are now routed through RP1 or if the control mechanism is fundamentally different due to RP1.

### 5. Software PWM via pigpio vs hardware PWM for smooth fan speed control.

The provided content **does not contain any information** regarding `pigpio`, software PWM, or hardware PWM in the context of fan speed control on the Raspberry Pi. The `gpiozero` documentation mentions `PWMLED` which implies PWM capability, but does not specify the underlying implementation (hardware vs. software) or mention `pigpio`.

## Gaps / Follow-up

*   **`cooling_fan` overlay parameters:** The documentation for the `cooling_fan` overlay on Pi 5 is incomplete in the provided `overlays/README`. Specific `config.txt` parameters for GPIO pin selection, temperature thresholds, and PWM control (if any) are missing. Further investigation into official Raspberry Pi 5 documentation or kernel source for this overlay is needed.
*   **`gpio-fan` applicability on Pi 5:** It's unclear if the older `gpio-fan` overlay is still functional or recommended for custom fan control on the Pi 5, or if the `cooling_fan` overlay is the sole mechanism.
*   **RP1 impact on GPIO:** Detailed information on how the RP1 IO controller affects general-purpose GPIO behavior, especially for features like PWM, compared to previous Raspberry Pi models, is not available in the provided sources.
*   **PWM implementation details:** The distinction between hardware and software PWM, and the role of libraries like `pigpio` for fan control on the Pi 5, is not covered.

## Relevant Code/API Snippets

While no direct code for fan control is provided, the `gpiozero` library offers a conceptual API for PWM output:

```python
# Example from gpiozero documentation for PWMLED
from gpiozero import PWMLED
from time import sleep

# Assuming a fan connected via a MOSFET to GPIO 17,
# where the MOSFET gate is controlled by the GPIO.
# This would allow variable speed control.
fan = PWMLED(17)

# Set fan to 50% speed
fan.value = 0.5
sleep(5)

# Set fan to full speed
fan.on() # Equivalent to fan.value = 1.0
sleep(5)

# Turn fan off
fan.off() # Equivalent to fan.value = 0.0
```
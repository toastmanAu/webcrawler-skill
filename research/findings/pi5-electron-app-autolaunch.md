# Research: pi5-electron-app-autolaunch

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://www.raspberrypi.com/documentation/computers/configuration.html, https://www.electronjs.org/docs/latest/tutorial/linux-desktop-actions, https://raw.githubusercontent.com/electron/electron/main/docs/api/app.md, https://specifications.freedesktop.org/autostart-spec/latest/

---

Date: 2026-03-06

## Summary
The research focuses on auto-launching RetroArch and the FiberQuest Electron app on a Raspberry Pi 5 running Pi OS Bookworm with Wayland. The `freedesktop.org` Autostart Specification provides a standard method for autostarting applications using `.desktop` files placed in specific directories like `~/.config/autostart/`. Electron applications can be configured with desktop launcher actions using `.desktop` files, but the provided content does not explicitly confirm ARM64 AppImage support or specific dependencies for Electron on Pi OS. Information regarding launch order with delays, display compositor capabilities for side-by-side windows, or kiosk mode options (hiding taskbar, disabling screen blanking, always-on-top) was not found in the provided documentation.

## Questions to Answer

### 1. Best autostart method on Pi OS Bookworm with Wayland (autostart file vs systemd user service vs labwc autostart)
Based on the `freedesktop.org` Desktop Application Autostart Specification, the standard method for automatically starting applications during the startup of a desktop environment is by placing an application's `.desktop` file in one of the Autostart Directories. These directories include `$XDG_CONFIG_DIRS/autostart` (e.g., `/etc/xdg/autostart/` for system-wide) or `~/.config/autostart/` for user-specific autostart. If multiple `.desktop` files with the same name exist, the one in the more important directory (e.g., `~/.config/autostart/` over `/etc/xdg/autostart/`) takes precedence. The specification does not explicitly mention `systemd` user services or `labwc` specific autostart mechanisms, nor does it detail Wayland-specific considerations beyond being a general desktop environment specification.

### 2. How to launch Electron AppImage on Pi OS — ARM64 AppImage support, dependencies
The Electron documentation on "Desktop Launcher Actions" (electronjs.org/docs/latest/tutorial/linux-desktop-actions) indicates that Electron applications can be launched on Linux environments by modifying `.desktop` files. These files require `Name` and `Exec` properties, where `Exec` defines the command to be executed. This implies that if an Electron AppImage is executable on ARM64 Pi OS, it can be launched via a `.desktop` file. However, the provided content does not explicitly confirm ARM64 AppImage support for Electron or list specific dependencies required for running Electron applications on Pi OS.

### 3. Launch order: RetroArch first, then FiberQuest after N seconds delay
The provided documentation does not contain any information regarding the sequential launching of multiple applications with specific delays between them. The `freedesktop.org` Autostart Specification describes how to register applications for autostart but does not cover mechanisms for controlling the order or introducing delays between independently configured autostart entries.

### 4. Display compositor for side-by-side windows at 1024x600 — can both apps share screen cleanly?
The provided web content does not offer any details about display compositors, window management, or the ability to arrange applications side-by-side at a specific resolution (1024x600) on Pi OS Bookworm with Wayland.

### 5. Kiosk mode options — hide taskbar, disable screen blanking, keep both windows always on top
The provided web content does not contain any information regarding kiosk mode options, such as hiding the taskbar, disabling screen blanking, or keeping application windows always on top, for Pi OS Bookworm with Wayland or any other Linux desktop environment.

## Gaps / Follow-up
1.  **Pi OS Bookworm/Wayland Specific Autostart:** The `raspberrypi.com/documentation/computers/configuration.html` link was inaccessible (403 Forbidden). This documentation might have contained Pi OS-specific recommendations for autostart methods, including details on Wayland compositors like `labwc` or `systemd` user services, which are not covered by the generic `freedesktop.org` specification.
2.  **Electron AppImage ARM64 Support & Dependencies:** The provided Electron documentation does not explicitly confirm support for AppImages on ARM64 architecture or list specific runtime dependencies required for Electron applications on Pi OS. Further research is needed to verify this compatibility and identify necessary packages.
3.  **Launch Order and Delays:** A method for orchestrating the launch order of multiple applications with a specified delay (e.g., RetroArch then FiberQuest after N seconds) is not described. This would likely require a custom script or a more advanced system service configuration.
4.  **Wayland Compositor Window Management:** Information on how to configure the Wayland compositor (e.g., `labwc` or default compositor in Pi OS Bookworm) to manage two applications side-by-side at 1024x600, ensuring clean display and potentially specific window sizing/positioning, is missing.
5.  **Kiosk Mode Configuration:** Details on how to implement kiosk mode features (hide taskbar, disable screen blanking, always-on-top windows) within the Pi OS Bookworm Wayland environment are not available in the provided content.

## Relevant Code/API Snippets

**Freedesktop.org Autostart .desktop file structure (from `freedesktop.org/autostart-spec/latest/` and `electronjs.org/docs/latest/tutorial/linux-desktop-actions`):**
To autostart an application, a `.desktop` file should be placed in an autostart directory (e.g., `~/.config/autostart/`). An example for an Electron app might look like this:

```ini
[Desktop Entry]
Name=FiberQuest Electron App
Exec=/path/to/your/FiberQuest.AppImage
Type=Application
Terminal=false
Hidden=false
```

For specific actions within an Electron app, the `Actions` key can be used:
```ini
Actions=PlayPause;Next;Previous

[Desktop Action PlayPause]
Name=Play-Pause
Exec=audacious -t
OnlyShowIn=Unity;
```
(Note: The `Exec` command here would need to be adapted to communicate with the running Electron app, likely via parameters parsed by `process.argv` in the main process.)

**Electron `app` Events (from `electron/electron/main/docs/api/app.md`):**
The `app` object in Electron emits various lifecycle events. For application startup, the `ready` event is crucial:

```js
const { app } = require('electron')

app.on('ready', () => {
  // Application is ready, create windows, etc.
  console.log('Electron app is ready.')
})

// To check if ready:
if (app.isReady()) {
  // ...
}
// Or use a Promise:
app.whenReady().then(() => {
  // ...
})
```
# Research: opi3b-dual-display-dsi-hdmi

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/armbian/build/main/patch/kernel/archive/rockchip64-6.6/rk3566-dsi-hdmi-dual.patch, https://raw.githubusercontent.com/torvalds/linux/master/arch/arm64/boot/dts/rockchip/rk3566-roc-pc.dts, https://raw.githubusercontent.com/torvalds/linux/master/drivers/gpu/drm/rockchip/rockchip_vop2.c, https://forum.armbian.com/topic/30215-armbian-tv-box-rk3566/

---

## Research Note: opi3b-dual-display-dsi-hdmi

**Date:** 2026-03-08

### Summary

The Rockchip RK3566 SoC, which powers the Orange Pi 3B, is generally understood to support multiple display outputs, including DSI and HDMI, via its VOP2 display controller. However, the provided content does not contain a complete device tree configuration that explicitly enables *simultaneous* DSI and HDMI output for the Orange Pi 3B. The `rk3566-roc-pc.dts` for the Firefly Station M2 (RK3566) demonstrates HDMI output enablement, but does not explicitly configure DSI. The absence of the `rk3566-dsi-hdmi-dual.patch` prevents direct analysis of a known dual-display configuration. Mainline Linux kernels (6.x) are more likely to offer robust support for such advanced display configurations compared to older BSP 5.10 kernels.

### Questions to Answer

#### 1. Does RK3566 VOP2 support simultaneous DSI + HDMI output — same content (mirror) or independent?

Based on the general capabilities of the Rockchip RK3566 SoC and the context of the missing `rk3566-dsi-hdmi-dual.patch` (which implies such a configuration exists and is being patched for a 6.6 kernel), the RK3566 VOP2 is designed to support multiple display outputs, including DSI and HDMI, simultaneously. While the provided `rk3566-roc-pc.dts` only explicitly enables HDMI, the hardware itself is capable. The VOP2 typically supports both mirrored and independent display configurations, depending on the specific driver implementation and device tree setup. The provided content does not specify whether the RK3566 VOP2 supports mirroring or independent content for DSI + HDMI, but the hardware is capable of driving multiple displays.

#### 2. Which Video Port (VP0/VP1) should be assigned to HDMI and which to DSI on OPi3B?

The provided content does not explicitly state which Video Port (VP0/VP1) should be assigned to HDMI and which to DSI for the Orange Pi 3B or the RK3566 in general. This assignment is typically handled within the VOP2 driver (`rockchip_vop2.c`, which was not available) and configured via device tree properties that link display controllers (like HDMI, DSI) to specific VOP outputs. The `rk3566-roc-pc.dts` does not contain `vp0` or `vp1` assignments for display outputs.

#### 3. What DTS changes are needed vs the existing opi3b-waveshare5-dsi overlay we already have?

The specific DTS changes needed for the Orange Pi 3B to enable simultaneous DSI + HDMI output cannot be determined from the provided content. The `rk3566-dsi-hdmi-dual.patch` would have been the most direct source for this information, but it resulted in a 404 error. The `rk3566-roc-pc.dts` serves as a reference for a different RK3566 board (Firefly Station M2) and only explicitly enables HDMI. To enable dual display on OPi3B, one would typically need to:
1.  Ensure both the DSI and HDMI controllers are enabled (`status = "okay";`).
2.  Configure the VOP2 to drive both outputs, potentially specifying mirroring or independent modes.
3.  Define the necessary clock and power domains for both display interfaces.
4.  Potentially add `rockchip,vop-output` properties to link the display interfaces to VOP outputs.

#### 4. Does BSP kernel 5.10 support dual display or do we need Armbian mainline (6.x)?

The provided `rk3566-roc-pc.dts` is sourced from `torvalds/linux/master`, indicating it's part of the mainline Linux kernel development. The missing `rk3566-dsi-hdmi-dual.patch` was referenced for `rockchip64-6.6`, which is a mainline kernel version. This strongly suggests that robust and well-tested dual-display support for RK3566, especially for complex configurations like DSI + HDMI, is more likely to be found and actively developed in mainline kernels (6.x and newer). The provided content does not offer information to confirm whether the BSP kernel 5.10 specifically supports dual DSI + HDMI display.

#### 5. Are there working Firefly ROC-RK3566-PC dual display DTS files we can reference directly?

The provided `rk3566-roc-pc.dts` from `torvalds/linux/master` is for the Firefly Station M2 (RK3566-ROC-PC). This DTS file explicitly enables the HDMI output:

```dts
&hdmi {
	avdd-0v9-supply = <&vdda0v9_image>;
	avdd-1v8-supply = <&vcca1v8_image>;
	status = "okay";
};

&hdmi_out {
	hdmi_out_con: endpoint {
		remote-endpoint = <&hdmi_con_in>;
	};
};

&hdmi_sound {
	status = "okay";
};
```

However, this specific `rk3566-roc-pc.dts` does *not* explicitly enable a DSI interface (e.g., `&mipi_dsi0`) within the provided snippet. While the RK3566 SoC supports DSI, this particular Firefly DTS only shows HDMI being enabled. Therefore, it cannot be directly referenced as a *working dual display DTS* from the provided content. It only confirms HDMI enablement on an RK3566 board.

#### 6. What's the X11/Wayland config to assign different Chromium windows to different CRTC outputs?

The provided web content consists of kernel device tree files and forum discussions related to kernel/boot issues. It does not contain any information regarding X11 or Wayland display server configurations, nor how to assign specific application windows (like Chromium) to different CRTC outputs. This is an operating system and desktop environment configuration task, not a kernel or hardware-level device tree concern.

#### 7. Any known issues with RK3566 dual display — blank screen on one output, tearing, sync issues?

The provided content does not contain any information about known issues with RK3566 dual display, such as blank screens, tearing, or sync issues. The Armbian forum link provided discusses the RK3528 SoC and its lack of open-source support, which is not relevant to RK3566 dual display issues.

### Gaps / Follow-up

1.  **Missing `rk3566-dsi-hdmi-dual.patch` and `rockchip_vop2.c`**: These files were crucial for understanding specific DTS changes and VOP2 driver details for dual display. Their absence significantly limits the precision of answers regarding DTS modifications and VP assignments.
2.  **Orange Pi 3B Specific DTS**: The provided Firefly DTS is a reference, but a specific Armbian overlay or DTS for the Orange Pi 3B enabling DSI + HDMI simultaneously is needed for direct implementation.
3.  **Kernel Version Confirmation**: Explicit confirmation of dual-display support within the BSP 5.10 kernel for OPi3B is still needed, as the provided content points towards mainline (6.x) kernels for such features.
4.  **X11/Wayland Configuration**: Research is needed on how to configure X11 or Wayland on Armbian to manage multiple display outputs and assign applications to specific screens.
5.  **Known Issues**: Further research into community forums, bug trackers, or driver documentation for RK3566 dual display issues (e.g., blank screens, tearing, sync problems) is required.

### Relevant Code/API Snippets

From `https://raw.githubusercontent.com/torvalds/linux/master/arch/arm64/boot/dts/rockchip/rk3566-roc-pc.dts`:

```dts
&hdmi {
	avdd-0v9-supply = <&vdda0v9_image>;
	avdd-1v8-supply = <&vcca1v8_image>;
	status = "okay";
};

&hdmi_out {
	hdmi_out_con: endpoint {
		remote-endpoint = <&hdmi_con_in>;
	};
};

&hdmi_sound {
	status = "okay";
};
```

---

## ⚠️ Quality Note

Findings are thin — seeds did not return sufficient content to answer the research questions. This task has been automatically re-queued with a request for better seeds.

**Thin phrase count:** 7  
**Content length:** 7150 chars

# Research: opi3b-dual-display-dsi-hdmi-revisit

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/armbian/build/main/patch/kernel/rockchip64-current/0002-rk3566-roc-pc-add-dsi.patch, https://raw.githubusercontent.com/torvalds/linux/master/arch/arm64/boot/dts/rockchip/rk3566-firefly-roc-pc.dts, https://raw.githubusercontent.com/armbian/build/main/config/boards/orangepi3b.conf, https://raw.githubusercontent.com/torvalds/linux/master/Documentation/devicetree/bindings/display/rockchip/rockchip-vop2.yaml, https://raw.githubusercontent.com/rockchip-linux/kernel/develop-5.10/arch/arm64/boot/dts/rockchip/rk3566-orangepi-3b.dts

---

Date: 2026-03-08

## Summary

This research focuses on enabling simultaneous DSI and HDMI dual display on the Orange Pi 3B, which utilizes the Rockchip RK3566 SoC's VOP2 (Video Output Processor v2). The VOP2 acts as the display controller, transferring image data from memory to external interfaces. The provided Device Tree Schema (DTS) for VOP2 outlines its configuration properties, including multiple video output ports (VP0, VP1, VP2) and associated clocks. However, due to inaccessible source content, specific DTS examples for dual-display configurations on RK3566 boards like the Firefly ROC-RK3566-PC or Orange Pi 3B are not available, leaving a gap in understanding the precise VP assignments and kernel-level integration for dual output.

## 1. What are the core technical details of this topic?

The core technical details revolve around the Rockchip RK3566 SoC's VOP2 (Video Output Processor v2) display controller.
*   **VOP2 Functionality**: VOP2 is responsible for transferring image data from a video memory buffer to external LCD interfaces.
*   **RK3566 Compatibility**: The `rockchip,rk3566-vop` compatible string identifies the VOP2 instance specific to the RK3566 SoC.
*   **Video Ports (VPs)**: For RK3566, the VOP2 requires `port@0`, `port@1`, and `port@2` in its Device Tree definition, indicating the presence of at least three distinct video output ports (VP0, VP1, VP2). These ports are intended to connect to various display interfaces like DSI and HDMI.
*   **Clocks**: The VOP2 requires several clocks, including `aclk` (AXI bus), `hclk` (AHB bus), and dedicated pixel clocks for each video port: `dclk_vp0`, `dclk_vp1`, `dclk_vp2`.
*   **GRF (General Register Files)**: A phandle to `rockchip,grf` is required, which is used to control the polarity of DCLK/HSYNC/VSYNC signals for DPI interfaces. This suggests fine-grained control over display timing and signaling.
*   **Dual Display Goal**: The objective is to achieve simultaneous output to DSI (Display Serial Interface) and HDMI, which would involve assigning these interfaces to different VOP2 video ports and configuring them appropriately within the Device Tree.

## 2. What specific APIs, protocols, or interfaces are available?

Based on the provided `rockchip-vop2.yaml` Device Tree Schema:

*   **Device Tree (DTS) Bindings**: The primary interface for configuring the VOP2 controller is through the Linux Device Tree. The YAML schema defines the expected properties and structure for the VOP2 node.
    *   **Properties**: `compatible`, `reg` (base address and gamma LUT), `interrupts`, `clocks` (with `clock-names` like "aclk", "hclk", "dclk_vp0", "dclk_vp1", "dclk_vp2"), `power-domains`, `rockchip,grf`, and `ports` (with `port@0`, `port@1`, `port@2`).
    *   **Graph Model**: The `ports` property uses the `/schemas/graph.yaml` definition, indicating that the VOP2 output ports are part of a standard Linux kernel display pipeline graph, connecting to other display components (e.g., DSI host, HDMI PHY).
*   **Linux Kernel Clock Framework**: The `clocks` and `clock-names` properties expose the VOP2's clock requirements to the Linux kernel's Common Clock Framework, allowing the kernel to manage and enable the necessary clock signals.
*   **GRF (General Register Files) Interface**: The `rockchip,grf` phandle points to a GRF instance, which provides low-level hardware control over display-related polarities (DCLK, HSYNC, VSYNC) for DPI interfaces.

## 3. What are the known limitations or failure modes?

The provided `rockchip-vop2.yaml` is a schema, not a functional specification or bug report, so it does not explicitly list "known limitations" or "failure modes." However, certain constraints and potential challenges can be inferred:

*   **Limited Interrupts**: For RK3566-VOP, the schema specifies `interrupts: maxItems: 1` and `interrupt-names: false`. This indicates a single, shared interrupt for all VOP2 interrupt sources (e.g., frame start, line flag). This could potentially lead to more complex interrupt handling compared to newer VOP versions (e.g., RK3576, RK3588) that have independent interrupts per video port.
*   **Fixed Video Port Count**: The RK3566-VOP requires `port@0`, `port@1`, `port@2`, implying a fixed number of three video output ports. While this is sufficient for DSI + HDMI dual display (consuming two ports), it defines the hardware's maximum concurrent display outputs.
*   **DTS Configuration Complexity**: Achieving dual display requires correct assignment of DSI and HDMI interfaces to specific VOP2 video ports (VP0, VP1, VP2) and precise configuration of their respective display pipelines within the Device Tree. Misconfiguration of clock sources, GRF settings, or port connections could lead to display issues or non-functional outputs.
*   **Missing Specifics**: The schema does not detail how DSI and HDMI interfaces specifically connect to the VOP2 ports, nor does it provide information on potential conflicts or specific quirks when running both simultaneously. This information would typically be found in board-specific DTS files or driver documentation, which were not available.

## 4. Are there working examples or reference implementations?

Based *only* on the provided content:

*   **VOP2 Node Example**: The `rockchip-vop2.yaml` includes an `examples` section with a DTS snippet for a `rockchip,rk3568-vop` (which is compatible with RK3566-VOP). This snippet demonstrates how to define the VOP2 node, its registers, interrupts, clocks, power domains, GRF, and its output `ports` (vp0, vp1, vp2).
    ```dts
    vop: vop@fe040000 {
        compatible = "rockchip,rk3568-vop";
        reg = <0xfe040000 0x4000>, <0xfe044000 0x4000>;
        reg-names = "vop", "gamma-lut";
        interrupts = <GIC_SPI 109 IRQ_TYPE_LEVEL_HIGH>;
        clocks = <&cru ACLK_VOP>, <&cru HCLK_VOP>, <&cru DCLK_VOP0>, <&cru DCLK_VOP1>, <&cru DCLK_VOP2>;
        clock-names = "aclk", "hclk", "dclk_vp0", "dclk_vp1", "dclk_vp2";
        power-domains = <&power RK3568_PD_VOP>;
        rockchip,grf = <&grf>;
        iommus = <&vop_mmu>;
        vop_out: ports {
            #address-cells = <1>;
            #size-cells = <0>;
            vp0: port@0 {
                reg = <0>;
                #address-cells = <1>;
                #size-cells = <0>;
            };
            vp1: port@1 {
                reg = <1>;
                #address-cells = <1>;
                #size-cells = <0>;
            };
            vp2: port@2 {
                reg = <2>;
                #address-cells = <1>;
                #size-cells = <0>;
            };
        };
    };
    ```
    This example defines the VOP2 controller itself but *does not* show how its `vp0`, `vp1`, or `vp2` ports are connected to specific DSI or HDMI PHYs, nor does it illustrate a complete dual-display configuration.

*   **Missing Dual-Display DTS**: The research goal specifically requested "working dual-display DTS from Firefly ROC-RK3566-PC or similar RK3566 boards." All provided links that might have contained such examples (e.g., `0002-rk3566-roc-pc-add-dsi.patch`, `rk3566-firefly-roc-pc.dts`, `rk3566-orangepi-3b.dts`) resulted in `[FETCH ERROR: HTTP Error 404: Not Found]`. Therefore, **no working examples or reference implementations of dual-display DTS for RK3566 were found in the provided content.**

## Gaps / Follow-up

1.  **Specific Dual-Display DTS**: The most significant gap is the lack of actual Device Tree Source (DTS) files or patches that demonstrate a working simultaneous DSI + HDMI dual-display configuration for RK3566-based boards like the Orange Pi 3B or Firefly ROC-RK3566-PC. This includes the specific `vp` (Video Port) assignments for DSI and HDMI.
2.  **Mainline vs. BSP Kernel Support**: The provided content does not offer any insight into the differences in dual-display support between mainline Linux kernels and vendor-specific Board Support Package (BSP) kernels for RK3566.
3.  **VP Assignment Details**: While the VOP2 has three video ports, the specific recommended or required assignment of DSI and HDMI to VP0, VP1, or VP2 for optimal performance or compatibility is not detailed.
4.  **RK3566 DSI/HDMI PHY Integration**: The `rockchip-vop2.yaml` describes the VOP2 controller, but not the DSI host controller or HDMI PHY, and how they connect to the VOP2 ports. Details on their respective DTS nodes and interconnections are missing.
5.  **Known Quirks/Workarounds**: Any specific quirks, known issues, or necessary workarounds for achieving stable dual display on RK3566 (e.g., related to clocking, power management, or driver interactions) are not covered.

## Relevant Code/API Snippets

The following snippet from `rockchip-vop2.yaml` illustrates the Device Tree binding for the VOP2 controller, showing its properties and the definition of its three video output ports (VP0, VP1, VP2):

```yaml
# Example DTS snippet for VOP2 controller
vop: vop@fe040000 {
    compatible = "rockchip,rk3568-vop"; # Compatible with rk3566-vop
    reg = <0xfe040000 0x4000>, <0xfe044000 0x4000>;
    reg-names = "vop", "gamma-lut";
    interrupts = <GIC_SPI 109 IRQ_TYPE_LEVEL_HIGH>;
    clocks = <&cru ACLK_VOP>, <&cru HCLK_VOP>, <&cru DCLK_VOP0>, <&cru DCLK_VOP1>, <&cru DCLK_VOP2>;
    clock-names = "aclk", "hclk", "dclk_vp0", "dclk_vp1", "dclk_vp2";
    power-domains = <&power RK3568_PD_VOP>;
    rockchip,grf = <&grf>;
    iommus = <&vop_mmu>;
    vop_out: ports {
        #address-cells = <1>;
        #size-cells = <0>;
        vp0: port@0 {
            reg = <0>;
            #address-cells = <1>;
            #size-cells = <0>;
        };
        vp1: port@1 {
            reg = <1>;
            #address-cells = <1>;
            #size-cells = <0>;
        };
        vp2: port@2 {
            reg = <2>;
            #address-cells = <1>;
            #size-cells = <0>;
        };
    };
};
```
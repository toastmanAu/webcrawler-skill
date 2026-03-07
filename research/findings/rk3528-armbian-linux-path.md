# Research: rk3528-armbian-linux-path

**Date:** 2026-03-07  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://forum.armbian.com/topic/30215-ambian-tv-box-rk3528/, https://raw.githubusercontent.com/ilyakurdyukov/rk3528-tvbox/main/README.md, https://raw.githubusercontent.com/ophub/amlogic-s9xxx-armbian/main/README.md, https://raw.githubusercontent.com/friendlyarm/sd-fuse_rk3528/master/README.md

---

Date: 2026-03-07

## Summary
Armbian support for RK3528 TV boxes is currently community-driven and experimental, with no official Armbian images available as of late 2023. Projects like `ilyakurdyukov/rk3528-tvbox` and FriendlyElec's `sd-fuse_rk3528` provide methods to build and flash Armbian (or Ubuntu/Debian) images for devices like the Vontar DQ08 and H96 Max M1. While USB 3.0 works after booting Linux, the H96 Max M1 is specifically not recommended due to a lack of essential ports and the risk of bricking when flashing U-Boot to its eMMC without an SD card slot for recovery. HDMI video output is generally functional but can be intermittent.

## Questions to Answer

1.  **What is the current state of Armbian support for RK3528 TV boxes — official, community, or experimental only?**
    As of September 2023, there was "no open source support for rk3528" from Armbian, and efforts were in "very early stages" and "not really useable" according to forum discussions [forum.armbian.com]. However, community projects like `ilyakurdyukov/rk3528-tvbox` demonstrate working (though with known issues) Armbian builds for specific RK3528 TV boxes (Vontar DQ08, H96 Max M1), indicating experimental and community-driven support. FriendlyElec also provides `sd-fuse` tools for their RK3528 boards, supporting Debian/Ubuntu images [friendlyarm/sd-fuse_rk3528]. The `ophub/amlogic-s9xxx-armbian` project, which supports various Amlogic/Rockchip/Allwinner boxes, does not list RK3528 in its "Supported Devices" table [ophub/amlogic-s9xxx-armbian].

2.  **Which specific RK3528 TV box builds are confirmed booting with working ethernet and USB 3.0?**
    The `ilyakurdyukov/rk3528-tvbox` project confirms booting on **Vontar DQ08** and **H96 Max M1** [ilyakurdyukov/rk3528-tvbox].
    *   **Ethernet**: The provided content does not explicitly state whether ethernet is working or broken for these builds. Wi-Fi has a driver but requires firmware from Android and has not been tried [ilyakurdyukov/rk3528-tvbox].
    *   **USB 3.0**: USB 3.x devices "will work with Linux after booting." However, U-Boot only detects USB 1.1/2.0 devices, meaning USB 3.x flash drives cannot be used for booting [ilyakurdyukov/rk3528-tvbox].

3.  **What is the flash procedure — SD card only, or can we flash to eMMC? Is maskrom mode needed?**
    Both SD card booting and flashing to eMMC are possible:
    *   **SD Card Boot**: Images can be built using `friendlyarm/sd-fuse_rk3528`'s `mk-sd-image.sh` and then flashed to an SD card using `fusing.sh` [friendlyarm/sd-fuse_rk3528].
    *   **eMMC Flash**:
        *   The `friendlyarm/sd-fuse_rk3528` project provides `mk-emmc-image.sh` to "Build SD-to-eMMC image, used to install system to eMMC" [friendlyarm/sd-fuse_rk3528].
        *   The `ilyakurdyukov/rk3528-tvbox` project describes updating U-Boot in eMMC using `rkflashtool` after extracting `uboot.img` from an Armbian image [ilyakurdyukov/rk3528-tvbox].
    *   **Maskrom Mode**: The provided content does not explicitly state that maskrom mode is needed. While `rkflashtool` is used for low-level flashing to eMMC, the method to enter maskrom mode is not described.

4.  **Are there any known issues with the H96 Max specifically vs other RK3528 boxes (Vontar DQ08 etc)?**
    Yes, the H96 Max M1 has specific issues:
    *   It is "not recommended due to lack of essential ports" [ilyakurdyukov/rk3528-tvbox].
    *   "Rewriting U-Boot in EMMC on H96MAX M1 is dangerous - this TV box does not have an SD card slot, so you may break it with an incompatible U-Boot image" [ilyakurdyukov/rk3528-tvbox]. This implies a higher risk of bricking compared to devices with an SD card slot for recovery.

5.  **What kernel version is used and does it support USB 3.0 for external SSD (critical for CKB chain data)?**
    The `friendlyarm/sd-fuse_rk3528` project supports kernel version **6.1.y** [friendlyarm/sd-fuse_rk3528].
    USB 3.0 for external SSDs is supported: "USB 3.x devices will work with Linux after booting" [ilyakurdyukov/rk3528-tvbox]. This confirms that once Linux is running, USB 3.0 functionality should be available for data storage.

6.  **Is HDMI output working for desktop/framebuffer display from Armbian?**
    HDMI video output is generally working, indicated by "HDMI-video: ok" [ilyakurdyukov/rk3528-tvbox]. However, there is a known intermittent issue: "No signal on HDMI. This only happens to me sometimes. I can access Armbian via SSH, but I don't know how to get it to use HDMI. This seems to happen when the HDMI connection is not detected during boot" [ilyakurdyukov/rk3528-tvbox]. A previous issue with "No video with CONFIG_DRM_IGNORE_IOTCL_PERMIT" has been fixed [ilyakurdyukov/rk3528-tvbox].

7.  **What's the recommended partition layout for OS on eMMC + chain data on external USB SSD?**
    The provided content does not explicitly recommend a specific partition layout for OS on eMMC combined with chain data on an external USB SSD. It mentions the ability to create a root filesystem image and that disabling OverlayFS can benefit Docker performance and swap convenience [friendlyarm/sd-fuse_rk3528], but no detailed layout for this specific use case.

## Gaps / Follow-up

*   **Ethernet Reliability**: The provided content does not explicitly confirm the working status or reliability of the ethernet port for RK3528 TV boxes under Armbian. This is critical for node use.
*   **Maskrom Mode Entry**: While `rkflashtool` is mentioned for flashing U-Boot, the specific steps or hardware requirements to enter maskrom mode (if needed) are not detailed.
*   **H96 Max "Lack of Essential Ports"**: The exact nature of the "lack of essential ports" on the H96 Max M1 is not specified beyond the absence of an SD card slot.
*   **Wi-Fi Firmware Acquisition**: The process for taking Wi-Fi firmware from Android is mentioned but not detailed.
*   **USB 3.0 Stability for Heavy I/O**: While USB 3.0 works after boot, its stability and performance under sustained heavy I/O (e.g., for CKB chain data) are not discussed.
*   **Partition Layout Best Practices**: Specific recommendations for partitioning an eMMC for the OS and an external USB SSD for CKB chain data (e.g., filesystem types, mount points, swap configuration) are not provided.

## Relevant Code/API Snippets

*   **Building Armbian for RK3528 TV-box (ilyakurdyukov/rk3528-tvbox):**
    ```bash
    $ git clone --depth=1 https://github.com/armbian/build armbian-build
    $ cp -R armbian-patch/* armbian-build/
    $ cd armbian-build
    $ ./compile.sh build BOARD=rk3528-tvbox BRANCH=legacy BUILD_DESKTOP=yes BUILD_MINIMAL=no DESKTOP_APPGROUPS_SELECTED= DESKTOP_ENVIRONMENT=mate DESKTOP_ENVIRONMENT_CONFIG_NAME=config_base EXPERT=yes KERNEL_CONFIGURE=no KERNEL_GIT=shallow RELEASE=jammy
    ```

*   **Extracting and Flashing U-Boot (ilyakurdyukov/rk3528-tvbox):**
    ```bash
    $ dd if=Armbian.img bs=1M count=4 skip=8 > uboot.img
    $ rkflashtool w 0x4000 0x2000 < uboot.img
    ```

*   **Building SD Card Image (friendlyarm/sd-fuse_rk3528):**
    ```bash
    # Example for debian-trixie-core-arm64
    ./mk-sd-image.sh debian-trixie-core-arm64
    # Resulting file: out/rk3528-sd-debian-trixie-core-6.1-arm64-YYYYMMDD.img
    ```

*   **Flashing to SD Card (friendlyarm/sd-fuse_rk3528):**
    ```bash
    sudo ./fusing.sh /dev/sdX debian-trixie-core-arm64
    ```

*   **Building SD-to-eMMC Image (friendlyarm/sd-fuse_rk3528):**
    ```bash
    # Example for debian-trixie-core-arm64
    ./mk-emmc-image.sh debian-trixie-core-arm64 autostart=yes
    # Resulting file: out/rk3528-eflasher-debian-trixie-core-6.1-arm64-YYYYMMDD.img
    ```
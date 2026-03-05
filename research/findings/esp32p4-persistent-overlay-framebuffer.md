# Research: esp32p4-persistent-overlay-framebuffer

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/ppa.html, https://docs.espressif.com/projects/esp-lvgl-port/en/latest/esp32p4/index.html, https://docs.lvgl.io/master/details/integration/chip/espressif.html, https://raw.githubusercontent.com/espressif/esp-idf/master/examples/peripherals/ppa/ppa_blend/main/ppa_blend_example_main.c, https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/lcd/index.html

---

Date: 2026-03-05

## Summary

The ESP32-P4's Pixel-Processing Accelerator (PPA) provides hardware-level acceleration for image algorithms, including blending, which is ideal for compositing an overlay onto an emulator's framebuffer. This allows for a second layer, such as a GUI rendered by LVGL, to be blended with the emulator's output in real-time using hardware alpha blending. While the exact CPU cost of PPA operations is not detailed in the provided documentation, its nature as a hardware accelerator implies a significant reduction in CPU load compared to software-based blending. The overlay can update independently of the emulator's frame rate, and touch-interactive elements are supported through integration with the `esp_lcd` driver and libraries like LVGL.

## Questions to Answer

### Can a second layer/surface be composited over the emulator framebuffer in real time?

Yes, a second layer/surface can be composited over the emulator framebuffer in real time on the ESP32-P4. The Pixel-Processing Accelerator (PPA) module is specifically designed for "hardware-level acceleration of image algorithms, such as image rotation, scaling, mirroring, and blending" (PPA Introduction). The `ppa_do_blend()` function allows for blending two "pictures" (framebuffers) – a foreground (FG) and a background (BG) – using a standard Alpha Blending formula. This means the emulator's output can serve as the background, and the overlay content as the foreground, with the PPA handling the real-time compositing.

### Options: direct framebuffer write, hardware alpha blending (P4 has a 2D GPU / PPA), LVGL overlay on top of emulator output, or DMA-driven second layer.

1.  **Direct framebuffer write**: This is possible using `esp_lcd_panel_draw_bitmap()` or `esp_lcd_panel_draw_bitmap_2d()` from the `esp_lcd` component. However, this method would overwrite the emulator's framebuffer content in the target display region, rather than compositing an overlay.
2.  **Hardware alpha blending (P4 has a 2D GPU / PPA)**: This is the most suitable and explicitly supported option. The PPA module provides hardware acceleration for blending operations via `ppa_do_blend()`. It supports alpha blending with a configurable foreground and background, including color-keying (`bg_ck_en`, `fg_ck_en`). This offloads the intensive pixel manipulation from the CPU.
3.  **LVGL overlay on top of emulator output**: This is a viable approach when combined with the PPA's blending capabilities. LVGL can be used to render the overlay (e.g., UI elements, text, buttons) into a dedicated framebuffer. This LVGL-rendered buffer would then be passed as the "foreground" picture to the PPA's `ppa_do_blend()` function, with the emulator's output as the "background." The `esp_lcd` component's examples (`peripherals/lcd/spi_lcd_touch`, `peripherals/lcd/rgb_panel`, `peripherals/lcd/mipi_dsi`) demonstrate LVGL integration with various display types, including MIPI DSI which is relevant for ESP32-P4.
4.  **DMA-driven second layer**: The provided documentation does not describe a distinct "DMA-driven second layer" hardware feature for compositing. However, the PPA's hardware acceleration for blending operations inherently utilizes efficient memory access, likely involving DMA, to process and transfer pixel data between buffers and to the display controller. The PPA itself serves as the hardware accelerator for creating the composite layer.

### What is the CPU cost?

The PPA documentation mentions a "Performance Overview" section which "Covers the performance of PPA operations." However, the content of this section is not provided in the source material. Therefore, the specific CPU cost (e.g., in cycles or milliseconds) of PPA operations cannot be determined from the given information. As a hardware accelerator, the PPA's primary purpose is to offload these tasks from the CPU, implying a significantly lower CPU cost compared to performing blending in software.

### Can the overlay update independently of the emulator frame rate?

Yes, the overlay can update independently of the emulator frame rate. PPA operations are requested as "transactions" via functions like `ppa_do_blend()`. The PPA driver supports event callbacks (`ppa_client_register_event_callbacks()`) for transaction completion, especially when operating in `PPA_TRANS_MODE_NON_BLOCKING`. This asynchronous nature allows the CPU to prepare the overlay content (e.g., using LVGL) into a separate buffer at its own pace. Once the overlay buffer is ready, a PPA blend operation can be initiated. The PPA will then blend this new overlay with the current emulator frame, and the resulting composite frame can be sent to the LCD. This decoupling allows the overlay to update only when its content changes, without being tied to every emulator frame.

### Can it contain touch-interactive buttons?

Yes, the overlay can contain touch-interactive buttons. The `esp_lcd` documentation's "Application Example" section explicitly mentions `peripherals/lcd/spi_lcd_touch`, which "demonstrates how to drive the LCD and touch panel on the same SPI bus, and display a simple GUI using the LVGL library." This confirms that touch panel input can be integrated with the `esp_lcd` framework and utilized by a GUI library like LVGL to create interactive elements such as buttons within the overlay.

## Gaps / Follow-up

1.  **PPA Performance Metrics**: The "Performance Overview" section of the PPA documentation was mentioned but its content was not provided. Specific CPU utilization, latency, and throughput figures for PPA blend operations are needed to fully assess the impact on the ESP32-P4's CPU headroom, especially for the FiberQuest stretch goal of running an emulator, light client, and signer concurrently.
2.  **LVGL-P4 Specifics**: The direct LVGL documentation links for ESP32-P4 resulted in 404 errors. While `esp_lcd` examples confirm LVGL support, more detailed information on LVGL's integration with P4-specific features (like MIPI DSI and PPA) would be beneficial for optimal implementation.
3.  **Framebuffer Management**: Details on how the emulator's framebuffer is exposed and how it can be efficiently passed to the PPA as a background "picture" are not explicitly covered. This would involve understanding memory allocation, buffer alignment requirements (mentioned in PPA docs), and synchronization between the emulator and the PPA.
4.  **DMA-driven Layer Details**: While PPA operations likely use DMA, the concept of a "DMA-driven second layer" as a distinct, independent hardware feature for compositing (beyond PPA) was not detailed. Further research into the ESP32-P4's display controller or other peripherals might reveal additional hardware layering capabilities if they exist.

## Relevant Code/API Snippets

*   **PPA Client Registration**:
    ```c
    ppa_client_config_t client_config = {
        .oper_type = PPA_OPER_TYPE_BLEND, // Or PPA_OPER_TYPE_SRM, PPA_OPER_TYPE_FILL
        .max_pending_trans_num = 1, // Or more, depending on concurrency
    };
    ppa_client_handle_t ppa_blend_client;
    ppa_register_client(&client_config, &ppa_blend_client);
    ```
    (From PPA Functional Overview: Register PPA Client)

*   **PPA Blend Operation**:
    ```c
    ppa_blend_oper_config_t blend_config = {
        .fg_pic_blk_config = {
            .buffer = fg_buffer, // Overlay framebuffer
            .pic_w = fg_width,
            .pic_h = fg_height,
            .block_offset_x = 0,
            .block_offset_y = 0,
            .block_w = fg_width,
            .block_h = fg_height,
            .color_mode = PPA_BLEND_COLOR_MODE_ARGB8888, // Example color mode
        },
        .bg_pic_blk_config = {
            .buffer = bg_buffer, // Emulator framebuffer
            .pic_w = bg_width,
            .pic_h = bg_height,
            .block_offset_x = 0,
            .block_offset_y = 0,
            .block_w = bg_width,
            .block_h = bg_height,
            .color_mode = PPA_BLEND_COLOR_MODE_RGB565, // Example color mode
        },
        .out_pic_blk_config = {
            .buffer = out_buffer, // Output composite framebuffer
            .pic_w = out_width,
            .pic_h = out_height,
            .block_offset_x = 0,
            .block_offset_y = 0,
            .block_w = out_width,
            .block_h = out_height,
            .color_mode = PPA_BLEND_COLOR_MODE_RGB565, // Example color mode
        },
        .fg_alpha = 255, // Full alpha for FG, or less for transparency
        .bg_ck_en = false, // Chroma-key disabled
        .fg_ck_en = false, // Chroma-key disabled
        // ... other blend parameters
    };
    ppa_do_blend(ppa_blend_client, &blend_config, PPA_TRANS_MODE_NON_BLOCKING, user_context);
    ```
    (From PPA Perform PPA Operations: Blend)

*   **PPA Event Callbacks (for asynchronous operations)**:
    ```c
    bool ppa_blend_event_callback(ppa_client_handle_t client, ppa_event_data_t *edata, void *user_ctx) {
        // Handle blend completion
        // ...
        return true;
    }
    ppa_client_register_event_callbacks(ppa_blend_client, &callbacks, NULL);
    ```
    (From PPA Functional Overview: Register PPA Event Callbacks)

*   **Flushing to LCD**:
    ```c
    esp_lcd_panel_handle_t panel_handle;
    // ... initialize panel_handle
    esp_lcd_panel_draw_bitmap(panel_handle, x_start, y_start, x_end, y_end, out_buffer);
    ```
    (From LCD Data Panel Operations)
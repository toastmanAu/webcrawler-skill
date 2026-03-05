# Research: esp32p4-touch-overlay-input-routing

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/lcd/index.html, https://docs.espressif.com/projects/esp-lvgl-port/en/latest/esp32p4/index.html, https://raw.githubusercontent.com/espressif/esp-bsp/master/components/esp_lvgl_port/src/lvgl9/esp_lvgl_port_touch.c, https://docs.lvgl.io/master/details/main-components/indev.html

---

Date: 2026-03-05

## Summary

When an overlay UI is active on ESP32-P4, touch input events are primarily routed through the LVGL input device (`lv_indev_t`), which utilizes the `esp_lcd_touch` API to read physical touch data. This allows the overlay to intercept and process touch events. To cleanly route input back to an emulator when the overlay is dismissed, the LVGL touch input device can be dynamically removed or deactivated using `lvgl_port_remove_touch`. The underlying `esp_lcd_touch` driver would then need to be reconfigured or its data redirected to the emulator's input processing logic. The provided content indicates that SPI is a common interface for touch panels, and a generic `esp_lcd_touch` API is available, but specific touch controller ICs are not named.

## Questions to Answer

### How do touch input events get routed — to the overlay UI vs. the emulator controller input?

Based on the provided content, touch input events are routed to the overlay UI via the LVGL library's input device abstraction. The `esp_lvgl_port_touch.c` source demonstrates how LVGL integrates with the `esp_lcd_touch` component.

1.  **Overlay UI (LVGL):** When an LVGL-based overlay UI is active, an `lv_indev_t` (LVGL input device) is created and configured to read from the underlying touch controller. The `lvgl_port_add_touch` function initializes this process, registering `lvgl_port_touchpad_read` as the callback to read touch data. This callback uses `esp_lcd_touch_read_data` and `esp_lcd_touch_get_data` to acquire touch points and then passes them to LVGL. If an interrupt GPIO is configured for the touch controller, `lvgl_port_touch_interrupt_callback` is registered to wake the LVGL task, indicating an event-driven input model. This means LVGL actively consumes touch events when its input device is enabled.
2.  **Emulator Controller Input:** The provided content does not detail how the emulator receives controller input, specifically touch input. Therefore, it is not possible to describe its specific routing mechanism from the given sources. It is a gap in the information.

In a typical scenario, when an LVGL overlay is active, its input device would consume touch events, preventing them from propagating to any underlying application (like an emulator) that might also be listening for touch input.

### Can touch be intercepted cleanly when overlay is visible, then returned to emulator when dismissed?

Yes, based on the LVGL integration, touch can be intercepted cleanly by the overlay UI and then potentially returned to the emulator, though the exact mechanism for "returning" to the emulator is not fully detailed due to missing information about the emulator's input handling.

1.  **Intercepting by Overlay:** When the overlay UI is visible, the `lv_indev_t` created by `lvgl_port_add_touch` would be active. The `lvgl_port_touchpad_read` function would continuously (or on interrupt) read touch data from the `esp_lcd_touch` driver and feed it to LVGL. This effectively "intercepts" the touch input for the UI.
2.  **Returning to Emulator:** When the overlay is dismissed, the `lvgl_port_remove_touch` function can be called to delete the LVGL input device and unregister its interrupt callback. This would stop LVGL from processing touch events. At this point, the raw touch data from the `esp_lcd_touch` driver would become available for another component. To "return" this to the emulator, the emulator's input system would need to:
    *   Have its own mechanism to register with or poll the `esp_lcd_touch` API.
    *   Be activated or re-enabled to receive touch data once the LVGL input device is removed.

The challenge lies in the emulator's specific implementation for touch input. If the emulator directly uses `esp_lcd_touch` or a similar low-level driver, then switching between LVGL and the emulator would involve managing which component has ownership or receives callbacks from the `esp_lcd_touch` driver.

### What touch controller ICs are common on P4 dev boards and what drivers are available?

The provided content does not explicitly name specific touch controller ICs (e.g., FT6336, GT911) that are common on ESP32-P4 dev boards.

However, the documentation indicates:
*   The `esp_lcd_touch` API is available for interacting with touch panels. This API provides functions like `esp_lcd_touch_read_data` and `esp_lcd_touch_get_data` for reading touch points.
*   The `peripherals/lcd/spi_lcd_touch` example "demonstrates how to drive the LCD and touch panel on the same SPI bus." This suggests that **SPI-interfaced touch controllers** are common and supported.
*   The `esp_lcd` component provides an abstracted driver framework for various LCD types, and while it mentions "limited number of LCD device controller drivers out of the box (e.g., ST7789)", this refers to LCD display controllers, not touch controllers. It also states "More drivers are available in the ESP Component Registry," which might include touch drivers, but specific ICs are not listed in the provided text.

Therefore, while the `esp_lcd_touch` API is the generic interface for touch input, and SPI is a common bus for these controllers, specific IC names are not provided.

## Gaps / Follow-up

1.  **Emulator Input Mechanism:** The most significant gap is the lack of information regarding how the RetroArch emulator on ESP32-P4 handles controller input, specifically touch. Understanding if it uses `esp_lcd_touch` directly, a different driver, or only physical buttons is crucial for a complete input routing solution.
2.  **Specific Touch Controller ICs:** While the `esp_lcd_touch` API is generic, knowing the specific touch controller ICs (e.g., FT6336, GT911, etc.) commonly found on ESP32-P4 dev boards would allow for more targeted driver integration and configuration.
3.  **Missing LVGL Documentation:** The links to `https://docs.espressif.com/projects/esp-lvgl-port/en/latest/esp32p4/index.html` and `https://docs.lvgl.io/master/details/main-components/indev.html` resulted in `HTTP Error 404: Not Found`. These documents might contain further details on LVGL's input device management and ESP-IDF's LVGL port specifics, which could offer more insights into input routing and configuration.
4.  **`esp_lcd_touch` Driver Details:** Further details on the `esp_lcd_touch` component itself, including how to register/unregister multiple consumers or dynamically switch its output, would be beneficial.

## Relevant Code/API Snippets

From `https://raw.githubusercontent.com/espressif/esp-bsp/master/components/esp_lvgl_port/src/lvgl9/esp_lvgl_port_touch.c`:

**Adding an LVGL touch input device:**
```c
lv_indev_t *lvgl_port_add_touch(const lvgl_port_touch_cfg_t *touch_cfg) {
    // ...
    touch_ctx->handle = touch_cfg->handle; // esp_lcd_touch_handle_t
    // ...
    if (touch_ctx->handle->config.int_gpio_num != GPIO_NUM_NC) {
        ret = esp_lcd_touch_register_interrupt_callback_with_data(touch_ctx->handle, lvgl_port_touch_interrupt_callback, touch_ctx);
    }
    // ...
    indev = lv_indev_create();
    lv_indev_set_type(indev, LV_INDEV_TYPE_POINTER);
    if (touch_ctx->handle->config.int_gpio_num != GPIO_NUM_NC) {
        lv_indev_set_mode(indev, LV_INDEV_MODE_EVENT);
    }
    lv_indev_set_read_cb(indev, lvgl_port_touchpad_read);
    lv_indev_set_disp(indev, touch_cfg->disp);
    lv_indev_set_driver_data(indev, touch_ctx);
    touch_ctx->indev = indev;
    // ...
    return indev;
}
```

**Removing an LVGL touch input device:**
```c
esp_err_t lvgl_port_remove_touch(lv_indev_t *touch) {
    // ...
    lv_indev_delete(touch);
    // ...
    if (touch_ctx->handle->config.int_gpio_num != GPIO_NUM_NC) {
        esp_lcd_touch_register_interrupt_callback(touch_ctx->handle, NULL); // Unregister callback
    }
    // ...
    free(touch_ctx);
    return ESP_OK;
}
```

**LVGL touchpad read callback (reads from `esp_lcd_touch`):**
```c
static void lvgl_port_touchpad_read(lv_indev_t *indev_drv, lv_indev_data_t *data) {
    // ...
    esp_lcd_touch_point_data_t touch_data[CONFIG_ESP_LCD_TOUCH_MAX_POINTS] = {0};
    ESP_ERROR_CHECK(esp_lcd_touch_read_data(touch_ctx->handle));
    ESP_ERROR_CHECK(esp_lcd_touch_get_data(touch_ctx->handle, touch_data, &touch_cnt, CONFIG_ESP_LCD_TOUCH_MAX_POINTS));

    if (touch_cnt > 0) {
        data->point.x = touch_ctx->scale.x * touch_data[0].x;
        data->point.y = touch_ctx->scale.y * touch_data[0].y;
        data->state = LV_INDEV_STATE_PRESSED;
    } else {
        data->state = LV_INDEV_STATE_RELEASED;
    }
}
```

**Touch interrupt callback (wakes LVGL task):**
```c
static void IRAM_ATTR lvgl_port_touch_interrupt_callback(esp_lcd_touch_handle_t tp) {
    lvgl_port_touch_ctx_t *touch_ctx = (lvgl_port_touch_ctx_t *) tp->config.user_data;
    lvgl_port_task_wake(LVGL_PORT_EVENT_TOUCH, touch_ctx->indev);
}
```
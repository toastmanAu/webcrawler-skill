# USB CDC-NCM Composite on ESP32-S3

## Summary
The ESP32-S3 Arduino core (3.x) has TinyUSB's CDC-NCM class compiled in (`CFG_TUD_NCM=1`). This allows the board to present as a USB ethernet adapter alongside HID keyboard — full composite USB device.

## Key Findings

### TinyUSB NCM Support
- `CFG_TUD_NCM=1` confirmed in `sdkconfig.h` for ESP32-S3
- Descriptor macro: `TUD_CDC_NCM_DESCRIPTOR()` in `usbd.h`
- Weak callbacks in `esp32-hal-tinyusb.c`: `tud_network_recv_cb`, `tud_network_xmit_cb`, `tud_network_init_cb`
- Override these in sketch to handle ethernet frames

### Arduino Interface Registration
- `tinyusb_enable_interface()` in `esp32-hal-tinyusb.h`
- `USB_INTERFACE_CUSTOM` slot available for custom descriptors
- Pattern: provide `descriptor_cb_t` that writes NCM descriptor bytes and increments interface count by 2

### lwIP Integration
- Full lwIP stack available as ESP-IDF component
- `netif_add()` creates virtual ethernet interface
- `ncm_netif_init()` hooks `etharp_output` + custom `linkoutput`
- `tud_network_recv_cb` → `pbuf_alloc` + `netif.input()` 
- `netif.linkoutput` → `tud_network_xmit()`

### DHCP Server
- ~60 lines of UDP code (no library needed)
- Parses DHCP DISCOVER/REQUEST, responds with OFFER/ACK
- Assigns host 192.168.7.1, board is 192.168.7.2
- Lease time, subnet, router, DNS all included

### Endpoint Assignment
- NCM needs: interrupt IN (notification) + bulk IN + bulk OUT
- Must not conflict with HID endpoints (HID uses EP 0x84/0x04 typically)
- Safe assignment: NOTIF=0x82, EP_OUT=0x03, EP_IN=0x83

### HTTP Client Over lwIP
- Raw `tcp_pcb` API — `tcp_connect`, `tcp_write`, `tcp_output`, `tcp_recv`
- Spin loop polling `sys_check_timeouts()` + `delay(1)` until response
- Works without FreeRTOS tasks — fits in Arduino `loop()`

## Gotchas
- `tinyusb_interface_t` enum doesn't include NCM — use `USB_INTERFACE_CDC` slot or `USB_INTERFACE_CUSTOM`
- lwIP `ip_addr_t` in ESP-IDF is `ip_addr` union (IPv4+IPv6) — use `IP_ADDR4()` macro not `IP4_ADDR()`
- `String` type unavailable in C headers — keep `usb_ncm.h` C-compatible with `#ifdef __cplusplus` guard
- `tud_connected()` checks USB link state — use instead of checking NCM-specific state

## Implementation
See `firmware/usb_ncm.cpp` and `firmware/usb_ncm.h` in WyTerminal repo.
https://github.com/toastmanAu/WyTerminal

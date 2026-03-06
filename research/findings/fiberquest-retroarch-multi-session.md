# Research: fiberquest-retroarch-multi-session

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://retropie.org.uk/docs/RetroArch-Network-Commands/, https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay_frontend.c, https://raw.githubusercontent.com/libretro/RetroArch/master/README.md, https://retropie.org.uk/docs/Netplay/, https://raw.githubusercontent.com/libretro/RetroArch/master/config.def.h

---

Date: 2026-03-06

## Summary

This research investigates the feasibility and configuration of running multiple RetroArch instances for multi-player tournament monitoring within the FiberQuest project. While RetroArch is confirmed to run on Raspberry Pi and supports configuration files, the specific details for configuring distinct UDP command ports for multiple instances are not explicitly available in the provided content due to inaccessible documentation. Netplay in RetroArch appears to support synchronized game states, and remote monitoring via UDP is conceptually possible. However, the maximum number of instances a Pi5 can handle is not specified, and the simplest simulation involves launching multiple RetroArch processes with separate configurations.

## Questions to Answer

### (1) Can you run multiple RetroArch instances on the same machine with different UDP ports (e.g. 55355, 55356, 55357)?

The FiberQuest project ground truth states that RetroArch uses "UDP RAM polling (READ_CORE_MEMORY, port 55355)". This confirms that RetroArch has the capability to utilize a specific UDP port for external commands/polling.

The provided content does not explicitly detail how to configure different UDP command ports for multiple RetroArch instances. The `config.def.h` file contains `DEFAULT_NETPLAY_PORT` and `RARCH_DISCOVERY_PORT`, which are related to netplay and discovery, not the general "network command port" for external polling. The `https://retropie.org.uk/docs/RetroArch-Network-Commands/` documentation, which would likely contain this information, was inaccessible ("Verifying...").

Therefore, while RetroArch can use a UDP port for polling, the method to configure *different* ports for *multiple* instances on the same machine is not explicitly described in the provided materials.

### (2) How do you configure separate retroarch.cfg files per instance with different network command ports?

The `README.md` states that RetroArch uses configuration files: "The default configuration is defined in `config.def.h`... These can later be tweaked by using a config file. A sample configuration file is installed to `/etc/retroarch.cfg`. RetroArch will on startup create a config file in `$XDG\_CONFIG\_HOME/retroarch/retroarch.cfg` if it does not exist." This confirms that RetroArch instances can be configured via `retroarch.cfg` files.

To configure separate `retroarch.cfg` files per instance, one would typically launch RetroArch with a command-line argument specifying the path to a unique configuration file for each instance. The `README.md` mentions a "full-featured command-line interface," which would support this.

However, the specific configuration option within `retroarch.cfg` for the "network command port" (e.g., for `READ_CORE_MEMORY` polling, as mentioned in FiberQuest) is not explicitly provided in the available content. The `config.def.h` file does not list a clear default for such a command port, and the `RetroArch-Network-Commands` documentation was inaccessible.

### (3) For LAN tournament play — can multiple Pi5s each run one RetroArch instance and the agent monitors all of them remotely via UDP?

Yes, this is conceptually feasible based on the provided information. The FiberQuest project ground truth states: "RetroArch (emulator) → UDP RAM polling (READ_CORE_MEMORY, port 55355) → Node.js sidecar → Fiber micropayments". This indicates that RetroArch instances are capable of sending UDP data.

UDP is a network protocol, meaning data can be sent across a Local Area Network (LAN). If multiple Pi5s each run a RetroArch instance configured to send UDP RAM polling data, a central Node.js agent (sidecar) could be designed to listen for and monitor these UDP streams from different source IP addresses or ports. The `netplay_frontend.c` file demonstrates RetroArch's use of `sendto` and `recvfrom` for UDP communication, further supporting its network capabilities.

The provided content does not describe the specific implementation details or capabilities of the Node.js agent, but RetroArch's ability to send UDP data over a network makes remote monitoring by an agent possible.

### (4) RetroArch netplay — does it allow synchronized game state across multiple clients? If so, can you poll RAM from the netplay host?

Yes, RetroArch netplay appears to allow synchronized game state across multiple clients. The `netplay_frontend.c` source code includes functions like `netplay_build_savestate` and `netplay_process_savestate`, and defines `NETPLAYSTATE_MEM_BLOCK`, which strongly indicates that game state, including memory, is captured and processed for synchronization during netplay.

Regarding polling RAM from the netplay host, the FiberQuest project ground truth confirms that RetroArch supports "UDP RAM polling (READ_CORE_MEMORY, port 55355)". A netplay host is a RetroArch instance. Therefore, it is a reasonable inference that a RetroArch instance acting as a netplay host would still expose its RAM for polling via this network command interface, assuming the command interface is active and configured. The provided content does not explicitly state "RAM polling from netplay host is supported," but it does not contradict it either, and the underlying RetroArch capability exists.

### (5) What's the maximum number of simultaneous instances that a Pi5 can handle?

The provided content does not contain any performance benchmarks, CPU specifications, RAM details, or other hardware metrics for the Pi5 that would allow determining the maximum number of simultaneous RetroArch instances it can handle. The Pi5 is listed as part of "Our Infrastructure" but without performance characteristics relevant to this question.

### (6) For the demo: what's the simplest way to simulate 2-player tournament on a single Pi5?

Based on the available information, the simplest way to simulate a 2-player tournament on a single Pi5 would be to:

1.  **Run two separate RetroArch instances** concurrently on the Pi5.
2.  **Configure each instance with its own `retroarch.cfg` file**, specifying distinct settings such as display output (e.g., windowed mode with different window positions) and, crucially, different UDP command ports for the FiberQuest Node.js sidecar to poll (e.g., 55355 and 55356).
3.  **Launch each instance using RetroArch's command-line interface**, pointing to its respective configuration file.

This approach leverages RetroArch's ability to run on the Raspberry Pi (`README.md`), use configuration files (`README.md`), and expose RAM polling via UDP (FiberQuest project ground truth).

## Gaps / Follow-up

1.  **Specific RetroArch Network Command Configuration:** The most significant gap is the lack of explicit documentation on how to configure the "network command port" for `READ_CORE_MEMORY` polling within `retroarch.cfg` or via command-line arguments. Access to `https://retropie.org.uk/docs/RetroArch-Network-Commands/` is critical for this.
2.  **Pi5 Performance Metrics:** Detailed CPU, RAM, and GPU specifications, along with any relevant benchmarks for running RetroArch on a Raspberry Pi 5, are missing. This information is necessary to estimate the maximum number of simultaneous instances.
3.  **Node.js Agent (Sidecar) Implementation Details:** While the FiberQuest description outlines the agent's role, its specific capabilities for handling multiple UDP streams, processing game events, and interacting with Fiber are not detailed.
4.  **RetroArch Command-Line Arguments for Config:** Explicit examples of command-line arguments to launch RetroArch with a specific `retroarch.cfg` file would be beneficial.

## Relevant Code/API Snippets

*   **RetroArch Configuration File Mention:**
    ```markdown
    The default configuration is defined in `config.def.h`. It is not recommended to change this unless you know what you're doing. These can later be tweaked by using a config file. A sample configuration file is installed to `/etc/retroarch.cfg`. This is the system-wide config file. RetroArch will on startup create a config file in `$XDG\_CONFIG\_HOME/retroarch/retroarch.cfg` if it does not exist.
    ```
    (Source: `https://raw.githubusercontent.com/libretro/RetroArch/master/README.md`)

*   **Netplay Savestate and Memory Block:**
    ```c
    static bool netplay_build_savestate(netplay_t* netplay, retro_ctx_serialize_info_t* serial_info, bool force_capture_achievements);
    static bool netplay_process_savestate(netplay_t* netplay, retro_ctx_serialize_info_t* serial_info);
    #define NETPLAYSTATE_MEM_BLOCK "MEM "
    ```
    (Source: `https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay_frontend.c`)

*   **UDP Socket Operations (Netplay Discovery Example):**
    ```c
    int fd = socket_init((void**)&addr, 0, NULL, SOCKET_TYPE_DATAGRAM, AF_INET);
    // ...
    if (sendto(net_st->lan_ad_client_fd, (char*)&header, sizeof(header), 0, addr->ai_addr, addr->ai_addrlen) == sizeof(header))
    // ...
    ret = recvfrom(net_st->lan_ad_client_fd, (char*)&ad_packet_buffer, sizeof(ad_packet_buffer), 0, (struct sockaddr*)&their_addr, &addr_size);
    ```
    (Source: `https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay_frontend.c`)
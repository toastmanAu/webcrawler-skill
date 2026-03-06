# Research: fiberquest-electron-sidecar-scaffold

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/electron/electron/main/docs/api/app.md, https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/process-model.md, https://www.electronjs.org/docs/latest/tutorial/performance, https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/electron-builder/README.md, https://raw.githubusercontent.com/nicedoc/nicedoc/master/README.md

---

## Research Note: fiberquest-electron-sidecar-scaffold

**Date:** 2026-03-06

### Summary
This research analyzes best practices for structuring the FiberQuest Electron sidecar application, focusing on co-locating the UDP poller and Fiber RPC client within the main process. Key findings indicate that Electron's main process, being a Node.js environment, can leverage standard Node.js concurrency primitives like `worker_threads` or `child_process` for long-running tasks to avoid blocking the UI thread. Graceful shutdown of resources like UDP sockets can be managed using the `app.on('before-quit')` event. Error handling for external dependencies like the Fiber node should be implemented asynchronously at application startup, ideally after the `app.on('ready')` event. Information regarding bundling without webpack and typical ARM64 AppImage sizes was not found in the provided content.

### Best pattern for long-running background loops in Electron main process (setInterval vs worker threads vs child_process)

The Electron main process runs in a Node.js environment, allowing it to utilize all Node.js APIs, including those for concurrency. For long-running or CPU-intensive background loops, using `worker_threads` or `child_process` is generally preferred over `setInterval` if the task is blocking.

*   **`setInterval`**: Suitable for light, non-blocking periodic tasks. If the task within `setInterval` is CPU-bound or blocking, it will block the main process's event loop, leading to an unresponsive application. The "Performance" documentation explicitly warns against "Blocking the main process" (https://www.electronjs.org/docs/latest/tutorial/performance).
*   **`worker_threads`**: Node.js `worker_threads` allow running CPU-intensive JavaScript operations in a separate thread, preventing them from blocking the main event loop. This is a good choice for tasks that are primarily JavaScript-based and CPU-bound, such as complex data processing or calculations, while still sharing memory efficiently.
*   **`child_process`**: Node.js `child_process` allows spawning external processes. This is suitable for tasks that might be written in other languages, require significant isolation, or are very resource-intensive and could benefit from being completely separate from the Electron process. Given the Fiber RPC client needs to be built from Rust RPC source (as no official Node.js library exists), a `child_process` could potentially run a separate Rust binary or a Node.js wrapper that communicates with the Rust component.

The "Process Model" documentation states, "The main process runs in a Node.js environment, meaning it has the ability to `require` modules and use all of Node.js APIs" (https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/process-model.md). The "Performance" guide emphasizes avoiding blocking the main process and deferring expensive setup operations, which supports offloading long-running tasks.

### How to handle UDP socket cleanup on app quit (app.on('before-quit'))

The `app.on('before-quit')` event is the appropriate mechanism for handling UDP socket cleanup in the Electron main process. This event is emitted before the application starts closing its windows, providing an opportunity to perform necessary cleanup operations.

According to the Electron `app` API documentation:
"**Event: 'before-quit'** Emitted before the application starts closing its windows. Calling `event.preventDefault()` will prevent the default behavior, which is terminating the application." (https://raw.githubusercontent.com/electron/electron/main/docs/api/app.md)

Within this event handler, standard Node.js UDP socket methods (e.g., `dgram.Socket.close()`) can be called to ensure the socket is properly closed before the application terminates.

### Error handling pattern — what happens if Fiber node is unreachable at startup?

The provided Electron documentation does not specify a particular error handling pattern for external service unavailability at startup. However, given that the main process is a Node.js environment, standard Node.js error handling practices apply.

*   **Asynchronous Initialization**: The `app.on('ready')` event is emitted once Electron has finished initializing (https://raw.githubusercontent.com/electron/electron/main/docs/api/app.md). This is the ideal place to initiate application-specific services like connecting to the Fiber node.
*   **Graceful Failure**: If the Fiber node is unreachable, the application should handle this gracefully. This could involve:
    *   Logging the error to the console or a file.
    *   Displaying a user-friendly error message in a `BrowserWindow` to inform the user about the issue and potential remedies (e.g., "Fiber node unreachable. Please ensure it's running and funded.").
    *   Retrying the connection after a delay.
    *   Operating in a degraded mode if possible, or preventing game start until the connection is established.
*   **Non-blocking Checks**: The "Performance" documentation advises against "Loading and running code too soon" and "Blocking the main process" (https://www.electronjs.org/docs/latest/tutorial/performance). Therefore, any check for Fiber node reachability should be asynchronous to avoid delaying the application's startup or making it unresponsive.

### How to bundle a Node.js app as Electron without webpack (electron-builder with asar)

The provided content includes a link to `https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/electron-builder/README.md`, but this link resulted in an HTTP 404 error and could not be accessed. Therefore, the provided content does not contain information on how to bundle a Node.js app as Electron using `electron-builder` with `asar` without `webpack`.

The "Process Model" documentation mentions that for renderer processes, "In order to directly include NPM modules in the renderer, you must use the same bundler toolchains (for example, `webpack` or `parcel`)" (https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/process-model.md). However, this specifically refers to the renderer process, not the main process or the overall bundling of the Electron application.

### ARM64 AppImage size — typical Electron app, how big?

The provided content does not contain any information regarding the typical size of an Electron AppImage, specifically for ARM64 architectures. The binary size mentioned for `ckb-light-esp` (214KB) refers to the ESP32 firmware, which is not relevant to Electron application sizes.

### Gaps / Follow-up

1.  **Electron-builder documentation**: The `electron-builder` documentation was inaccessible (404 error). Accessing this documentation is crucial to understand how to bundle a Node.js app for Electron, especially regarding the use of `asar` and avoiding `webpack` for the main process.
2.  **Node.js Fiber Client Library**: The project ground truth explicitly states "Key gap: no official Node.js Fiber client library exists — must build from Rust RPC source." Further research would be needed on how to integrate a Rust-based Fiber RPC client into a Node.js Electron main process (e.g., via FFI, `child_process` executing a compiled Rust binary, or a custom Node.js addon).
3.  **ARM64 AppImage Size Benchmarks**: To estimate the ARM64 AppImage size, external research or benchmarks of existing Electron applications targeting ARM64 would be required, as this information is not in the provided content.

### Relevant Code/API Snippets

```js
// Example for app.on('before-quit') for UDP socket cleanup
const { app } = require('electron');
const dgram = require('dgram'); // Assuming Node.js dgram module for UDP

let udpSocket = null; // Your UDP socket instance

app.on('ready', () => {
  // Initialize UDP socket here, e.g.:
  udpSocket = dgram.createSocket('udp4');
  udpSocket.bind(55355, () => {
    console.log('UDP server listening on port 55355');
  });
  udpSocket.on('message', (msg, rinfo) => {
    console.log(`UDP message from ${rinfo.address}:${rinfo.port}: ${msg}`);
    // Process game events and trigger Fiber payments
  });
  udpSocket.on('error', (err) => {
    console.error(`UDP socket error: ${err.stack}`);
    udpSocket.close();
  });

  // Start Fiber node connection and error handling
  // This should be asynchronous and non-blocking
  checkFiberNodeReachability().then(isReachable => {
    if (!isReachable) {
      console.error('Fiber node is unreachable. Please check its status.');
      // Display error to user, e.g., via a new BrowserWindow or dialog
    } else {
      console.log('Fiber node is reachable. Proceeding with Fiber client initialization.');
      // Initialize Fiber RPC client
    }
  });
});

app.on('before-quit', (event) => {
  console.log('Application is about to quit. Performing cleanup...');
  if (udpSocket) {
    udpSocket.close(() => {
      console.log('UDP socket closed.');
    });
  }
  // Perform other cleanup, e.g., close Fiber client connections
});

// Placeholder for Fiber node reachability check
async function checkFiberNodeReachability() {
  // Implement actual check here, e.g., attempt a simple RPC call to the Fiber node
  // This should be non-blocking.
  try {
    // Example: Make an RPC call to ckbnode (192.168.68.87:8227)
    // This would involve the custom Fiber RPC client implementation
    // For now, simulate an async check
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const isReachable = Math.random() > 0.1; // Simulate 90% success rate
    return isReachable;
  } catch (error) {
    console.error('Error checking Fiber node reachability:', error);
    return false;
  }
}
```
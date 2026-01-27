const import_util = require("util");
const import_utilsBundle = require("playwright-core/lib/utilsBundle");
const { chunkToPayload } = require("./helpers");

/**
 * Stdio interception utilities
 */

// Store original functions
const originalDebugLog = import_utilsBundle.debug.log;
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;
const originalStdinIsTTY = process.stdin.isTTY;

/**
 * Sets up or tears down stdio interception
 * @param {boolean} interceptStdio - Whether to intercept stdio
 * @param {Function} dispatchEvent - Event dispatcher function
 */
function setInterceptStdio(interceptStdio, dispatchEvent) {
  if (process.env.PWTEST_DEBUG) return;

  if (interceptStdio) {
    // Intercept debug log
    if (import_utilsBundle.debug.log === originalDebugLog) {
      import_utilsBundle.debug.log = (...args) => {
        const string = import_util.default.format(...args) + "\n";
        return originalStderrWrite.apply(process.stderr, [string]);
      };
    }

    // Intercept stdout
    const stdoutWrite = (chunk) => {
      dispatchEvent("stdio", chunkToPayload("stdout", chunk));
      return true;
    };

    // Intercept stderr
    const stderrWrite = (chunk) => {
      dispatchEvent("stdio", chunkToPayload("stderr", chunk));
      return true;
    };

    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    process.stdin.isTTY = undefined;
  } else {
    // Restore originals
    import_utilsBundle.debug.log = originalDebugLog;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    process.stdin.isTTY = originalStdinIsTTY;
  }
}

module.exports = {
  setInterceptStdio,
};

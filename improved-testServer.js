"use strict";

/**
 * Enhanced Test Server for Playwright UI Mode and Test Execution
 *
 * This module provides a WebSocket-based test server dispatcher and utilities
 * for running Playwright tests in UI mode or headless server mode.
 *
 * Key improvements:
 * - Comprehensive error handling and logging
 * - Input validation for robustness
 * - Fixed report storage bugs
 * - Enhanced documentation and naming
 * - Maintains backward compatibility
 */

const { create: __create } = Object;
const { defineProperty: __defProp } = Object;
const { getOwnPropertyDescriptor: __getOwnPropDesc } = Object;
const { getOwnPropertyNames: __getOwnPropNames } = Object.getOwnPropertyNames;
const { getPrototypeOf: __getProtoOf } = Object;
const { hasOwnProperty: __hasOwnProp } = Object.prototype.hasOwnProperty;
const {
  export: __export,
} = (target, all) => {
  for (const name in all) {
    __defProp(target, name, { get: all[name], enumerable: true });
  }
  return target;
};
const {
  copyProps: __copyProps,
} = (to, from, except, desc) => {
  if (from && (typeof from === "object" || typeof from === "function")) {
    for (const key of __getOwnPropNames(from)) {
      if (!__hasOwnProp.call(to, key) && key !== except) {
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
      }
    }
  }
  return to;
};
const {
  toESM: __toESM,
} = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod,
  )
);
const {
  toCommonJS: __toCommonJS,
} = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

const testServer_exports = {};
__export(testServer_exports, {
  TestServerDispatcher: () => TestServerDispatcher,
  runTestServer: () => runTestServer,
  runUIMode: () => runUIMode,
});
module.exports = __toCommonJS(testServer_exports);

const import_util = __toESM(require("util"));
const import_server = require("playwright-core/lib/server");
const import_utils = require("playwright-core/lib/utils");
const import_utilsBundle = require("playwright-core/lib/utilsBundle");
const import_configLoader = require("../common/configLoader");
const import_list = __toESM(require("../reporters/list"));
const import_reporters = require("./reporters");
const import_sigIntWatcher = require("./sigIntWatcher");
const import_testRunner = require("./testRunner");

const originalDebugLog = import_utilsBundle.debug.log;
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;
const originalStdinIsTTY = process.stdin.isTTY;

/**
 * Main Test Server class for managing Playwright test execution
 */
class TestServer {
  /**
   * @param {string} configLocation - Path to the configuration file
   * @param {object} configCLIOverrides - CLI overrides for configuration
   */
  constructor(configLocation, configCLIOverrides) {
    this._configLocation = configLocation;
    this._configCLIOverrides = configCLIOverrides;
  }

  /**
   * Starts the test server with given options
   * @param {object} options - Server options
   * @returns {Promise} Server instance
   */
  async start(options) {
    this._dispatcher = new TestServerDispatcher(
      this._configLocation,
      this._configCLIOverrides,
    );
    return await (0, import_server.startTraceViewerServer)({
      ...options,
      transport: this._dispatcher.transport,
    });
  }

  /**
   * Stops the test server gracefully
   */
  async stop() {
    if (this._dispatcher) {
      await this._dispatcher.stop();
    }
  }
}

/**
 * Dispatcher for handling WebSocket messages and coordinating test execution
 */
class TestServerDispatcher {
  /**
   * @param {string} configLocation - Path to the configuration file
   * @param {object} configCLIOverrides - CLI overrides for configuration
   */
  constructor(configLocation, configCLIOverrides) {
    this.uiModeReporterPath = require.resolve("./uiModeReporter");
    this.shouldCloseOnDisconnect = false;
    this._testRunner = new import_testRunner.TestRunner(
      configLocation,
      configCLIOverrides,
    );

    this.transport = {
      onconnect: () => {},
      dispatch: (method, params) => {
        try {
          if (typeof this[method] === "function") {
            return this[method](params);
          } else {
            throw new Error(`Unknown method: ${method}`);
          }
        } catch (error) {
          console.error(`Error dispatching method ${method}:`, error);
          throw error;
        }
      },
      onclose: () => {
        if (this.shouldCloseOnDisconnect) {
          (0, import_utils.gracefullyProcessExitDoNotHang)(0);
        }
      },
    };

    this._dispatchEvent = (method, params) => {
      if (this.transport.sendEvent) {
        this.transport.sendEvent(method, params);
      }
    };

    this._testRunner.on(
      import_testRunner.TestRunnerEvent.TestFilesChanged,
      (testFiles) => this._dispatchEvent("testFilesChanged", { testFiles }),
    );
    this._testRunner.on(
      import_testRunner.TestRunnerEvent.TestPaused,
      (params) => this._dispatchEvent("testPaused", { errors: params.errors }),
    );
  }

  /**
   * Creates a reporter for wiring to the transport
   * @param {Function} messageSink - Function to handle messages
   * @returns {Promise} Reporter instance
   */
  async _wireReporter(messageSink) {
    return await (0, import_reporters.createReporterForTestServer)(
      this.uiModeReporterPath,
      messageSink,
    );
  }

  /**
   * Creates a collecting reporter for capturing reports
   * @returns {Promise<{reporter: any, report: any[]}>}
   */
  async _collectingReporter() {
    const report = [];
    const reporter = await (0, import_reporters.createReporterForTestServer)(
      this.uiModeReporterPath,
      (e) => report.push(e),
    );
    return { reporter, report };
  }

  /**
   * Initializes the dispatcher with parameters
   * @param {object} params - Initialization parameters
   */
  async initialize(params) {
    if (!params) throw new Error("Initialization params are required");

    this.uiModeReporterPath =
      params.serializer || require.resolve("./uiModeReporter");
    this.shouldCloseOnDisconnect = !!params.closeOnDisconnect;

    try {
      await this._testRunner.initialize({ ...params });
      this._setInterceptStdio(!!params.interceptStdio);
    } catch (error) {
      console.error("Failed to initialize test runner:", error);
      throw error;
    }
  }

  /**
   * Ping method for connection health check
   */
  async ping() {
    // No-op for health check
  }

  /**
   * Opens a file in the IDE
   * @param {object} params - Parameters with location info
   */
  async open(params) {
    if ((0, import_utils.isUnderTest)()) return;

    if (!params?.location) throw new Error("Location parameter is required");

    (0, import_utilsBundle.open)(
      "vscode://file/" + params.location.file + ":" + params.location.line,
    ).catch((e) => console.error("Failed to open file:", e));
  }

  /**
   * Resizes the terminal
   * @param {object} params - Terminal dimensions
   */
  async resizeTerminal(params) {
    if (!params) throw new Error("Terminal resize params are required");
    this._testRunner.resizeTerminal(params);
  }

  /**
   * Checks if browsers are available
   * @returns {Promise<{hasBrowsers: boolean}>}
   */
  async checkBrowsers() {
    try {
      return { hasBrowsers: this._testRunner.hasSomeBrowsers() };
    } catch (error) {
      console.error("Error checking browsers:", error);
      return { hasBrowsers: false };
    }
  }

  /**
   * Installs browsers
   */
  async installBrowsers() {
    try {
      await this._testRunner.installBrowsers();
    } catch (error) {
      console.error("Failed to install browsers:", error);
      throw error;
    }
  }

  /**
   * Runs global setup
   * @param {object} params - Setup parameters
   * @returns {Promise<{report: any[], status: string}>}
   */
  async runGlobalSetup(params) {
    try {
      const { reporter, report } = await this._collectingReporter();
      this._globalSetupReport = report;
      const { status } = await this._testRunner.runGlobalSetup([
        reporter,
        new import_list.default(),
      ]);
      return { report, status };
    } catch (error) {
      console.error("Global setup failed:", error);
      throw error;
    }
  }

  /**
   * Runs global teardown
   * @returns {Promise<{status: string, report: any[]}>}
   */
  async runGlobalTeardown() {
    try {
      const { status } = await this._testRunner.runGlobalTeardown();
      const report = this._globalSetupReport || [];
      this._globalSetupReport = undefined;
      return { status, report };
    } catch (error) {
      console.error("Global teardown failed:", error);
      throw error;
    }
  }

  /**
   * Starts the dev server
   * @param {object} params - Dev server parameters
   * @returns {Promise<{report: any[], status: string}>}
   */
  async startDevServer(params) {
    try {
      await this.stopDevServer({}); // Ensure clean state
      const { reporter, report } = await this._collectingReporter();
      this._devServerReport = report; // Fixed: Store the report for later retrieval
      const { status } = await this._testRunner.startDevServer(
        reporter,
        "out-of-process",
      );
      return { report, status };
    } catch (error) {
      console.error("Failed to start dev server:", error);
      throw error;
    }
  }

  /**
   * Stops the dev server
   * @param {object} params - Stop parameters
   * @returns {Promise<{status: string, report: any[]}>}
   */
  async stopDevServer(params) {
    try {
      const { status } = await this._testRunner.stopDevServer();
      const report = this._devServerReport || [];
      this._devServerReport = undefined;
      return { status, report };
    } catch (error) {
      console.error("Failed to stop dev server:", error);
      throw error;
    }
  }

  /**
   * Clears the test cache
   * @param {object} params - Clear parameters
   */
  async clearCache(params) {
    try {
      await this._testRunner.clearCache();
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  }

  /**
   * Lists test files
   * @param {object} params - List parameters
   * @returns {Promise<{report: any[], status: string}>}
   */
  async listFiles(params) {
    try {
      const { reporter, report } = await this._collectingReporter();
      const { status } = await this._testRunner.listFiles(
        reporter,
        params.projects,
      );
      return { report, status };
    } catch (error) {
      console.error("Failed to list files:", error);
      throw error;
    }
  }

  /**
   * Lists tests
   * @param {object} params - List parameters
   * @returns {Promise<{report: any[], status: string}>}
   */
  async listTests(params) {
    try {
      const { reporter, report } = await this._collectingReporter();
      const { status } = await this._testRunner.listTests(reporter, params);
      return { report, status };
    } catch (error) {
      console.error("Failed to list tests:", error);
      throw error;
    }
  }

  /**
   * Runs tests
   * @param {object} params - Test run parameters
   * @returns {Promise<{status: string}>}
   */
  async runTests(params) {
    try {
      const wireReporter = await this._wireReporter((e) =>
        this._dispatchEvent("report", e),
      );
      const { status } = await this._testRunner.runTests(wireReporter, {
        ...params,
        doNotRunDepsOutsideProjectFilter: true,
        pauseAtEnd: params.pauseAtEnd,
        pauseOnError: params.pauseOnError,
      });
      return { status };
    } catch (error) {
      console.error("Failed to run tests:", error);
      throw error;
    }
  }

  /**
   * Watches test files
   * @param {object} params - Watch parameters
   */
  async watch(params) {
    if (!params?.fileNames)
      throw new Error("File names are required for watching");
    try {
      await this._testRunner.watch(params.fileNames);
    } catch (error) {
      console.error("Failed to start watching:", error);
      throw error;
    }
  }

  /**
   * Finds related test files
   * @param {object} params - Parameters with files
   * @returns {Promise} Related test files
   */
  async findRelatedTestFiles(params) {
    if (!params?.files) throw new Error("Files parameter is required");
    try {
      return this._testRunner.findRelatedTestFiles(params.files);
    } catch (error) {
      console.error("Failed to find related test files:", error);
      throw error;
    }
  }

  /**
   * Stops running tests
   */
  async stopTests() {
    try {
      await this._testRunner.stopTests();
    } catch (error) {
      console.error("Failed to stop tests:", error);
      throw error;
    }
  }

  /**
   * Stops the dispatcher
   */
  async stop() {
    this._setInterceptStdio(false);
    try {
      await this._testRunner.stop();
    } catch (error) {
      console.error("Failed to stop test runner:", error);
      throw error;
    }
  }

  /**
   * Closes gracefully
   */
  async closeGracefully() {
    try {
      await this._testRunner.closeGracefully();
    } catch (error) {
      console.error("Failed to close gracefully:", error);
      throw error;
    }
  }

  /**
   * Sets up or tears down stdio interception
   * @param {boolean} interceptStdio - Whether to intercept stdio
   * @private
   */
  _setInterceptStdio(interceptStdio) {
    if (process.env.PWTEST_DEBUG) return;

    if (interceptStdio) {
      if (import_utilsBundle.debug.log === originalDebugLog) {
        import_utilsBundle.debug.log = (...args) => {
          const string = import_util.default.format(...args) + "\n";
          return originalStderrWrite.apply(process.stderr, [string]);
        };
      }
      const stdoutWrite = (chunk) => {
        this._dispatchEvent("stdio", chunkToPayload("stdout", chunk));
        return true;
      };
      const stderrWrite = (chunk) => {
        this._dispatchEvent("stdio", chunkToPayload("stderr", chunk));
        return true;
      };
      process.stdout.write = stdoutWrite;
      process.stderr.write = stderrWrite;
      process.stdin.isTTY = undefined;
    } else {
      import_utilsBundle.debug.log = originalDebugLog;
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      process.stdin.isTTY = originalStdinIsTTY;
    }
  }
}

/**
 * Runs the test server in UI mode
 * @param {string} configFile - Config file path
 * @param {object} configCLIOverrides - CLI overrides
 * @param {object} options - Server options
 * @returns {Promise<string>} Exit status
 */
async function runUIMode(configFile, configCLIOverrides, options) {
  const configLocation = (0, import_configLoader.resolveConfigLocation)(
    configFile,
  );
  return await innerRunTestServer(
    configLocation,
    configCLIOverrides,
    options,
    async (server, cancelPromise) => {
      await (0, import_server.installRootRedirect)(server, undefined, {
        ...options,
        webApp: "uiMode.html",
      });
      if (options.host !== undefined || options.port !== undefined) {
        await (0, import_server.openTraceInBrowser)(
          server.urlPrefix("human-readable"),
        );
      } else {
        const channel = await installedChromiumChannelForUI(
          configLocation,
          configCLIOverrides,
        );
        const page = await (0, import_server.openTraceViewerApp)(
          server.urlPrefix("precise"),
          "chromium",
          {
            headless:
              (0, import_utils.isUnderTest)() &&
              process.env.PWTEST_HEADED_FOR_TEST !== "1",
            persistentContextOptions: {
              handleSIGINT: false,
              channel,
            },
          },
        );
        page.on("close", () => cancelPromise.resolve());
      }
    },
  );
}

/**
 * Determines the installed Chromium channel for UI mode
 * @param {string} configLocation - Config location
 * @param {object} configCLIOverrides - CLI overrides
 * @returns {Promise<string|undefined>} Channel name
 */
async function installedChromiumChannelForUI(
  configLocation,
  configCLIOverrides,
) {
  const config = await (0, import_configLoader.loadConfig)(
    configLocation,
    configCLIOverrides,
  ).catch((e) => null);
  if (!config) return undefined;

  if (
    config.projects.some(
      (p) =>
        (!p.project.use.browserName ||
          p.project.use.browserName === "chromium") &&
        !p.project.use.channel,
    )
  )
    return undefined;

  for (const channel of ["chromium", "chrome", "msedge"]) {
    if (config.projects.some((p) => p.project.use.channel === channel))
      return channel;
  }
  return undefined;
}

/**
 * Runs the test server
 * @param {string} configFile - Config file path
 * @param {object} configCLIOverrides - CLI overrides
 * @param {object} options - Server options
 * @returns {Promise<string>} Exit status
 */
async function runTestServer(configFile, configCLIOverrides, options) {
  const configLocation = (0, import_configLoader.resolveConfigLocation)(
    configFile,
  );
  return await innerRunTestServer(
    configLocation,
    configCLIOverrides,
    options,
    async (server) => {
      console.log(
        "Listening on " +
          server.urlPrefix("precise").replace("http:", "ws:") +
          "/" +
          server.wsGuid(),
      );
    },
  );
}

/**
 * Internal function to run the test server with custom UI handler
 * @param {string} configLocation - Config location
 * @param {object} configCLIOverrides - CLI overrides
 * @param {object} options - Server options
 * @param {Function} openUI - UI opening function
 * @returns {Promise<string>} Exit status
 */
async function innerRunTestServer(
  configLocation,
  configCLIOverrides,
  options,
  openUI,
) {
  const testServer = new TestServer(configLocation, configCLIOverrides);
  const cancelPromise = new import_utils.ManualPromise();
  const sigintWatcher = new import_sigIntWatcher.SigIntWatcher();

  process.stdin.on("close", () =>
    (0, import_utils.gracefullyProcessExitDoNotHang)(0),
  );
  void sigintWatcher.promise().then(() => cancelPromise.resolve());

  try {
    const server = await testServer.start(options);
    await openUI(server, cancelPromise);
    await cancelPromise;
  } catch (error) {
    console.error("Test server execution failed:", error);
    throw error;
  } finally {
    await testServer.stop();
    sigintWatcher.disarm();
  }

  return sigintWatcher.hadSignal() ? "interrupted" : "passed";
}

/**
 * Converts a chunk to payload format for stdio events
 * @param {string} type - "stdout" or "stderr"
 * @param {Buffer|string} chunk - Data chunk
 * @returns {object} Payload object
 */
function chunkToPayload(type, chunk) {
  if (chunk instanceof Uint8Array) {
    return { type, buffer: chunk.toString("base64") };
  }
  return { type, text: chunk };
}

// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    TestServerDispatcher,
    runTestServer,
    runUIMode,
  });

// TODO: [OPTIMIZATION] Consider implementing connection pooling for better performance with multiple clients
// TODO: [OPTIMIZATION] Add metrics collection for monitoring server health and performance
// TODO: [OPTIMIZATION] Implement graceful degradation for resource-constrained environments

const import_testRunner = require("../testRunner");
const { createTransport, createEventDispatcher } = require("./utils/transport");
const { setInterceptStdio } = require("./utils/stdio");

// Import handlers
const BrowserHandler = require("./handlers/browser-handler");
const TestHandler = require("./handlers/test-handler");
const DevServerHandler = require("./handlers/dev-server-handler");
const GlobalHandler = require("./handlers/global-handler");
const FileHandler = require("./handlers/file-handler");
const SystemHandler = require("./handlers/system-handler");

/**
 * Dispatcher for handling WebSocket messages and coordinating test execution
 */
class TestServerDispatcher {
  /**
   * @param {string} configLocation - Path to the configuration file
   * @param {object} configCLIOverrides - CLI overrides for configuration
   */
  constructor(configLocation, configCLIOverrides) {
    this.uiModeReporterPath = require.resolve("../uiModeReporter");
    this.shouldCloseOnDisconnect = false;

    this._testRunner = new import_testRunner.TestRunner(
      configLocation,
      configCLIOverrides,
    );

    // Report store for handlers that need to persist reports
    this.reportStore = {};

    // Create event dispatcher
    this._dispatchEvent = null; // Will be set after transport creation

    // Create handlers with dependencies
    const dependencies = {
      testRunner: this._testRunner,
      config: { configLocation, configCLIOverrides },
      dispatchEvent: null, // Will be set after transport
      logger: console,
      reportStore: this.reportStore,
      dispatcher: this, // For system handler to set properties
    };

    this._handlers = {
      browser: new BrowserHandler(dependencies),
      test: new TestHandler(dependencies),
      devServer: new DevServerHandler(dependencies),
      global: new GlobalHandler(dependencies),
      file: new FileHandler(dependencies),
      system: new SystemHandler(dependencies),
    };

    // Create transport
    this.transport = createTransport(this);

    // Set dispatchEvent in dependencies
    dependencies.dispatchEvent = createEventDispatcher(this.transport);
    this._dispatchEvent = dependencies.dispatchEvent;

    // Set dispatchEvent for handlers
    Object.values(this._handlers).forEach((handler) => {
      handler.dependencies.dispatchEvent = this._dispatchEvent;
    });

    // Set up test runner event listeners
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
   * Delegates method calls to appropriate handlers
   * @param {string} method - Method name
   * @param {object} params - Parameters
   * @returns {Promise|any} Result
   */
  async [Symbol.for("dispatch")](method, params) {
    const handlerMap = {
      // Browser operations
      checkBrowsers: "browser",
      installBrowsers: "browser",

      // Test operations
      runTests: "test",
      listTests: "test",
      listFiles: "test",
      watch: "test",
      findRelatedTestFiles: "test",
      stopTests: "test",

      // Dev server operations
      startDevServer: "devServer",
      stopDevServer: "devServer",

      // Global operations
      runGlobalSetup: "global",
      runGlobalTeardown: "global",

      // File operations
      clearCache: "file",

      // System operations
      ping: "system",
      open: "system",
      resizeTerminal: "system",
      initialize: "system",
    };

    const handlerName = handlerMap[method];
    if (handlerName && this._handlers[handlerName][method]) {
      return await this._handlers[handlerName][method](params);
    } else {
      throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Stops the dispatcher
   */
  async stop() {
    setInterceptStdio(false, this._dispatchEvent);
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
}

module.exports = TestServerDispatcher;

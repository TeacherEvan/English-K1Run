const import_server = require("playwright-core/lib/server");
const TestServerDispatcher = require("./dispatcher");

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

module.exports = TestServer;

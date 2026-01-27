const { BaseHandler } = require("../types");
const import_utils = require("playwright-core/lib/utils");
const import_utilsBundle = require("playwright-core/lib/utilsBundle");

/**
 * System operations handler
 */
class SystemHandler extends BaseHandler {
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
    ).catch((e) => this.dependencies.logger.error("Failed to open file:", e));
  }

  /**
   * Resizes the terminal
   * @param {object} params - Terminal dimensions
   */
  async resizeTerminal(params) {
    if (!params) throw new Error("Terminal resize params are required");
    this.dependencies.testRunner.resizeTerminal(params);
  }

  /**
   * Initializes the handler with parameters
   * @param {object} params - Initialization parameters
   */
  async initialize(params) {
    if (!params) throw new Error("Initialization params are required");

    // Set properties on dispatcher
    this.dependencies.dispatcher.uiModeReporterPath =
      params.serializer || require.resolve("../../uiModeReporter");
    this.dependencies.dispatcher.shouldCloseOnDisconnect =
      !!params.closeOnDisconnect;

    try {
      await this.dependencies.testRunner.initialize({ ...params });
      // Note: stdio interception is handled by dispatcher
    } catch (error) {
      this.dependencies.logger.error(
        "Failed to initialize test runner:",
        error,
      );
      throw error;
    }
  }
}

module.exports = SystemHandler;

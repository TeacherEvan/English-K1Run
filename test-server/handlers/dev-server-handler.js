const { BaseHandler } = require("../types");
const import_reporters = require("../../reporters");

/**
 * Dev server management handler
 */
class DevServerHandler extends BaseHandler {
  /**
   * Creates a collecting reporter for capturing reports
   * @returns {Promise<{reporter: any, report: any[]}>}
   */
  async _collectingReporter() {
    const report = [];
    const reporter = await import_reporters.createReporterForTestServer(
      require.resolve("../../uiModeReporter"),
      (e) => report.push(e),
    );
    return { reporter, report };
  }

  /**
   * Starts the dev server
   * @param {object} params - Dev server parameters
   * @returns {Promise<{report: any[], status: string}>}
   */
  async startDevServer(params) {
    try {
      // Ensure clean state by stopping any existing dev server
      await this.stopDevServer({});

      const { reporter, report } = await this._collectingReporter();
      this.dependencies.reportStore.devServerReport = report;
      const { status } = await this.dependencies.testRunner.startDevServer(
        reporter,
        "out-of-process",
      );
      return { report, status };
    } catch (error) {
      this.dependencies.logger.error("Failed to start dev server:", error);
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
      const { status } = await this.dependencies.testRunner.stopDevServer();
      const report = this.dependencies.reportStore.devServerReport || [];
      this.dependencies.reportStore.devServerReport = undefined;
      return { status, report };
    } catch (error) {
      this.dependencies.logger.error("Failed to stop dev server:", error);
      throw error;
    }
  }
}

module.exports = DevServerHandler;

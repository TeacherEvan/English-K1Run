const { BaseHandler } = require("../types");
const import_reporters = require("../../reporters");
const import_list = require("../../reporters/list");

/**
 * Global setup/teardown handler
 */
class GlobalHandler extends BaseHandler {
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
   * Runs global setup
   * @param {object} params - Setup parameters
   * @returns {Promise<{report: any[], status: string}>}
   */
  async runGlobalSetup(params) {
    try {
      const { reporter, report } = await this._collectingReporter();
      this.dependencies.reportStore.globalSetupReport = report;
      const { status } = await this.dependencies.testRunner.runGlobalSetup([
        reporter,
        new import_list.default(),
      ]);
      return { report, status };
    } catch (error) {
      this.dependencies.logger.error("Global setup failed:", error);
      throw error;
    }
  }

  /**
   * Runs global teardown
   * @returns {Promise<{status: string, report: any[]}>}
   */
  async runGlobalTeardown() {
    try {
      const { status } = await this.dependencies.testRunner.runGlobalTeardown();
      const report = this.dependencies.reportStore.globalSetupReport || [];
      this.dependencies.reportStore.globalSetupReport = undefined;
      return { status, report };
    } catch (error) {
      this.dependencies.logger.error("Global teardown failed:", error);
      throw error;
    }
  }
}

module.exports = GlobalHandler;

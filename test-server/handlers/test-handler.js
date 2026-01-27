const { BaseHandler } = require("../types");
const import_reporters = require("../../reporters");
const import_list = require("../../reporters/list");

/**
 * Test execution and listing handler
 */
class TestHandler extends BaseHandler {
  /**
   * Creates a reporter for wiring to the transport
   * @param {Function} messageSink - Function to handle messages
   * @returns {Promise} Reporter instance
   */
  async _wireReporter(messageSink) {
    return await import_reporters.createReporterForTestServer(
      require.resolve("../../uiModeReporter"),
      messageSink,
    );
  }

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
   * Runs tests
   * @param {object} params - Test run parameters
   * @returns {Promise<{status: string}>}
   */
  async runTests(params) {
    try {
      const wireReporter = await this._wireReporter((e) =>
        this.dependencies.dispatchEvent("report", e),
      );
      const { status } = await this.dependencies.testRunner.runTests(
        wireReporter,
        {
          ...params,
          doNotRunDepsOutsideProjectFilter: true,
          pauseAtEnd: params.pauseAtEnd,
          pauseOnError: params.pauseOnError,
        },
      );
      return { status };
    } catch (error) {
      this.dependencies.logger.error("Failed to run tests:", error);
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
      const { status } = await this.dependencies.testRunner.listFiles(
        reporter,
        params.projects,
      );
      return { report, status };
    } catch (error) {
      this.dependencies.logger.error("Failed to list files:", error);
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
      const { status } = await this.dependencies.testRunner.listTests(
        reporter,
        params,
      );
      return { report, status };
    } catch (error) {
      this.dependencies.logger.error("Failed to list tests:", error);
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
      await this.dependencies.testRunner.watch(params.fileNames);
    } catch (error) {
      this.dependencies.logger.error("Failed to start watching:", error);
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
      return this.dependencies.testRunner.findRelatedTestFiles(params.files);
    } catch (error) {
      this.dependencies.logger.error(
        "Failed to find related test files:",
        error,
      );
      throw error;
    }
  }

  /**
   * Stops running tests
   */
  async stopTests() {
    try {
      await this.dependencies.testRunner.stopTests();
    } catch (error) {
      this.dependencies.logger.error("Failed to stop tests:", error);
      throw error;
    }
  }
}

module.exports = TestHandler;

const { BaseHandler } = require("../types");

/**
 * Browser-related operations handler
 */
class BrowserHandler extends BaseHandler {
  /**
   * Checks if browsers are available
   * @returns {Promise<{hasBrowsers: boolean}>}
   */
  async checkBrowsers() {
    try {
      return { hasBrowsers: this.dependencies.testRunner.hasSomeBrowsers() };
    } catch (error) {
      this.dependencies.logger.error("Error checking browsers:", error);
      return { hasBrowsers: false };
    }
  }

  /**
   * Installs browsers
   */
  async installBrowsers() {
    try {
      await this.dependencies.testRunner.installBrowsers();
    } catch (error) {
      this.dependencies.logger.error("Failed to install browsers:", error);
      throw error;
    }
  }
}

module.exports = BrowserHandler;

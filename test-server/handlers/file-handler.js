const { BaseHandler } = require("../types");

/**
 * File operations handler
 */
class FileHandler extends BaseHandler {
  /**
   * Clears the test cache
   * @param {object} params - Clear parameters
   */
  async clearCache(params) {
    try {
      await this.dependencies.testRunner.clearCache();
    } catch (error) {
      this.dependencies.logger.error("Failed to clear cache:", error);
      throw error;
    }
  }
}

module.exports = FileHandler;

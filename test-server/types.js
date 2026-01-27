/**
 * Type definitions and interfaces for test server modules
 */

/**
 * Base handler class interface
 * All handlers should extend this base class
 */
class BaseHandler {
  /**
   * @param {object} dependencies - Injected dependencies (testRunner, config, etc.)
   */
  constructor(dependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Handle a method call
   * @param {string} method - Method name
   * @param {object} params - Parameters
   * @returns {Promise|any} Result
   */
  async handleMethod(method, params) {
    throw new Error(`Method ${method} not implemented`);
  }
}

/**
 * Handler dependencies interface
 */
class HandlerDependencies {
  constructor() {
    /** @type {import('./testRunner')} */
    this.testRunner = null;

    /** @type {object} */
    this.config = null;

    /** @type {Function} */
    this.dispatchEvent = null;

    /** @type {object} */
    this.logger = console;
  }
}

module.exports = {
  BaseHandler,
  HandlerDependencies,
};

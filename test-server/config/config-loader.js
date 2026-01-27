const import_configLoader = require("../../common/configLoader");

/**
 * Configuration loader module for test server
 * Handles loading and resolving Playwright configuration
 */

/**
 * Resolves the configuration file location
 * @param {string} configFile - Path to config file
 * @returns {string} Resolved config location
 */
function resolveConfigLocation(configFile) {
  return (0, import_configLoader.resolveConfigLocation)(configFile);
}

/**
 * Loads the configuration with CLI overrides
 * @param {string} configLocation - Resolved config location
 * @param {object} configCLIOverrides - CLI overrides
 * @returns {Promise<object>} Loaded config
 */
async function loadConfig(configLocation, configCLIOverrides) {
  return await (0, import_configLoader.loadConfig)(
    configLocation,
    configCLIOverrides,
  );
}

module.exports = {
  resolveConfigLocation,
  loadConfig,
};

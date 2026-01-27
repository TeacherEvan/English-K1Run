const { loadConfig } = require("../config/config-loader");

/**
 * General utility functions for test server
 */

/**
 * Converts a chunk to payload format for stdio events
 * @param {string} type - "stdout" or "stderr"
 * @param {Buffer|string} chunk - Data chunk
 * @returns {object} Payload object
 */
function chunkToPayload(type, chunk) {
  if (chunk instanceof Uint8Array) {
    return { type, buffer: chunk.toString("base64") };
  }
  return { type, text: chunk };
}

/**
 * Determines the installed Chromium channel for UI mode
 * @param {string} configLocation - Config location
 * @param {object} configCLIOverrides - CLI overrides
 * @returns {Promise<string|undefined>} Channel name
 */
async function installedChromiumChannelForUI(
  configLocation,
  configCLIOverrides,
) {
  const config = await loadConfig(configLocation, configCLIOverrides).catch(
    (e) => null,
  );
  if (!config) return undefined;

  if (
    config.projects.some(
      (p) =>
        (!p.project.use.browserName ||
          p.project.use.browserName === "chromium") &&
        !p.project.use.channel,
    )
  )
    return undefined;

  for (const channel of ["chromium", "chrome", "msedge"]) {
    if (config.projects.some((p) => p.project.use.channel === channel))
      return channel;
  }
  return undefined;
}

module.exports = {
  chunkToPayload,
  installedChromiumChannelForUI,
};

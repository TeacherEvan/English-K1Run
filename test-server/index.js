const import_configLoader = require("./config/config-loader");
const import_server = require("playwright-core/lib/server");
const import_utils = require("playwright-core/lib/utils");
const import_sigIntWatcher = require("./sigIntWatcher");
const { installedChromiumChannelForUI } = require("./utils/helpers");
const TestServer = require("./server");
const TestServerDispatcher = require("./dispatcher");

/**
 * Runs the test server in UI mode
 * @param {string} configFile - Config file path
 * @param {object} configCLIOverrides - CLI overrides
 * @param {object} options - Server options
 * @returns {Promise<string>} Exit status
 */
async function runUIMode(configFile, configCLIOverrides, options) {
  const configLocation = import_configLoader.resolveConfigLocation(configFile);
  return await innerRunTestServer(
    configLocation,
    configCLIOverrides,
    options,
    async (server, cancelPromise) => {
      await (0, import_server.installRootRedirect)(server, undefined, {
        ...options,
        webApp: "uiMode.html",
      });
      if (options.host !== undefined || options.port !== undefined) {
        await (0, import_server.openTraceInBrowser)(
          server.urlPrefix("human-readable"),
        );
      } else {
        const channel = await installedChromiumChannelForUI(
          configLocation,
          configCLIOverrides,
        );
        const page = await (0, import_server.openTraceViewerApp)(
          server.urlPrefix("precise"),
          "chromium",
          {
            headless:
              (0, import_utils.isUnderTest)() &&
              process.env.PWTEST_HEADED_FOR_TEST !== "1",
            persistentContextOptions: {
              handleSIGINT: false,
              channel,
            },
          },
        );
        page.on("close", () => cancelPromise.resolve());
      }
    },
  );
}

/**
 * Runs the test server
 * @param {string} configFile - Config file path
 * @param {object} configCLIOverrides - CLI overrides
 * @param {object} options - Server options
 * @returns {Promise<string>} Exit status
 */
async function runTestServer(configFile, configCLIOverrides, options) {
  const configLocation = import_configLoader.resolveConfigLocation(configFile);
  return await innerRunTestServer(
    configLocation,
    configCLIOverrides,
    options,
    async (server) => {
      console.log(
        "Listening on " +
          server.urlPrefix("precise").replace("http:", "ws:") +
          "/" +
          server.wsGuid(),
      );
    },
  );
}

/**
 * Internal function to run the test server with custom UI handler
 * @param {string} configLocation - Config location
 * @param {object} configCLIOverrides - CLI overrides
 * @param {object} options - Server options
 * @param {Function} openUI - UI opening function
 * @returns {Promise<string>} Exit status
 */
async function innerRunTestServer(
  configLocation,
  configCLIOverrides,
  options,
  openUI,
) {
  const testServer = new TestServer(configLocation, configCLIOverrides);
  const cancelPromise = new import_utils.ManualPromise();
  const sigintWatcher = new import_sigIntWatcher.SigIntWatcher();

  process.stdin.on("close", () =>
    (0, import_utils.gracefullyProcessExitDoNotHang)(0),
  );
  void sigintWatcher.promise().then(() => cancelPromise.resolve());

  try {
    const server = await testServer.start(options);
    await openUI(server, cancelPromise);
    await cancelPromise;
  } catch (error) {
    console.error("Test server execution failed:", error);
    throw error;
  } finally {
    await testServer.stop();
    sigintWatcher.disarm();
  }

  return sigintWatcher.hadSignal() ? "interrupted" : "passed";
}

module.exports = {
  TestServerDispatcher,
  runTestServer,
  runUIMode,
};

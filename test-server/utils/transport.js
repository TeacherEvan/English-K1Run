const import_utils = require("playwright-core/lib/utils");

/**
 * Transport utilities for WebSocket communication
 */

/**
 * Creates a transport object for the dispatcher
 * @param {object} dispatcher - The dispatcher instance
 * @returns {object} Transport object with dispatch, onconnect, onclose
 */
function createTransport(dispatcher) {
  return {
    onconnect: () => {},

    dispatch: (method, params) => {
      try {
        if (typeof dispatcher[method] === "function") {
          return dispatcher[method](params);
        } else {
          throw new Error(`Unknown method: ${method}`);
        }
      } catch (error) {
        console.error(`Error dispatching method ${method}:`, error);
        throw error;
      }
    },

    onclose: () => {
      if (dispatcher.shouldCloseOnDisconnect) {
        (0, import_utils.gracefullyProcessExitDoNotHang)(0);
      }
    },
  };
}

/**
 * Creates an event dispatcher function
 * @param {object} transport - The transport object
 * @returns {Function} Event dispatcher function
 */
function createEventDispatcher(transport) {
  return (method, params) => {
    if (transport.sendEvent) {
      transport.sendEvent(method, params);
    }
  };
}

module.exports = {
  createTransport,
  createEventDispatcher,
};

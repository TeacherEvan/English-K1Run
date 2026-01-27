# Test Server Refactoring Plan

## Overview

The monolithic `improved-testServer.js` file (691 lines) needs refactoring into smaller, modular components to enhance scalability and maintainability. The current structure mixes concerns including WebSocket transport, test execution, browser management, and utility functions.

## Current Structure Analysis

- **TestServer Class**: Simple wrapper for starting/stopping the server
- **TestServerDispatcher Class**: Core dispatcher with 25+ methods handling various operations
- **Utility Functions**: `runUIMode`, `runTestServer`, `innerRunTestServer`, `installedChromiumChannelForUI`, `chunkToPayload`
- **Responsibilities Mixed**: Transport, test runner management, reporters, stdio interception, browser ops, dev server ops

## Proposed Modular Structure

### Directory Structure

```
test-server/
├── index.js                 # Main exports (backward compatibility)
├── server.js                # TestServer class
├── dispatcher.js            # TestServerDispatcher class (refactored)
├── config/
│   └── config-loader.js     # Configuration loading and resolution
├── handlers/
│   ├── browser-handler.js   # Browser-related operations
│   ├── test-handler.js      # Test execution and listing
│   ├── dev-server-handler.js # Dev server management
│   ├── global-handler.js    # Global setup/teardown
│   ├── file-handler.js      # File operations (list, watch, find)
│   └── system-handler.js    # System operations (ping, open, resize)
├── utils/
│   ├── transport.js         # WebSocket transport utilities
│   ├── stdio.js             # Stdio interception utilities
│   └── helpers.js           # General utility functions
└── types.js                 # Type definitions and interfaces
```

### Module Responsibilities

#### Core Modules

- **server.js**: Manages server lifecycle, creates dispatcher instance
- **dispatcher.js**: Coordinates between handlers, manages transport, central error handling
- **config/config-loader.js**: Loads and validates configuration, handles CLI overrides

#### Handler Modules

- **handlers/browser-handler.js**: `checkBrowsers()`, `installBrowsers()`
- **handlers/test-handler.js**: `runTests()`, `listTests()`, `listFiles()`, `stopTests()`, `watch()`, `findRelatedTestFiles()`
- **handlers/dev-server-handler.js**: `startDevServer()`, `stopDevServer()`
- **handlers/global-handler.js**: `runGlobalSetup()`, `runGlobalTeardown()`
- **handlers/file-handler.js**: `clearCache()`
- **handlers/system-handler.js**: `ping()`, `open()`, `resizeTerminal()`, `initialize()`

#### Utility Modules

- **utils/transport.js**: Transport object creation, event dispatching
- **utils/stdio.js**: Stdio interception setup/teardown
- **utils/helpers.js**: `chunkToPayload()`, `installedChromiumChannelForUI()`

### Interfaces and Contracts

#### Handler Interface

```javascript
class BaseHandler {
  constructor(dependencies) {
    // Inject dependencies: testRunner, config, etc.
  }

  async handleMethod(params) {
    // Implementation
  }
}
```

#### Dependency Injection

- **TestRunner**: Injected into handlers that need test execution
- **Config**: Injected into all handlers for configuration access
- **Transport**: Injected for event dispatching
- **Logger**: Centralized logging interface

### Error Handling Strategy

- **Centralized**: All errors bubble up to dispatcher level
- **Logging**: Consistent error logging with context
- **Graceful Degradation**: Methods return safe defaults on failure where possible
- **Validation**: Input validation at handler level

### Key Architectural Decisions

1. **Handler Pattern**: Each handler focuses on a single domain (browser, test, dev-server)
2. **Dependency Injection**: Clean separation via constructor injection
3. **Immutable Config**: Configuration loaded once and passed down
4. **Event-Driven**: Maintain WebSocket event dispatching pattern
5. **Backward Compatibility**: Same public API and exports

### Migration Strategy

1. Create new modular structure alongside existing file
2. Implement handlers one domain at a time
3. Update dispatcher to use handlers
4. Test each module independently
5. Replace monolithic file once all modules are verified
6. Maintain comprehensive test coverage

### Benefits

- **Maintainability**: Easier to locate and modify specific functionality
- **Testability**: Each module can be unit tested independently
- **Scalability**: New features can be added as new handlers
- **Reusability**: Handlers can be reused or extended
- **Readability**: Clear separation of concerns

### Risks and Mitigations

- **Complexity**: Additional abstraction layers - mitigated by clear interfaces
- **Performance**: Slight overhead from module loading - negligible for server startup
- **Breaking Changes**: Rigorous testing ensures backward compatibility

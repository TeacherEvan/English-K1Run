import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  FullConfig,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

class TestDurationReporter implements Reporter {
  private outputFile = "";

  onBegin(config: FullConfig): void {
    const outputDir =
      config.projects[0]?.outputDir ?? join(config.rootDir, "test-results");

    this.outputFile = join(outputDir, "test-durations.ndjson");
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(this.outputFile, "");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    appendFileSync(
      this.outputFile,
      `${JSON.stringify({
        title: test.title,
        titlePath: test.titlePath(),
        file: test.location.file,
        line: test.location.line,
        column: test.location.column,
        status: result.status,
        durationMs: result.duration,
        retry: result.retry,
      })}\n`,
    );
  }
}

export default TestDurationReporter;
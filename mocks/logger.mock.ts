import { vi } from "vitest";
import { Logger, LogSeverity } from "@hillwoodpark/gcp-logger";

export class MockLogger implements Logger {
  public readonly setSeverity = vi.fn();
  public readonly logDebug = vi.fn();
  public readonly logInfo = vi.fn();
  public readonly logNotice = vi.fn();
  public readonly logWarning = vi.fn();
  public readonly logError = vi.fn();

  public mockRestore() {
    this.setSeverity.mockRestore();
    this.logDebug.mockRestore();
    this.logInfo.mockRestore();
    this.logNotice.mockRestore();
    this.logWarning.mockRestore();
    this.logError.mockRestore();
  }
}

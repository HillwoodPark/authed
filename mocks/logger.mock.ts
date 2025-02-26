import { vi } from "vitest";
import { Logger } from "../src/logger.js";

export class MockLogger implements Logger {
  public readonly logDebug = vi.fn();
  public readonly logInfo = vi.fn();
  public readonly logNotice = vi.fn();
  public readonly logWarning = vi.fn();
  public readonly logError = vi.fn();

  public mockRestore() {
    this.logDebug.mockRestore();
    this.logInfo.mockRestore();
    this.logNotice.mockRestore();
    this.logWarning.mockRestore();
    this.logError.mockRestore();
  }
}

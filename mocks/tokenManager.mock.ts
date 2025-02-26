import { vi } from "vitest";
import { TokenManager } from "../src/tokenManager.js";

export class MockTokenManager implements TokenManager {
  public readonly getToken = vi.fn();

  public mockRestore() {
    this.getToken.mockRestore();
  }
}

import { vi } from "vitest";
import { TokenManager } from "../src/tokenManager.js";

export class MockTokenManager implements TokenManager {
  public readonly isTokenValid = vi.fn();
  public readonly getToken = vi.fn();

  public mockRestore() {
    this.isTokenValid.mockRestore();
    this.getToken.mockRestore();
  }
}

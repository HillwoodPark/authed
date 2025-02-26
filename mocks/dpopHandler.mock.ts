import { vi } from "vitest";
import { DPopHandler } from "../src/dpopHandler.js";

export class MockDPopHandler implements DPopHandler {
  public readonly createProof = vi.fn();

  public mockRestore() {
    this.createProof.mockRestore();
  }
}

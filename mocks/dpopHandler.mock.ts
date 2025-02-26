import { vi } from "vitest";
import { DPoPHandler } from "../src/dpopHandler.js";

export class MockDPoPHandler implements DPoPHandler {
  public readonly createProof = vi.fn();

  public mockRestore() {
    this.createProof.mockRestore();
  }
}

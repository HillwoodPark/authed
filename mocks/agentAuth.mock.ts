import { vi } from "vitest";
import { AgentAuth } from "../src/agentAuth.js";

export class MockAgentAuth implements AgentAuth {
  public readonly getInteractionToken = vi.fn();
  public readonly protectRequest = vi.fn();
  public readonly verifyRequest = vi.fn();

  public mockRestore() {
    this.getInteractionToken.mockRestore();
    this.protectRequest.mockRestore();
    this.verifyRequest.mockRestore();
  }
};

import { vi } from "vitest";
import { AgentAuth } from "../src/agentAuth.js";

export class MockAgentAuth implements AgentAuth {
  public readonly getInteractionToken = vi.fn();

  public mockRestore() {
    this.getInteractionToken.mockRestore();
  }
};
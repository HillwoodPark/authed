export class InteractionToken {
  public readonly token: string;
  public readonly targetAgentId: string;
  public readonly expiresAt: Date;

  constructor(token: string, targetAgentId: string, expiresAt: Date) {
    this.token = token;
    this.targetAgentId = targetAgentId;
    this.expiresAt = expiresAt;
  }
}


export class TokenRequest {
  public readonly targetAgentId: string;
  public readonly dpopProof: string;

  constructor(targetAgentId: string, dpopProof: string) {
    this.targetAgentId = targetAgentId;
    this.dpopProof = dpopProof;
  }

  toJSON() {
    return {
      target_agent_id: this.targetAgentId,
      dpop_proof: this.dpopProof
    }

  }

}

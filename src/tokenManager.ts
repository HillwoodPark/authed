// TODO(tjohns)
export interface TokenManager {
  getToken(
    agentId: string,
    agentSecret: string,
    targetAgentId: string,
    dpopProof: string,
    dpopPublicKey: string,
    registryUrl?: string): Promise<string>
};

// TODO(tjohns)
export class TokenManagerImpl implements TokenManager {
  async getToken(agentId: string, agentSecret: string, targetAgentId: string, dpopProof: string, dpopPublicKey: string, registryUrl?: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
};

export function createDefaultTokenManager() {
  return new TokenManagerImpl();
}
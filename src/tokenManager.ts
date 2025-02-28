import { InteractionToken, TokenRequest } from "./models.js";

type FetchFn = (
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) => Promise<Response>;

export type TokenManagerDeps = {
  fetch: FetchFn;
  tokenCache: Map<string, InteractionToken>
}

export type GetTokenParams = {
  agentId: string,
  agentSecret: string,
  targetAgentId: string,
  dpopProof: string,
  dpopPublicKey: string,
  registryUrl?: string
};
export interface TokenManager {
  isTokenValid(agentId: string, targetAgentId: string): boolean;
  getToken(params: GetTokenParams): Promise<string>;
};

// TODO(tjohns)
export class TokenManagerImpl implements TokenManager {
  private readonly registryUrl;
  private readonly tokenCache: Map<string, InteractionToken>;
  private readonly fetch: FetchFn;

  constructor(deps: TokenManagerDeps, registryUrl: string) {
    this.tokenCache = deps.tokenCache;
    this.fetch = deps.fetch;
    this.registryUrl = registryUrl
      .replace(/\/$/, '') // Strip any trailing slash
      .replace(/^http:\/\//i, 'https://') // Convert any http scheme to https
  }

  private getCacheKey(agentId: string, targetAgentId: string) {
    return `${agentId}:${targetAgentId}`
  }

  public isTokenValid(agentId: string, targetAgentId: string): boolean {
    const cacheKey = this.getCacheKey(agentId, targetAgentId);
    const token = this.tokenCache.get(cacheKey);

    if(!token) return false;
    if(token.expiresAt.getTime() <= Date.now()) return false;

    return true;

  }

  async getToken(params: GetTokenParams): Promise<string> {
    const { agentId, targetAgentId, dpopProof, dpopPublicKey, agentSecret } = params;
    const registryUrl = params.registryUrl || this.registryUrl;

    const cacheKey = this.getCacheKey(agentId, targetAgentId);
    if(this.isTokenValid(params.agentId, params.targetAgentId)) {
      return this.tokenCache.get(cacheKey)!.token;
    }

    
    // Create token request
    const tokenRequest = new TokenRequest(targetAgentId, dpopProof);

    // Format public key for HTTP header by removing PEM headers and newlines
    const formattedPublicKey = dpopPublicKey
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .trim()
      .replace(/\n/g, "")

    // Set up headers with all required authentication
    const headers = new Headers({
      "agent-id": agentId,
      "agent-secret": agentSecret,
      "dpop-public-key": formattedPublicKey,
      "dpop": dpopProof,
      "Content-Type": "application/json"
    })

    try {
      // Ensure HTTPS for registry URLs
      const baseUrl = registryUrl.includes("getauthed.dev") ? registryUrl.replace("http://", "https://") : registryUrl;
      const requestUrl = baseUrl + "/tokens/create";
      const request = new Request(requestUrl);

      const response = await this.fetch(request, {method: "POST", headers, body: JSON.stringify(tokenRequest)});

      if(response.status == 401) throw new Error("Invalid agent credentials");
      if(response.status != 200) throw new Error(await response.text());

      const tokenData = await response.json();

      const token = new InteractionToken(tokenData.token, tokenData.target_agent_id, new Date(tokenData.expires_at));

      this.tokenCache.set(cacheKey, token);

      return token.token;

    } catch(e) {

      // TODO(tjohns): Define or document this catch and re-throw behavior, and make consistent with the Python implementation
      throw e;

    }
  }
};

export function createDefaultTokenManager(registryUrl: string) {
  const tokenCache = new Map<string, InteractionToken>;
  return new TokenManagerImpl({
    fetch,
    tokenCache
  }, registryUrl);
}


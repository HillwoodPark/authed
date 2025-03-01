import { createDefaultDPoPHandler, DPoPHandler } from "./dpopHandler.js";
import { createDefaultLogger, errorMessageFromUnknown, Logger } from "./logger.js";
import { createDefaultTokenManager, TokenManager } from "./tokenManager.js";

export type AgentAuthParams = {
  registryUrl: string,
  agentId: string,
  agentSecret: string,
  privateKey: string,
  publicKey: string,
}

/**
 * TODO(tjohns): Determine if the original reference implementation at https://github.com/authed-dev
 * is still and/or intentionally removing the search params, and adapt this implementation accordingly.
 * @see https://github.com/authed-dev/authed/blob/2b8fc1fa86366e971a8d43aee207e201a70c0d81/client/sdk/auth/agent_auth.py#L12
 */
function normalizeUrl(url: string): string {
  const parsed = URL.parse(url);
  if(!parsed) throw Error(`Invalid URL: ${url}`);
  parsed.search = "";
  if(parsed.port == "80" || parsed.port == "443") parsed.port = "";
  parsed.protocol = "https";

  return parsed.toString();
}

export type AgentAuthDeps = {
  logger: Logger,
  dpop: DPoPHandler,
  tokenManager: TokenManager
}

export interface AgentAuth {
  getInteractionToken(targetAgentId: string, registryUrl?: string): Promise<string>;
}

export class AgentAuthImpl implements AgentAuth {
  private readonly logger: Logger;
  private readonly dpop: DPoPHandler;
  private readonly tokenManager: TokenManager;

  private readonly registryUrl: string;
  private readonly agentId: string;
  private readonly agentSecret: string;
  private readonly privateKey: string;
  private readonly publicKey: string
  
  constructor(deps: AgentAuthDeps, params: AgentAuthParams) {
    this.logger = deps.logger;
    this.dpop = deps.dpop;
    this.tokenManager = deps.tokenManager;

    this.agentId = params.agentId;
    this.agentSecret = params.agentSecret;
    this.privateKey = params.privateKey;
    this.registryUrl = params.registryUrl;
    this.publicKey = params.publicKey;
  }


  async getInteractionToken(targetAgentId: string, registryUrl?: string): Promise<string> {
    const logger = this.logger;

    logger.logDebug("Getting interaction token for target agent", {targetAgentId});

    if(!this.agentId || !this.agentSecret || !this.privateKey) {
      logger.logError('Missing required credentials', {
        hasAgentId: !!this.agentId,
        hasAgentSecret: !!this.agentSecret,
        hasPrivateKey: !!this.privateKey
      })

      throw new Error("Agent credentials required for token requests")

    }

    try {
      // Create DPoP proof for the token request
      let tokenEndpoint = `${this.registryUrl}/tokens/create`;
      // Normalize URL (this will ensure HTTPS for registry URLs)
      tokenEndpoint = normalizeUrl(tokenEndpoint);

      logger.logDebug("Creating DPoP proof for token request to:", {tokenEndpoint});
      
      const dpopProof = this.dpop.createProof(
        "POST",
        tokenEndpoint,
        this.privateKey
      )

      logger.logDebug("DPoP proof created successfully")
      
      logger.logDebug("Requesting token from registry...")

      // Convert targetAgentId to string before passing to getToken
      const token = await this.tokenManager.getToken({
        agentId: this.agentId,
        agentSecret: this.agentSecret,
        targetAgentId: targetAgentId,
        dpopProof,
        dpopPublicKey: this.publicKey,
        registryUrl: tokenEndpoint.split('/tokens/create', 1)[0] // Pass the base URL with correct scheme
      })

      logger.logDebug("Token received successfully", {token: token.substring(0,19)})
      
      return token;
    } catch (e: any) {
      logger.logError("Error getting interaction token", {errorMessage: errorMessageFromUnknown(e)})
      throw e;
    }

  } 

}

export function createAgentAuth(params: AgentAuthParams): AgentAuth {
  return new AgentAuthImpl({
    logger: createDefaultLogger(),
    dpop: createDefaultDPoPHandler(),
    tokenManager: createDefaultTokenManager(params.registryUrl)
  }, params)
}


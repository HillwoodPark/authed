import { createDefaultDPoPHandler, DPoPHandler } from "./dpopHandler.js";
import { createDefaultLogger, errorMessageFromUnknown, Logger } from "@hillwoodpark/gcp-logger";
import { createDefaultTokenManager, TokenManager } from "./tokenManager.js";

export type AgentAuthParams = {
  registryUrl: string,
  agentId: string,
  agentSecret: string,
  privateKey: string,
  publicKey: string,
}

function isRegistryUrl(url: string): boolean {
  return url.includes("getauthed.dev");
} 

function normalizeUrl(url: string, forceHttps?: boolean): string {
  const parsed = URL.parse(url);
  if(!parsed) throw Error(`Invalid URL: ${url}`);
  parsed.search = "";
  if(parsed.port == "80" || parsed.port == "443") parsed.port = "";
  parsed.protocol = (forceHttps || isRegistryUrl(url)) ? "https" : parsed.protocol;

  return parsed.toString();
}

async function readContent(response: Response): Promise<object | string> {
  const contentType = response.headers.get('content-type')?.toLowerCase();
  if(contentType?.startsWith("application/json")) {
    return await response.json();
  } else {
    return await response.text();
  }
}

function headersToJSON(headers: Headers) {
  const headersJSON: Record<string, string> = {};
  for (const [name, value] of headers.entries()) {
    headersJSON[name] = value;
  }
  return headersJSON;
}

type FetchFn = (
  input: string | URL | globalThis.Request,
  init?: RequestInit,
) => Promise<Response>;

export type AgentAuthDeps = {
  logger: Logger,
  dpop: DPoPHandler,
  tokenManager: TokenManager,
  fetch: FetchFn;
}

export interface AgentAuth {
  getInteractionToken(targetAgentId: string, registryUrl?: string): Promise<string>;
  protectRequest(method: string, url: string, targetAgentId: string, existingHeaders?: Headers): Promise<Headers>;
  verifyRequest(method: string, url: string, headers: Headers): Promise<boolean>;
}

export class AgentAuthImpl implements AgentAuth {
  private readonly logger: Logger;
  private readonly dpop: DPoPHandler;
  private readonly tokenManager: TokenManager;
  private readonly fetch: FetchFn;

  private readonly registryUrl: string;
  private readonly agentId: string;
  private readonly agentSecret: string;
  private readonly privateKey: string;
  private readonly publicKey: string
  
  constructor(deps: AgentAuthDeps, params: AgentAuthParams) {
    this.logger = deps.logger;
    this.dpop = deps.dpop;
    this.tokenManager = deps.tokenManager;
    this.fetch = deps.fetch;

    this.registryUrl = normalizeUrl(params.registryUrl.replace(/\/$/, ''), true);
    this.agentId = params.agentId;
    this.agentSecret = params.agentSecret;
    this.privateKey = params.privateKey;
    this.publicKey = params.publicKey;
  }

  async protectRequest(method: string, url: string, targetAgentId: string, existingHeaders?: Headers): Promise<Headers> {
    const logger = this.logger;

    if(!this.privateKey) {
      logger.logError('Missing private key')

      throw new Error("Private key required for protecting requests")

    }

    try {

      // Start with existing headers
      const headers = new Headers(existingHeaders);
      
      logger.logDebug("Initial headers", headers);

      // Add DPoP proof
      logger.logDebug("Generating DPoP proof...")
      logger.logDebug("DPoP proof method", {method})
      logger.logDebug("DPoP proof URL", {url});
      logger.logDebug("Private key present for DPoP proof generation");

      // Generate DPoP proof for the actual request URL
      const normalizedUrl = normalizeUrl(url);

      const proof = this.dpop.createProof(method, normalizedUrl, this.privateKey);

      logger.logDebug("Generated DPoP proof", {proof: proof.substring(0, 49)});

      // Get token for target agent (always use HTTPS for registry)
      logger.logDebug("Getting interaction token for target agent", {targetAgentId});
      const token = await this.getInteractionToken(targetAgentId);
     
      logger.logDebug("Got interaction token", {token: token.substring(0, 19)});

      // Add auth headers
      headers.set("dpop", proof);
      headers.set("authorization", `Bearer ${token}`);
      headers.set("target-agent-id", targetAgentId);

      return headers;

    } catch (e: any) {
      logger.logError("Error protecting request", {errorMessage: errorMessageFromUnknown(e)})
      throw e;
    }

  }

  async verifyRequest(method: string, url: string, headers: Headers): Promise<boolean> {
    const logger = this.logger;

    logger.logDebug("Verifying request...")
    logger.logDebug("Method", {method});
    logger.logDebug("URL", {url});
    logger.logDebug("Headers", {headers: headersToJSON(headers)});

    // Extract token from Authorization header
    const authHeader = headers.get("authorization");
    if(!authHeader) {
      logger.logError("Missing authorization header");
      throw new Error("Missing authorization header")
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader;

    // Extract DPoP proof
    const dpop = headers.get("dpop");
    if(!dpop) {
      logger.logError("Missing DPoP proof header");
      throw new Error("Missing DPoP proof header");
    }

    // Get target agent ID if present
    const targetAgentId = headers.get("target-agent-id");
    logger.logDebug("Target agent ID", {targetAgentId});

    try {
      // Call registry's verify endpoint
      logger.logDebug("Making request to registry verify endpoint...")

      const verifyUrl = `${this.registryUrl}/tokens/verify`;

      // Create a new DPoP proof specifically for the verification request
      const verificationProof = this.dpop.createProof(
        "POST",  // Verification endpoint uses POST
        verifyUrl,
        this.privateKey
      );

      const verifyHeaders = new Headers({
        "authorization": `Bearer ${token}`,
        "dpop": verificationProof  // # Our new proof for this verification request
      });

      if(targetAgentId) {
        verifyHeaders.set("target-agent-id", targetAgentId);
      }

      logger.logDebug("Verify request headers", {verifyHeaders: headersToJSON(verifyHeaders)});


      // Ensure HTTPS for registry URLs
      const requestUrl = this.registryUrl + "/tokens/verify";
      const request = new Request(requestUrl);
      
      const response = await this.fetch(request, {method: "POST", headers: verifyHeaders});
      const content = await readContent(response);

      logger.logDebug("Verify response status:", {status: response.status});
      logger.logDebug("Verify response:", {content});

      if(response.status == 401) throw new Error("Invalid agent credentials");
      if(response.status != 200) throw new Error(content.toString());

      return true;

    } catch (e: any) {
      logger.logError("Error verifying request", {errorMessage: errorMessageFromUnknown(e)})
      throw e;
    }

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
    tokenManager: createDefaultTokenManager(params.registryUrl),
    fetch
  }, params)
}


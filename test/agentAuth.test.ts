import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentAuthImpl } from "../src/agentAuth"
import { MockDPoPHandler } from "../mocks/dpopHandler.mock";
import { MockTokenManager } from "../mocks/tokenManager.mock";
import { MockLogger } from "../mocks/logger.mock";

describe("agentAuth", () => {

  const logger = new MockLogger();
  const dpop = new MockDPoPHandler();
  const tokenManager = new MockTokenManager();
  const fetch = vi.fn();
  
  const deps = {
    logger,
    dpop,
    tokenManager,
    fetch
  }

  const agentAuth = new AgentAuthImpl(deps, {
    registryUrl: "https://example.com/registryUrl",
    agentId: "agentId",
    agentSecret: "agentSecret",
    privateKey: "privateKey",
    publicKey: "publicKey",
  });

  beforeEach(() => {
    logger.mockRestore();
    dpop.mockRestore();
    dpop.createProof.mockReturnValue('proof')
    tokenManager.mockRestore();
    tokenManager.getToken.mockReturnValue('token')
    fetch.mockRestore();
  })

  describe('getInteractionToken', () => {
    
    it('should log and throw if there is no agentId', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      await expect(() => agentAuth.getInteractionToken("targetAgentId"))
        .rejects
        .toThrowError("Agent credentials required for token requests");

      expect(logger.logError).toHaveBeenCalledWith("Missing required credentials", expect.objectContaining({hasAgentId: false}))

    })  

    it('should log and throw if there is no agentSecret', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      await expect(() => agentAuth.getInteractionToken("targetAgentId"))
        .rejects
        .toThrowError("Agent credentials required for token requests");

      expect(logger.logError).toHaveBeenCalledWith("Missing required credentials", expect.objectContaining({hasAgentSecret: false}))

    })

    it('should log and throw if there is no privateKey', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "",
        publicKey: "publicKey",
      });

      await expect(() => agentAuth.getInteractionToken("targetAgentId"))
        .rejects
        .toThrowError("Agent credentials required for token requests");

      expect(logger.logError).toHaveBeenCalledWith("Missing required credentials", expect.objectContaining({hasPrivateKey: false}))

    })

    it("should log and rethrow if createProof throws", async () => {
      dpop.createProof.mockRestore();
      dpop.createProof.mockImplementation(() => {throw new Error('Nope.')});

      await expect(() => agentAuth.getInteractionToken("targetAgentId"))
        .rejects
        .toThrowError("Nope.");

      expect(logger.logError).toHaveBeenCalledWith("Error getting interaction token", expect.objectContaining({errorMessage: expect.stringContaining("Nope.")}))

    })

    it("should log and throw if getToken throws", async () => {
      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockImplementation(() => {throw new Error('Nope.')});

      await expect(() => agentAuth.getInteractionToken("targetAgentId"))
        .rejects
        .toThrowError("Nope.");

      expect(logger.logError).toHaveBeenCalledWith("Error getting interaction token", expect.objectContaining({errorMessage: expect.stringContaining("Nope.")}))

    })

    it("should log and throw if getToken rejects", async () => {
      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockRejectedValue(new Error('Nope.'));

      await expect(() => agentAuth.getInteractionToken("targetAgentId"))
        .rejects
        .toThrowError("Nope.");

      expect(logger.logError).toHaveBeenCalledWith("Error getting interaction token", expect.objectContaining({errorMessage: expect.stringContaining("Nope.")}))

    })

    it("should return the token", async () => {
      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockReturnValue("token");

      expect(await agentAuth.getInteractionToken("targetAgentId")).toEqual("token");

    })

          
  });

  describe('protectRequest', () => {

    it('should log and throw an error if there is no private key', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "",
        publicKey: "publicKey",
      });

      await expect(() => agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId"))
        .rejects
        .toThrowError("Private key required for protecting requests");

      expect(logger.logError).toHaveBeenCalledWith("Missing private key")

    });

    it("should log and throw if createProof throws", async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockImplementation(() => {throw new Error('Nope.')});

      await expect(() => agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId"))
        .rejects
        .toThrowError("Nope.");

      expect(logger.logError).toHaveBeenCalledWith("Error protecting request", expect.objectContaining({
        errorMessage: "Error: Nope."
      }))

    });

    it("should log and throw if getToken throws", async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockImplementation(() => {throw new Error('Nope.')});

      await expect(() => agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId"))
        .rejects
        .toThrowError("Nope.");

      expect(logger.logError).toHaveBeenCalledWith("Error protecting request", expect.objectContaining({
        errorMessage: "Error: Nope."
      }))

    });

    it("should log and throw if getToken rejects", async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockRejectedValue(new Error('Nope.'));

      await expect(() => agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId"))
        .rejects
        .toThrowError("Nope.");

      expect(logger.logError).toHaveBeenCalledWith("Error protecting request", expect.objectContaining({
        errorMessage: "Error: Nope."
      }))

    });    

    it('should include any headers provided by the caller', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      const existingHeaders = new Headers({
        "Content-Type": "application/x.test+json"
      })
        
      const headers = await agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId", existingHeaders);

      expect(headers.get("Content-Type")).toEqual("application/x.test+json");

    });

    it('should add the DPoP proof to the headers', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockReturnValue('trustme');

      const headers = await agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId");

      expect(headers.get("dpop")).toEqual("trustme");
    });

    it('should add the target agent id to the headers', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      const headers = await agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId");

      expect(headers.get("target-agent-id")).toEqual("targetAgentId");

    })

    it('should add the interaction token to the authorization header', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockReturnValue("token");

      const headers = await agentAuth.protectRequest("POST", "https://example.com/targetAgentEndpoint", "targetAgentId");

      expect(headers.get("authorization")).toEqual("Bearer token");

    })

  })

  describe('verifyRequest', () => {

    beforeEach(() => {
      fetch.mockRestore();
      fetch.mockReturnValue(new Response(JSON.stringify({
        status: "ok" // TODO(tjohns): I totally just made this up, verify with actual response when I call the actual server
      }), {status: 200}))

    })

    it('should log and throw if there is no authorization header', async () => {

      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      const headers = new Headers();

      await expect(() => agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers))
        .rejects
        .toThrowError("Missing authorization header");

      expect(logger.logError).toHaveBeenCalledWith("Missing authorization header");
      
    })

    it('should log and throw if there is no dpop proof header', async () => {

      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      const headers = new Headers({"authorization": "Bearer token"});

      await expect(() => agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers))
        .rejects
        .toThrowError("Missing DPoP proof header");

      expect(logger.logError).toHaveBeenCalledWith("Missing DPoP proof header");

    })

    it('should call the registry to verify the token', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof"});

      expect(await agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers)).toEqual(true);

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: "POST",
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("authorization") == "Bearer token" })
        })
      )

    })
    
    it('should include the verification proof when calling the registry to verify the token', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockReturnValue('verificationProof')

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof"});

      expect(await agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers)).toEqual(true);

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("dpop") == "verificationProof" })
        })
      )

    })

    it('should force https for queries overridden to go to the official authed registry servers', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "http://test.getauthed.dev/registry",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockReturnValue('verificationProof')

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof"});

      expect(await agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers)).toEqual(true);

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({url: "https://test.getauthed.dev/registry/tokens/verify"}),
        expect.anything(),
      )      
    });

    it('should not force https for queries overridden to go to locally hosted registry servers', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "http://localhost",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockReturnValue('verificationProof')

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof"});

      expect(await agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers)).toEqual(true);

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({url: "http://localhost/tokens/verify"}),
        expect.anything(),
      )      
    });

    it('should throw if verification fails with 401', async ()=> {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      fetch.mockRestore();
      fetch.mockReturnValue(new Response("Unauthorized", {status: 401}))

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof"});

      await expect(() => agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers))
        .rejects
        .toThrowError("Invalid agent credentials");

    })

    it('should throw if verification fails with 500', async ()=> {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      fetch.mockRestore();
      fetch.mockReturnValue(new Response("Internal Server Error", {status: 500}))

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof"});

      await expect(() => agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers))
        .rejects
        .toThrowError("Internal Server Error");
    })

    it('should forward the target agent id when verifying the token with the registry, if the caller provided a target agent in the original headers', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockReturnValue('verificationProof')

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof", "target-agent-id": "targetAgentId"});

      expect(await agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers)).toEqual(true);

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("target-agent-id") == "targetAgentId" })
        })
      )
    })

    it('should not include a target agent id when verifying the token with the registry, if the caller did not provide a target agent it', async () => {
      const agentAuth = new AgentAuthImpl(deps, {
        registryUrl: "https://example.com/registryUrl",
        agentId: "agentId",
        agentSecret: "agentSecret",
        privateKey: "privateKey",
        publicKey: "publicKey",
      });

      dpop.createProof.mockRestore();
      dpop.createProof.mockReturnValue('verificationProof')

      const headers = new Headers({"authorization": "Bearer token", "dpop": "dpopProof" /* "target-agent-id": "targetAgentId" */});

      expect(await agentAuth.verifyRequest("POST", "https://example.com/targetAgentEndpoint", headers)).toEqual(true);

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => !headers.get("target-agent-id"))
        })
      )      

    })

  })

})

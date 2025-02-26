import { beforeEach, describe, expect, it } from "vitest";
import { AgentAuthImpl } from "../src/agentAuth"
import { MockDPoPHandler } from "../mocks/dpopHandler.mock";
import { MockTokenManager } from "../mocks/tokenManager.mock";
import { MockLogger } from "../mocks/logger.mock";

describe("agentAuth", () => {

  const logger = new MockLogger();
  const dpop = new MockDPoPHandler();
  const tokenManager = new MockTokenManager();
  
  const deps = {
    logger,
    dpop,
    tokenManager
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

    it("return the token", async () => {
      tokenManager.getToken.mockRestore();
      tokenManager.getToken.mockReturnValue("token");

      expect(await agentAuth.getInteractionToken("targetAgentId")).toEqual("token");

    })

          
  })  
})

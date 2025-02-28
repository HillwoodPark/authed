import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenManagerImpl } from "../src/tokenManager";
import { InteractionToken } from "../src/models";

describe("tokenManager", () => {

  describe('isTokenValid', () => {

    it('should return false if the token is not in the cache', () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({tokenCache, fetch: vi.fn()}, "https://example.com/registry");

      expect(tokenManager.isTokenValid("agentId", "targetAgentId")).toEqual(false)          
    })

    it('should return false if the token is in the cache, but expired', () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({tokenCache, fetch: vi.fn()}, "https://example.com/registry");
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const expiredToken = new InteractionToken("expiredToken", "targetAgentId", fiveMinutesAgo);

      tokenCache.set(`agentId:targetAgentId`, expiredToken);

      expect(tokenManager.isTokenValid("agentId", "targetAgentId")).toEqual(false)          
    })

    it('should return true if the token is in the cache, and not expired', () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({tokenCache, fetch: vi.fn()}, "https://example.com/registry");
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      const unexpiredToken = new InteractionToken("unexpiredToken", "targetAgentId", fiveMinutesFromNow);

      tokenCache.set(`agentId:targetAgentId`, unexpiredToken);

      expect(tokenManager.isTokenValid("agentId", "targetAgentId")).toEqual(true)          
    })

  })

  describe("getToken", () => {
    const fetch = vi.fn();

    beforeEach(() => {
      fetch.mockRestore();
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      fetch.mockReturnValue(new Response(JSON.stringify({
        token: "returnedToken",
        target_agent_id: "targetAgentId",
        expires_at: fiveMinutesFromNow.toISOString()
      }), {status: 200}))

    })

    it('should return a valid cached token without calling fetch', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      const unexpiredToken = new InteractionToken("unexpiredToken", "targetAgentId", fiveMinutesFromNow);
      tokenCache.set(`agentId:targetAgentId`, unexpiredToken);
        
      fetch.mockRestore();

      const token = await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(token).toEqual("unexpiredToken");
      expect(fetch).not.toHaveBeenCalled();
    })  

    it('should call fetch if the cached token is expired', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const expiredToken = new InteractionToken("expiredToken", "targetAgentId", fiveMinutesAgo);
      tokenCache.set(`agentId:targetAgentId`, expiredToken);
        
      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledOnce();
    })  

    it('should send the provided agentId in the request headers', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("agent-id") == "agentId" })
        })
      )

    });

    it('should send the agentSecret in the request headers', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("agent-secret") == "agentSecret" })
        })
      )

    });
    
    it('should send the dpopProof in the request headers', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("dpop") == "dpopProof" })
        })
      )

    });

    it('should send the application/json Content-Type header', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("Content-Type") == "application/json" })
        })
      )

    });

    it('should strip headers, newlines, and whitespace from the dpopPublicKey', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");

      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: " -----BEGIN PUBLIC KEY-----dpop\nPublic\nKey-----END PUBLIC KEY----- "
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("dpop-public-key") == "dpopPublicKey" })
        })
      )

    });

    it('should send a key without headers, newlines, and whitespace verbatim', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");

      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.toSatisfy((headers: Headers) => { return headers.get("dpop-public-key") == "dpopPublicKey" })
        }),
      )
    })

    it('should force https for queries overridden to go to the official authed registry servers', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");

      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey",
        registryUrl: "http://test.getauthed.dev/registry"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({url: "https://test.getauthed.dev/registry/tokens/create"}),
        expect.anything()
      )

    })

    it('should not force https for queries overridden to go to locally hosted registry servers', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");

      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey",
        registryUrl: "http://localhost"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({url: "http://localhost/tokens/create"}),
        expect.anything()
      )

    })

    it('should handle a trailing slash and upgrade the manager-wide registryUrl to https', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "http://example.com/registry/");

      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.objectContaining({url: "https://example.com/registry/tokens/create"}),
        expect.anything()
      )

    })

    it('should POST', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: "POST"
        })
      )
    })

    it('should throw if the server responds with 401', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      fetch.mockRestore();

      fetch.mockReturnValue(new Response("Unauthorized", {status: 401}))
  
      await expect(() => tokenManager.getToken({
          agentId: "agentId", 
          agentSecret: "agentSecret", 
          targetAgentId: "targetAgentId", 
          dpopProof: "dpopProof", 
          dpopPublicKey: "dpopPublicKey"
        }))
        .rejects
        .toThrowError("Invalid agent credentials");

    })

    it('should throw if the server responds with 500', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
  
      fetch.mockRestore();

      fetch.mockReturnValue(new Response("Internal Server Error", {status: 500}))
  
      await expect(() => tokenManager.getToken({
          agentId: "agentId", 
          agentSecret: "agentSecret", 
          targetAgentId: "targetAgentId", 
          dpopProof: "dpopProof", 
          dpopPublicKey: "dpopPublicKey"
        }))
        .rejects
        .toThrowError("Internal Server Error");

    })    

    it('should return the token from the response', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      fetch.mockRestore();

      fetch.mockReturnValue(new Response(JSON.stringify({
        token: "returnedToken",
        target_agent_id: "targetAgentId",
        expires_at: fiveMinutesFromNow.toISOString()
      }), {status: 200}))

      const token = await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(token).toEqual("returnedToken")

    })    

    it('should cache the token from the response', async () => {
      const tokenCache = new Map<string, InteractionToken>();
      const tokenManager = new TokenManagerImpl({fetch, tokenCache}, "https://example.com/registry");
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  
      fetch.mockRestore();

      fetch.mockReturnValue(new Response("Internal Server Error", {status: 500}))
  
      fetch.mockReturnValue(new Response(JSON.stringify({
        token: "returnedToken",
        target_agent_id: "targetAgentId",
        expires_at: fiveMinutesFromNow.toISOString()
      }), {status: 200}))

      await tokenManager.getToken({
        agentId: "agentId", 
        agentSecret: "agentSecret", 
        targetAgentId: "targetAgentId", 
        dpopProof: "dpopProof", 
        dpopPublicKey: "dpopPublicKey"
      });

      expect(tokenCache.get(`agentId:targetAgentId`)).toEqual(expect.objectContaining({token: "returnedToken"}))

    })    
  })
})
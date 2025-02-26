import { describe, expect, it } from "vitest";
import { DPoPHandlerImpl } from "../src/dpopHandler";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { generateKeyPairSync } from 'node:crypto';


const keypair = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  },
})


describe("dpopHandler", () => {
  const dpopHandler = new DPoPHandlerImpl();

  describe('createProof', () => {
    
    it.todo('should be tested', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof)

      expect(payload).toEqual('something');
    })
  
  })
})
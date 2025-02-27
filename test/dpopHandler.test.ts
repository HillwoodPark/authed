import { describe, expect, it } from "vitest";
import { DPoPHandlerImpl } from "../src/dpopHandler";
import jsonwebtoken from "jsonwebtoken";
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

export const uuidMatch = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
export const nonceMatch = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{20}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{1}\b$/;


describe("dpopHandler", () => {
  const dpopHandler = new DPoPHandlerImpl();

  describe('createProof', () => {
    
    it('should have a (new) UUID in jti', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      expect(payload["jti"]).toEqual(expect.stringMatching(uuidMatch));
    })

    it('should have the method name in htm', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      expect(payload["htm"]).toEqual("POST");
    })

    it('should uppercase the method name in htm', () => {

      const proof = dpopHandler.createProof("pOsT", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      expect(payload["htm"]).toEqual("POST");
    })

    it('should have the url in htu', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      expect(payload["htu"]).toEqual("https://example.com");
    })

    it('should have (roughly) the current time in seconds since epoch in iat', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      const secondsSinceEpoch = Math.floor(Date.now() / 1000);
      const epsilon = 5; // If this takes longer than 5 seconds to run, it will fail

      expect(payload["iat"] > secondsSinceEpoch - epsilon);
      expect(payload["iat"] <= secondsSinceEpoch);
    })

    it('should have (roughly) five minutes from now, in seconds since epoch, in iat', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      const expiresAtSecondsSinceEpoch = Math.floor(Date.now() / 1000) + 300;
      const epsilon = 5; // If this takes longer than 5 seconds to run, it will fail

      expect(payload["exp"] > expiresAtSecondsSinceEpoch - epsilon);
      expect(payload["exp"] <= expiresAtSecondsSinceEpoch);
    })


    it('should have a 32-character nonce in concatenated guid plus partial-guid format', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const payload = jsonwebtoken.verify(proof, keypair.publicKey);

      expect(payload["nonce"]).toEqual(expect.stringMatching(nonceMatch));
    })

    it('should have a "typ" of "dpop+jwt" in the header', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const { header } = jsonwebtoken.verify(proof, keypair.publicKey, {complete: true});

      expect(header["typ"]).toEqual("dpop+jwt");
    })

    it('should have an "alg" of "RS256" in the header', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const { header } = jsonwebtoken.verify(proof, keypair.publicKey, {complete: true});

      expect(header["alg"]).toEqual("RS256");
    })

    it('should have an "jwk.kty" of "RSA" in the header', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const { header } = jsonwebtoken.verify(proof, keypair.publicKey, {complete: true});

      expect(header["jwk"]["kty"]).toEqual("RSA");
    })

    it('should have an "jwk.use" of "sig" in the header', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const { header } = jsonwebtoken.verify(proof, keypair.publicKey, {complete: true});

      expect(header["jwk"]["use"]).toEqual("sig");
    })

    it('should have an "jwk.alg" of "RS256" in the header', () => {

      const proof = dpopHandler.createProof("POST", "https://example.com", keypair.privateKey);

      const { header } = jsonwebtoken.verify(proof, keypair.publicKey, {complete: true});

      expect(header["jwk"]["alg"]).toEqual("RS256");
    })

  
  })
})

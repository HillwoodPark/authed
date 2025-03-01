import { createPrivateKey, createPublicKey } from "crypto";
import jsonwebtoken from "jsonwebtoken";

// TODO(tjohns)
export interface DPoPHandler {
  createProof(method: string, url: string, privateKeyPem: string): string;
};
export class DPoPHandlerImpl implements DPoPHandler {
  createProof(method: string, url: string, privateKeyPem: string): string {

    // Create a secure nonce (32 characters)
    const nonce = crypto.randomUUID() + crypto.randomUUID().substring(0, 15);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 300; // 5 minute expiry

    // Create the proof payload
    const payload = {
        "jti": crypto.randomUUID(),
        "htm": method.toUpperCase(),
        "htu": url,
        "iat": iat,
        "exp": exp, 
        "nonce": nonce  // Add the nonce
    }

    const privateKeyObject = createPrivateKey(privateKeyPem);
    const publicKeyObject = createPublicKey(privateKeyObject);
    const jwk = publicKeyObject.export({format: "jwk"});

    // Create header with key type and algorithm
    const header = {
      "typ": "dpop+jwt",
      "alg": "RS256",
      "jwk": {
        "kty": "RSA",
        "use": "sig",
        "alg": "RS256",
        "n": jwk.n,
        "e": jwk.e
      }
    }

    const jwt = jsonwebtoken.sign(payload, privateKeyPem, {      
      algorithm: "RS256",
      header
    });
    
    return jwt;

  }
};

export function createDefaultDPoPHandler() {
  return new DPoPHandlerImpl();
}
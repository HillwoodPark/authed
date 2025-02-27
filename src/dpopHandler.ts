import jsonwebtoken from "jsonwebtoken";

// TODO(tjohns)
export interface DPoPHandler {
  createProof(method: string, url: string, privateKeyPem: string): string;
};
export class DPoPHandlerImpl implements DPoPHandler {
  createProof(method: string, url: string, privateKeyPem: string): string {

    // Create a secure nonce (32 characters)
    const nonce = crypto.randomUUID() + crypto.randomUUID().substring(0, 15);

    // Create the proof payload
    const payload = {
        "jti": crypto.randomUUID(),
        "htm": method.toUpperCase(),
        "htu": url,
        "iat": Math.floor(Date.now() / 1000),
        "exp": Math.floor(Date.now() / 1000) + 300, // 5 minute expiry
        "nonce": nonce  // Add the nonce
    }

    // Create header with key type and algorithm
    const header = {
      "typ": "dpop+jwt",
      "alg": "RS256",
      "jwk": {
          "kty": "RSA",
          "use": "sig",
          "alg": "RS256"
      }
    }

    return jsonwebtoken.sign(payload, privateKeyPem, {algorithm: "RS256", header})

  }
};

export function createDefaultDPoPHandler() {
  return new DPoPHandlerImpl();
}
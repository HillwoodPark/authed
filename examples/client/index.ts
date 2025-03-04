import { generateKeyPairSync } from "crypto";
import { createAgentAuth } from "../../src/agentAuth.js";

export async function main() {

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
  
  const assignedPrivateKey =  keypair.privateKey;

  const agentAuth = createAgentAuth({
    registryUrl: process.env.AUTHED_REGISTRY_URL || "",
    agentId: process.env.AUTHED_AGENT_ID || "",
    agentSecret: process.env.AUTHED_AGENT_SECRET || "",
    privateKey: process.env.AUTHED_PRIVATE_KEY || keypair.privateKey,
    publicKey: process.env.AUTHED_PUBLIC_KEY || keypair.publicKey
  });
  
  const targetAgentId = process.env.AUTHED_TARGET_AGENT_ID || "";

  const method = "GET";
  const url = "http://localhost/secure-endpoint";

  const headers = await agentAuth.protectRequest(method, url, targetAgentId, new Headers({"Content-Type": "application/json"}));

  const request = new Request(url);

  const response = await fetch(request, {method, headers});

  const json = await response.json();

  console.log(json);
}


main();
import { generateKeyPairSync } from "crypto";
import { createAgentAuth } from "../../src/agentAuth.js";

export async function main() {

  // TODO(tjohns): generating a new keypair for each run of this client is excessive,
  // but it at least prevents having to have a bunch of instructions on how to generate
  // a keypair, which is a simple yet notoriously fragile process. After we have a CLI
  // (or even before), create or document a better mechanism than this.
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
  
  const agentAuth = createAgentAuth({
    registryUrl: process.env.AUTHED_REGISTRY_URL || "",
    agentId: process.env.AUTHED_AGENT_ID || "",
    agentSecret: process.env.AUTHED_AGENT_SECRET || "",
    privateKey: process.env.AUTHED_PRIVATE_KEY || keypair.privateKey,
    publicKey: process.env.AUTHED_PUBLIC_KEY || keypair.publicKey
  });
  
  const targetAgentId = process.env.AUTHED_TARGET_AGENT_ID || "";

  const method = "GET";
  const url = "http://localhost:3000/secure-endpoint";

  const headers = await agentAuth.protectRequest(method, url, targetAgentId, new Headers({"Content-Type": "application/json"}));

  const request = new Request(url);

  const response = await fetch(request, {method, headers});

  const contentType = response.headers.get('content-type')?.toLowerCase();
  if(contentType?.startsWith("application/json")) {
    const json = await response.json();
    console.log(json);
  } else {
    const text = await response.text();
    console.log(text);
  }
}


main();
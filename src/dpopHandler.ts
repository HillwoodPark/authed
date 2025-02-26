// TODO(tjohns)
export interface DPoPHandler {
  createProof(method: string, url: string, privateKeyPem: string): string;
};
export class DPoPHandlerImpl implements DPoPHandler {
  createProof(method: string, url: string, privateKeyPem: string): string {
    throw new Error("Method not implemented.");
  }
};

export function createDefaultDPoPHandler() {
  return new DPoPHandlerImpl();
}
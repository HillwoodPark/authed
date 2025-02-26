// TODO(tjohns)
export interface DPopHandler {
  createProof(method: string, url: string, privateKeyPem: string): string;
};
export class DPopHandlerImpl implements DPopHandler {
  createProof(method: string, url: string, privateKeyPem: string): string {
    throw new Error("Method not implemented.");
  }
};

export function createDefaultDPopHandler() {
  return new DPopHandlerImpl();
}
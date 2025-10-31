import { api } from "@/lib/api";
import type { createCredentialSchemaType } from "@/schema/credential";

export async function createCredential(data: createCredentialSchemaType, token: string) {
  return api.credentials.create(data, token);
}

export async function deleteCredential(id: string, token: string) {
  return api.credentials.delete(id, token);
}

export async function getUserCredentials(token: string) {
  return api.credentials.list(token);
}



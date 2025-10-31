import { api } from "@/lib/api";
import { PackId } from "@/lib/billing";

export async function purchaseCredits(packId: PackId, token: string) {
  return api.billing.purchase(packId, token);
}

export async function downloadInvoice(id: string, token: string) {
  return api.billing.invoice(id, token);
}

export async function getUserPurchases(token: string) {
  return api.billing.purchases(token);
}

export async function getAvailableCredits(token: string) {
  return api.billing.getCredits(token);
}



import { isDonateInvoiceUrl } from "@/lib/donate/amount";

export type DonateInvoiceResult = "paid" | "closed" | "unavailable";

type InvoiceHost = {
  openInvoice?: (url: string, callback?: (status: string) => void) => void;
};

export async function openDonateInvoice(
  url: string,
): Promise<DonateInvoiceResult> {
  if (!isDonateInvoiceUrl(url)) {
    return "unavailable";
  }

  try {
    const sdk = await import("@twa-dev/sdk");
    const openInvoice = (sdk.default as InvoiceHost).openInvoice;
    if (typeof openInvoice !== "function") {
      return "unavailable";
    }

    const status = await new Promise<string>((resolve) => {
      openInvoice(url, (next) => {
        resolve(next);
      });
    });
    return status === "paid" ? "paid" : "closed";
  } catch {
    return "unavailable";
  }
}

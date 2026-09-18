import { post } from "@/lib/http-client";

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Default country code applied to local-format numbers (e.g. "0300-1234567") that have no
// country code of their own — this business operates in Pakistan, matching the wa.me format
// already used for NEXT_PUBLIC_WHATSAPP_NUMBER (e.g. "923453397377").
const DEFAULT_COUNTRY_CODE = "92";

// wa.me requires digits only (no "+", spaces, or dashes) with a country code and no leading
// trunk "0". Returns null if the input can't plausibly be a phone number, so callers can block
// the send instead of opening WhatsApp with a broken/empty recipient.
export const normalizePhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (!digitsOnly) return null;

  const normalized = hasPlus
    ? digitsOnly
    : digitsOnly.startsWith("0")
    ? `${DEFAULT_COUNTRY_CODE}${digitsOnly.slice(1)}`
    : digitsOnly;

  return normalized.length >= 10 ? normalized : null;
};

const buildWhatsAppLink = (phoneNumber, message) => `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

// Uploads a generated PDF blob and opens WhatsApp, pre-addressed to phoneNumber, with a message
// containing its public link. phoneNumber must belong to the specific customer/company the file
// is about — callers must resolve it from that party's own record, never a shared/default number.
export const shareFileViaWhatsApp = async ({ blob, fileName, messageTitle, phoneNumber }) => {
  const normalizedPhone = normalizePhoneForWhatsApp(phoneNumber);
  if (!normalizedPhone) {
    throw new Error("No valid WhatsApp number on file for this recipient.");
  }

  const fileBase64 = await blobToBase64(blob);
  const { url } = await post("/api/export/upload", {
    fileBase64,
    fileName,
    fileExtension: "pdf",
  });

  const message = `${messageTitle}\n${url}`;
  window.open(buildWhatsAppLink(normalizedPhone, message), "_blank", "noopener,noreferrer");
};

import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { WhatsAppOutlined, LoadingOutlined } from "@ant-design/icons";
import { useExportFile } from "@/hooks/export";
import { normalizePhoneForWhatsApp, shareFileViaWhatsApp } from "@/lib/whatsapp-share";

// Sends a single sale invoice via WhatsApp. Reuses the same PDF pipeline the Ledger page's
// per-row ExportButton already uses (`/api/ledger/export`, keyed by invoiceNumber = sale id)
// and the same shareFileViaWhatsApp() upload+wa.me link logic — no new export/PDF path.
const SendInvoiceWhatsApp = ({ invoiceNumber, phone, recipientName }) => {
  const [exportParams, setExportParams] = useState(null);
  const { fileBlob, isLoading, isError } = useExportFile(exportParams);

  const sendFile = useCallback(async () => {
    if (!isLoading && fileBlob && exportParams) {
      try {
        const blob = new Blob([fileBlob], { type: "application/pdf" });
        await shareFileViaWhatsApp({
          blob,
          fileName: exportParams.uploadFileName,
          messageTitle: recipientName ? `Invoice - ${recipientName}` : "Invoice",
          phoneNumber: phone,
        });
      } catch (error) {
        message.error("Failed to share invoice via WhatsApp.");
      } finally {
        setExportParams(null);
      }
    }
  }, [isLoading, fileBlob, exportParams, phone, recipientName]);

  useEffect(() => {
    if (!isLoading && !isError) {
      sendFile();
    }
  }, [sendFile, isLoading, isError]);

  const handleClick = () => {
    if (isLoading) return;
    if (!normalizePhoneForWhatsApp(phone)) {
      message.error("This customer has no valid WhatsApp number on file. Add a phone number before sending.");
      return;
    }
    setExportParams({
      fileName: "ledger",
      fileExtension: "pdf",
      invoiceNumber,
      uploadFileName: `sale-invoice-${invoiceNumber}`,
    });
  };

  return isLoading ? (
    <LoadingOutlined className="editBtn" />
  ) : (
    <WhatsAppOutlined className="editBtn" style={{ color: "#25D366" }} onClick={handleClick} />
  );
};

export default SendInvoiceWhatsApp;

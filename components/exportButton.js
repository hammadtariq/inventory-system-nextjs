import { Button, Dropdown, message, Spin } from "antd";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";
import { useExportFile } from "@/hooks/export";
import { useState, useCallback, useEffect } from "react";
import { PRINT_TYPE } from "@/utils/ui.util";
import { useRouter } from "next/router";
import { normalizePhoneForWhatsApp, shareFileViaWhatsApp } from "@/lib/whatsapp-share";

const ExportButton = ({
  filename,
  invoiceNumber,
  id = null,
  onlyIcon = false,
  filters,
  whatsappPhone,
  whatsappRecipientName,
}) => {
  const [exportParams, setExportParams] = useState(null);
  const { fileBlob, isLoading: exportLoading, isError } = useExportFile(exportParams);
  const router = useRouter();
  const isLedgerRoute = router.pathname.includes("/ledger");

  const createLinkAndDownloadFile = useCallback((blob, fileName, fileExtension) => {
    message.info(`Your download will start shortly. Please save the file when prompted.`);
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 1500);
  }, []);

  const exportFile = useCallback(async () => {
    if (!exportLoading && fileBlob && exportParams) {
      try {
        const fileType = exportParams.fileExtension === "pdf" ? "application/pdf" : "text/csv";
        const blob = new Blob([fileBlob], { type: fileType });
        if (exportParams.action === "whatsapp") {
          await shareFileViaWhatsApp({
            blob,
            fileName: exportParams.fileName,
            messageTitle: whatsappRecipientName ? `Ledger Statement - ${whatsappRecipientName}` : "Ledger Statement",
            phoneNumber: whatsappPhone,
          });
        } else {
          createLinkAndDownloadFile(blob, exportParams.fileName, exportParams.fileExtension);
        }
      } catch (error) {
        message.error(
          exportParams.action === "whatsapp" ? "Failed to share file via WhatsApp." : "Error exporting file."
        );
      } finally {
        setExportParams(null);
      }
    }
  }, [exportLoading, fileBlob, exportParams, createLinkAndDownloadFile, whatsappPhone, whatsappRecipientName]);

  useEffect(() => {
    if (!exportLoading && !isError) {
      exportFile();
    }
  }, [exportFile, exportLoading, isError]);

  const handleExport = (fileExtension, typeOf, action = "download") => {
    if (exportLoading) return;
    if (action === "whatsapp" && !normalizePhoneForWhatsApp(whatsappPhone)) {
      message.error("This recipient has no valid WhatsApp number on file. Add a phone number before sending.");
      return;
    }
    setExportParams({ fileName: filename, fileExtension, invoiceNumber, id, filters, typeOf, action });
  };

  const ledgerMenuProps = {
    items: [
      { key: "1", label: "Export as PDF", disabled: exportLoading, onClick: () => handleExport("pdf") },
      { key: "2", label: "Export as CSV", disabled: exportLoading, onClick: () => handleExport("csv") },
      {
        key: "3",
        label: "Send via WhatsApp",
        disabled: exportLoading,
        onClick: () => handleExport("pdf", null, "whatsapp"),
      },
    ],
  };

  const fullMenuProps = {
    items: [
      {
        key: "with_rates",
        label: PRINT_TYPE.WITH_RATES,
        children: [
          {
            key: "pdf_with_rates",
            label: "Export as PDF",
            disabled: exportLoading,
            onClick: () => handleExport("pdf", PRINT_TYPE.WITH_RATES),
          },
          {
            key: "csv_with_rates",
            label: "Export as CSV",
            disabled: exportLoading,
            onClick: () => handleExport("csv", PRINT_TYPE.WITH_RATES),
          },
        ],
      },
      {
        key: "without_rates",
        label: PRINT_TYPE.WITHOUT_RATES,
        children: [
          {
            key: "pdf_without_rates",
            label: "Export as PDF",
            disabled: exportLoading,
            onClick: () => handleExport("pdf", PRINT_TYPE.WITHOUT_RATES),
          },
          {
            key: "csv_without_rates",
            label: "Export as CSV",
            disabled: exportLoading,
            onClick: () => handleExport("csv", PRINT_TYPE.WITHOUT_RATES),
          },
        ],
      },
    ],
  };

  return (
    <Dropdown menu={isLedgerRoute ? ledgerMenuProps : fullMenuProps} trigger={["click"]}>
      {onlyIcon ? (
        exportLoading ? (
          <LoadingOutlined />
        ) : (
          <DownloadOutlined />
        )
      ) : (
        <Button type="primary" icon={exportLoading ? <Spin /> : <DownloadOutlined />} disabled={exportLoading}>
          {exportLoading ? "Exporting..." : "Export"}
        </Button>
      )}
    </Dropdown>
  );
};

export default ExportButton;

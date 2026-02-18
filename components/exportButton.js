import { Button, Dropdown, Menu, message, Spin } from "antd";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";
import { useExportFile } from "@/hooks/export";
import { useState, useCallback, useEffect } from "react";
import { PRINT_TYPE } from "@/utils/ui.util";
import { useRouter } from "next/router";

const ExportButton = ({ filename, invoiceNumber, id = null, onlyIcon = false, filters }) => {
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

  const exportFile = useCallback(() => {
    if (!exportLoading && fileBlob && exportParams) {
      try {
        const fileType = exportParams.fileExtension === "pdf" ? "application/pdf" : "text/csv";
        const blob = new Blob([fileBlob], { type: fileType });
        createLinkAndDownloadFile(blob, exportParams.fileName, exportParams.fileExtension);
      } catch (error) {
        message.error("Error exporting file.");
      } finally {
        setExportParams(null);
      }
    }
  }, [exportLoading, fileBlob, exportParams, createLinkAndDownloadFile]);

  useEffect(() => {
    if (!exportLoading && !isError) {
      exportFile();
    }
  }, [exportFile, exportLoading, isError]);

  const handleExport = (fileExtension, typeOf) => {
    if (!exportLoading) {
      setExportParams({ fileName: filename, fileExtension, invoiceNumber, id, filters, typeOf });
    }
  };

  const menu = (
    <Menu>
      {isLedgerRoute ? (
        <>
          <Menu.Item key="1" onClick={() => handleExport("pdf")} disabled={exportLoading}>
            Export as PDF
          </Menu.Item>
          <Menu.Item key="2" onClick={() => handleExport("csv")} disabled={exportLoading}>
            Export as CSV
          </Menu.Item>
        </>
      ) : (
        <>
          <Menu.SubMenu key="with_rates" title={PRINT_TYPE.WITH_RATES}>
            <Menu.Item
              key="pdf_with_rates"
              onClick={() => handleExport("pdf", PRINT_TYPE.WITH_RATES)}
              disabled={exportLoading}
            >
              Export as PDF
            </Menu.Item>
            <Menu.Item
              key="csv_with_rates"
              onClick={() => handleExport("csv", PRINT_TYPE.WITH_RATES)}
              disabled={exportLoading}
            >
              Export as CSV
            </Menu.Item>
          </Menu.SubMenu>

          <Menu.SubMenu key="without_rates" title={PRINT_TYPE.WITHOUT_RATES}>
            <Menu.Item
              key="pdf_without_rates"
              onClick={() => handleExport("pdf", PRINT_TYPE.WITHOUT_RATES)}
              disabled={exportLoading}
            >
              Export as PDF
            </Menu.Item>
            <Menu.Item
              key="csv_without_rates"
              onClick={() => handleExport("csv", PRINT_TYPE.WITHOUT_RATES)}
              disabled={exportLoading}
            >
              Export as CSV
            </Menu.Item>
          </Menu.SubMenu>
        </>
      )}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
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

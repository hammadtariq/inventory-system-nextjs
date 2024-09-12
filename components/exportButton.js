import { Button, Dropdown, Menu, message, Spin } from "antd";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";
import { useExportFile } from "@/hooks/export";
import { useState, useCallback, useEffect } from "react";

const ExportButton = ({ filename, invoiceNumber, id = null, onlyIcon = false }) => {
  const [exportParams, setExportParams] = useState(null);
  const { fileBlob, isLoading: exportLoading, isError } = useExportFile(exportParams);

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

  const handleExport = (fileExtension) => {
    if (!exportLoading) {
      setExportParams({ fileName: filename, fileExtension, invoiceNumber, id });
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => handleExport("pdf")} disabled={exportLoading}>
        Export as PDF
      </Menu.Item>
      <Menu.Item key="2" onClick={() => handleExport("csv")} disabled={exportLoading}>
        Export as CSV
      </Menu.Item>
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

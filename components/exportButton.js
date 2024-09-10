import { Button, Dropdown, Menu, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useExportFile } from "@/hooks/export";
import { useState, useEffect } from "react";

const ExportButton = ({ filename, invoiceNumber, onlyIcon = false }) => {
  const [exportParams, setExportParams] = useState(null);
  const { fileBlob, isLoading: exportLoading, isError } = useExportFile(exportParams);

  useEffect(() => {
    if (fileBlob && exportParams) {
      try {
        const fileType = exportParams.fileExtension === "pdf" ? "application/pdf" : "text/csv";
        const newBlob = new Blob([fileBlob], { type: fileType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(newBlob);
        link.download = `${exportParams.fileName}.${exportParams.fileExtension}`;
        link.click();
        URL.revokeObjectURL(link.href);
        message.success(`Exported successfully as ${exportParams.fileExtension.toUpperCase()}`);
      } catch (error) {
        message.error("Error exporting file.");
      } finally {
        setExportParams(null); // Reset parameters after export attempt
      }
    }
  }, [fileBlob, exportParams]);

  const handleExport = (fileExtension) => {
    setExportParams({ fileName: filename, fileExtension, invoiceNumber });
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => handleExport("pdf")}>
        Export as PDF
      </Menu.Item>
      <Menu.Item key="2" onClick={() => handleExport("csv")}>
        Export as CSV
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      {onlyIcon ? (
        <DownloadOutlined />
      ) : (
        <Button type="primary" icon={<DownloadOutlined />}>
          Export
        </Button>
      )}
    </Dropdown>
  );
};

export default ExportButton;

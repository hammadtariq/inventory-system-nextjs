import { Button, message, Dropdown, Menu } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { downloadFile } from "@/utils/ui.util";

const ExportButton = ({ handleExport, filename, invoiceNumber, onlyIcon = false }) => {
  const _handleExport = async (fileExtension) => {
    await handleExport(filename, fileExtension, invoiceNumber);
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => _handleExport("pdf")}>
        Export as PDF
      </Menu.Item>
      <Menu.Item key="2" onClick={() => _handleExport("csv")}>
        Export as CSV
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      {onlyIcon ? (
        <DownloadOutlined type="primary" />
      ) : (
        <Button type="primary" icon={<DownloadOutlined />}>
          Export
        </Button>
      )}
    </Dropdown>
  );
};

export default ExportButton;

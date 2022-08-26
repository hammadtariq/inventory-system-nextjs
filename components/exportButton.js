import { Button, message } from "antd";

import { downloadFile } from "@/utils/ui.util";

const ExportButton = ({ handleExport, filename }) => {
  const _handleExport = async () => {
    const response = await handleExport();
    if (response) {
      downloadFile(response, filename);
    } else {
      message.error("Export failed, please try again later");
    }
  };
  return (
    <Button type="primary" onClick={_handleExport}>
      Export to Excel
    </Button>
  );
};

export default ExportButton;

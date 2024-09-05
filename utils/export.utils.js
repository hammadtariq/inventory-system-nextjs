import { exportFile } from "@/hooks/export";
import { message } from "antd";
export const exportFunc = async (fileName, type, transactions) => {
  try {
    const data = {
      type: type,
      data: transactions.rows ? transactions.rows : transactions,
    };
    const blob = await exportFile(fileName, data);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'pdf' ? `${fileName}.pdf` : `${fileName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success(`Exported successfully as ${type.toUpperCase()}`);
  } catch (error) {
    console.error('Error exporting file:', error);
        message.error("Export failed, please try again later");
  }
};

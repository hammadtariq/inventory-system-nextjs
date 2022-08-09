import { exportInventory } from "@/hooks/inventory";
import { read, utils } from "xlsx";
import { Button } from "antd";

const ExportToExcel = () => {
  const handleExport = async () => {
    //   const searchResults = read(await (await exportInventory()).arrayBuffer());
    const searchResults = await exportInventory();
    console.log(searchResults);
  };
  return <Button onClick={handleExport}>Export to Excel</Button>;
};

export default ExportToExcel;

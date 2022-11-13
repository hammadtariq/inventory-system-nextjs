import { getReport } from "@/hooks/reports";
import AppTitle from "@/components/title";
import SelectCompany from "@/components/selectCompany";
import { useCallback, useState } from "react";
import { Button, Card, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import AppTable from "@/components/table";
import dayjs from "dayjs";
import styles from "@/styles/Ledger.module.css";
import { DATE_FORMAT } from "@/utils/ui.util";
const columns = [
  {
    title: "Product Name",
    dataIndex: "purchasedProducts",
    key: "id",
    render: (_, { purchasedProducts }) => (
      <>
        {purchasedProducts.map((item) => (
          <>{item.itemName}</>
        ))}
      </>
    ),
  },
  {
    title: "Id",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Company Name",
    dataIndex: ["company", "companyName"],
    key: "companyName",
  },
  { title: "Invoice Total Amount (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
  { title: "Bale Type", dataIndex: "baleType", key: "baleType" },
  {
    title: "No. Of Bales",
    dataIndex: "purchasedProducts",
    key: "noOfBales",
    render: (_, { purchasedProducts }) => (
      <>
        {purchasedProducts.map((item) => (
          <>{item.noOfBales ?? "N/A"}</>
        ))}
      </>
    ),
  },
  {
    title: "Rate per Bale",
    dataIndex: "purchasedProducts",
    key: "ratePerBale",
    render: (_, { purchasedProducts }) => (
      <>
        {purchasedProducts.map((item) => (
          <>{item.ratePerBale ?? "N/A"}</>
        ))}
      </>
    ),
  },
  { title: "Invoice Number", dataIndex: "invoiceNumber", key: "invoiceNumber", render: (text) => text ?? "N/A" },
  { title: "Sur Charge (Rs)", dataIndex: "surCharge", key: "surCharge", render: (text) => text ?? "N/A" },
  {
    title: "Purchase Date",
    dataIndex: "purchaseDate",
    key: "purchaseDate",
    render: (text) => dayjs(text).format(DATE_FORMAT),
  },
];

export default function Reports() {
  const [companyId, setCompanyId] = useState(null);
  const [report, setReport] = useState(false);
  const selectCompanyOnChange = useCallback((id) => setCompanyId(id), [companyId]);
  const handleReport = async () => {
    const data = await getReport(companyId);
    setReport(data);
  };

  const renderSummary = () => (
    <div className={styles.rowDirectionTableContainer}>
      <div className={styles.headingStyle}>Total Products :</div>
      <div className={styles.contentStyle}>{`${report.products ? report.products.length : 0}`}</div>
    </div>
  );

  return (
    <div>
      <div className="container">
        <AppTitle level={2}>Reports</AppTitle>

        <Space>
          <SelectCompany selectCompanyOnChange={selectCompanyOnChange} />
          <Button onClick={handleReport}>Generate</Button>
        </Space>
      </div>

      {!report && (
        <Card className="generate-report">
          <ReloadOutlined />
        </Card>
      )}

      {report && (
        <AppTable
          rowKey="id"
          className="components-table-demo-nested"
          columns={columns}
          dataSource={report ? report.data : []}
          footer={renderSummary}
        />
      )}
    </div>
  );
}

import { getReport } from "@/hooks/reports";
import AppTitle from "@/components/title";
import { useState, useEffect } from "react";
import { Button, Empty, Space } from "antd";
import AppTable from "@/components/table";
import styles from "@/styles/Ledger.module.css";
const columns = [
  {
    title: "Company Name",
    dataIndex: "company",
    key: "company",
    render: (text) => text ?? "N/A",
  },
  {
    title: "Total Bales",
    dataIndex: "onHand",
    key: "onHand",
  },
  { title: "Total Cost of Inventory on Hand (Rs)", dataIndex: "totalAmount", key: "totalAmount" },
];

export default function Reports() {
  const [report, setReport] = useState(false);

  const fetchReport = async () => {
    const data = await getReport();
    if (data) setReport(data);
  };
  useEffect(() => {
    fetchReport();
  }, []);

  const renderSummary = () => (
    <div className={styles.rowDirectionTableContainer}>
      <div className={styles.headingStyle}>Total Bales in Godown :</div>
      <div className={styles.contentStyle}>{`${report.total ? report.total.totalBales : 0}`}</div>
      <div className={styles.headingStyle}>Total Cost of Inventory On hand :</div>
      <div className={styles.contentStyle}>{`${report.total ? report.total.totalCost : 0}`}</div>
    </div>
  );

  return (
    <div>
      <div className="container">
        <AppTitle level={2}>Reports</AppTitle>
      </div>

      {!report && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}

      {report && (
        <AppTable
          rowKey="id"
          className="components-table-demo-nested"
          columns={columns}
          dataSource={report ? report.content : []}
          footer={renderSummary}
        />
      )}
    </div>
  );
}

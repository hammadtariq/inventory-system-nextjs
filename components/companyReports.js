import { getReport } from "@/hooks/reports";
import { useState, useEffect } from "react";
import { Button, Card, Col, Empty, Row, Statistic } from "antd";
import { FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import AppTable from "@/components/table";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import { exportReportToPDF } from "@/utils/export.utils";
import styles from "@/styles/Report.module.css";

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
  {
    title: "Total Cost of Inventory on Hand (Rs)",
    dataIndex: "totalAmount",
    key: "totalAmount",
    render: (v) => comaSeparatedValues(v),
  },
];

export default function CompanyReports() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    getReport().then((data) => {
      if (data) setReport(data);
    });
  }, []);

  const handleExportPDF = () => {
    exportReportToPDF({
      title: "INVENTORY REPORT",
      columns: [
        { header: "SL", dataKey: "sl", width: 12, halign: "center" },
        { header: "Company Name", dataKey: "company", width: 80 },
        { header: "Total Bales", dataKey: "onHand", width: 40, halign: "center" },
        { header: "Total Cost (Rs)", dataKey: "totalAmount", width: 50, halign: "right" },
      ],
      rows: report?.content || [],
      summary: [
        { label: "Total Bales in Godown", value: report?.total?.totalBales || 0 },
        { label: "Total Cost on Hand", value: report?.total?.totalCost || 0 },
      ],
    });
  };

  const handleExportExcel = () => {
    const excelRows = (report?.content || []).map((row, idx) => ({
      SL: idx + 1,
      "Company Name": row.company ?? "N/A",
      "Total Bales": row.onHand,
      "Total Cost (Rs)": row.totalAmount,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");

    const summaryStart = excelRows.length + 3;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ["Total Bales in Godown", report?.total?.totalBales || 0],
        ["Total Cost on Hand", report?.total?.totalCost || 0],
      ],
      { origin: `A${summaryStart}` }
    );

    XLSX.writeFile(wb, `inventory_report_${Date.now()}.xlsx`);
  };

  return (
    <div className={styles.container}>
      {report && (
        <Row gutter={[16, 16]} className={styles.summaryCards}>
          <Col xs={24} sm={12}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic title="Total Bales in Godown" value={comaSeparatedValues(report.total?.totalBales || 0)} />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card bordered={false} className={styles.statCard}>
              <Statistic title="Total Cost on Hand (Rs)" value={comaSeparatedValues(report.total?.totalCost || 0)} />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        className={styles.filterCard}
        title={<span className={styles.filterTitle}>Inventory by Company</span>}
        extra={
          report && (
            <div className={styles.exportButtons}>
              <Button type="primary" danger icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                PDF
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                style={{ backgroundColor: "#217346", borderColor: "#217346" }}
              >
                Excel
              </Button>
            </div>
          )
        }
      >
        {!report ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <AppTable rowKey="companyId" columns={columns} dataSource={report.content} />
        )}
      </Card>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { Button, Card, Col, DatePicker, Row, Statistic } from "antd";
import { FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import AppTable from "./table";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import { exportReportToPDF } from "@/utils/export.utils";
import { get } from "@/lib/http-client";
import styles from "@/styles/Report.module.css";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { RangePicker } = DatePicker;
const startToTodayDate = [dayjs().startOf("month"), dayjs().endOf("month")];

const columns = [
  { title: "Customer Name", dataIndex: "name", key: "name" },
  { title: "Email", dataIndex: "email", key: "email" },
  { title: "Phone", dataIndex: "phone", key: "phone" },
  { title: "Address", dataIndex: "address", key: "address" },
  { title: "Total Invoices", dataIndex: "totalInvoices", key: "totalInvoices" },
  {
    title: "Total Amount (Rs)",
    dataIndex: "totalAmount",
    key: "totalAmount",
    render: (v) => comaSeparatedValues(v),
  },
];

const CustomersReport = () => {
  const [dateRange, setDateRange] = useState(startToTodayDate);
  const [rows, setRows] = useState([]);
  const [reportTotal, setReportTotal] = useState({ grandTotal: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const [start, end] = dateRange ? dateRange.map((d) => d.format("YYYY-MM-DD")) : startToTodayDate;
    setLoading(true);
    try {
      const params = new URLSearchParams({ dateRangeStart: start, dateRangeEnd: end });
      const data = await get(`/api/customer/report?${params.toString()}`);
      setRows(data.rows || []);
      setReportTotal(data.total || { grandTotal: 0, totalCustomers: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPDF = () => {
    const dateFrom = dateRange ? dateRange[0].format("DD-MM-YYYY") : "";
    const dateTo = dateRange ? dateRange[1].format("DD-MM-YYYY") : "";

    exportReportToPDF({
      title: "CUSTOMER REPORT",
      dateRange: [`From Date: ${dateFrom}`, `To Date: ${dateTo}`],
      columns: [
        { header: "SL", dataKey: "sl", width: 10, halign: "center" },
        { header: "Customer Name", dataKey: "name", width: 40 },
        { header: "Email", dataKey: "email", width: 45 },
        { header: "Phone", dataKey: "phone", width: 28 },
        { header: "Invoices", dataKey: "totalInvoices", width: 18, halign: "center" },
        { header: "Total Amount", dataKey: "totalAmount", width: 31, halign: "right" },
      ],
      rows,
      summary: [
        { label: "Total Customers", value: reportTotal.totalCustomers },
        { label: "Grand Total", value: reportTotal.grandTotal },
      ],
    });
  };

  const handleExportExcel = () => {
    const excelRows = rows.map((row, idx) => ({
      SL: idx + 1,
      "Customer Name": row.name,
      Email: row.email,
      Phone: row.phone,
      Address: row.address,
      "Total Invoices": row.totalInvoices,
      "Total Amount": row.totalAmount,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customer Report");

    const summaryStart = excelRows.length + 3;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ["Total Customers", reportTotal.totalCustomers],
        ["Grand Total", reportTotal.grandTotal],
      ],
      { origin: `A${summaryStart}` }
    );

    XLSX.writeFile(wb, `customer_report_${Date.now()}.xlsx`);
  };

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} className={styles.summaryCards}>
        <Col xs={24} sm={12}>
          <Card className={styles.statCard}>
            <Statistic title="Total Customers" value={reportTotal.totalCustomers} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className={styles.statCard}>
            <Statistic title="Grand Total Amount (Rs)" value={comaSeparatedValues(reportTotal.grandTotal || 0)} />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card
        className={styles.filterCard}
        title={<span className={styles.filterTitle}>Filters</span>}
        extra={
          <div className={styles.exportButtons}>
            <Button type="primary" danger icon={<FilePdfOutlined />} onClick={handleExportPDF} disabled={!rows.length}>
              PDF
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              disabled={!rows.length}
              style={{ backgroundColor: "#217346", borderColor: "#217346" }}
            >
              Excel
            </Button>
          </div>
        }
      >
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={8}>
            <div className={styles.filterLabel}>Date Range</div>
            <RangePicker style={{ width: "100%" }} value={dateRange} onChange={(newRange) => setDateRange(newRange)} />
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <AppTable columns={columns} dataSource={rows} isLoading={loading} rowKey="id" totalCount={rows.length} />
    </div>
  );
};

export default CustomersReport;

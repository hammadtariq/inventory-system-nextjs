import React, { useEffect, useState, useCallback } from "react";
import { Button, Card, Col, DatePicker, InputNumber, Row, Statistic } from "antd";
import { FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import styles from "@/styles/Report.module.css";
import SearchInput from "./SearchInput";
import { searchCompany } from "@/hooks/company";
import { searchItems } from "@/hooks/items";
import dayjs from "dayjs";
import AppTable from "./table";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import { exportReportToPDF } from "@/utils/export.utils";
import { getAllPurchaseForReport } from "@/hooks/purchase";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { RangePicker } = DatePicker;
const startToTodayDate = [dayjs().startOf("month"), dayjs().endOf("month")];
const tableFooterKeys = ["totalAmount", "ratePerBale", "ratePerLbs", "ratePerKgs", "noOfBales"];

const getFooterLabel = (key) => key.replace(/([A-Z])/g, " $1").toUpperCase();

const columns = [
  { title: "Invoice NO", dataIndex: "invoiceNo", key: "invoiceNo" },
  { title: "ITEM NAME", dataIndex: "itemName", key: "itemName" },
  { title: "COMPANY", dataIndex: "company", key: "company" },
  {
    title: "Bale Weight (LBS)",
    dataIndex: "baleWeightLbs",
    key: "baleWeightLbs",
    render: (value) => (value === "-" ? value : comaSeparatedValues(value)),
  },
  {
    title: "Bale Weight (KGS)",
    dataIndex: "baleWeightKgs",
    key: "baleWeightKgs",
    render: (value) => (value === "-" ? value : comaSeparatedValues(value)),
  },
  {
    title: "Rate Per (LBS)",
    dataIndex: "ratePerLbs",
    key: "ratePerLbs",
    render: (value) => (value === "-" ? value : comaSeparatedValues(value)),
  },
  {
    title: "Rate Per (KGS)",
    dataIndex: "ratePerKgs",
    key: "ratePerKgs",
    render: (value) => (value === "-" ? value : comaSeparatedValues(value)),
  },
  {
    title: "Rate Per Bale",
    dataIndex: "ratePerBale",
    key: "ratePerBale",
    render: (value) => (value === "-" ? value : comaSeparatedValues(value)),
  },
  {
    title: "No Of Bales",
    dataIndex: "noOfBales",
    key: "noOfBales",
    render: (value) => (value === "-" ? value : comaSeparatedValues(value)),
  },
  {
    title: "Sur Charge",
    dataIndex: "surCharge",
    key: "surCharge",
    render: (value) => comaSeparatedValues(value),
  },
  { title: "Purchase Date", dataIndex: "purchaseDate", key: "purchaseDate" },
];

const PurchaseReport = () => {
  const [searchCriteria, setSearchCriteria] = useState({ mostBoughten: false, company: "", item: "" });
  const [searchLabels, setSearchLabels] = useState({ company: "" });
  const [dateRange, setDateRange] = useState(startToTodayDate);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_LIMIT);
  const [updatedPurchase, setUpdatedPurchase] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState({});

  const transformData = (purchaseData) =>
    purchaseData.flatMap(({ id: invoiceNo, surCharge, purchaseDate, totalAmount, purchasedProducts, company }) =>
      purchasedProducts.map(
        ({ itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale }) => ({
          invoiceNo,
          surCharge: surCharge ?? 0,
          purchaseDate: new Date(purchaseDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          totalAmount,
          itemName,
          company: company?.companyName,
          noOfBales: noOfBales || "-",
          baleWeightLbs: baleWeightLbs || "-",
          baleWeightKgs: baleWeightKgs || "-",
          ratePerBale: ratePerBale || "-",
          ratePerLbs: ratePerLbs || "-",
          ratePerKgs: ratePerKgs || "-",
        })
      )
    );

  const handlePagination = (newPageSize, offset) => {
    setPageSize(newPageSize);
    setCurrentPage(offset / newPageSize + 1);
  };

  const handleSearch = async (value, type) => {
    if (!value) {
      setSearchCriteria((prev) => ({ ...prev, [type]: "" }));
      return;
    }
    return type === "company" ? await searchCompany(value) : await searchItems(value);
  };

  const handleSelect = (id, type, label) => {
    setSearchCriteria((prev) => ({ ...prev, [type]: id }));
    if (type === "company" && label) setSearchLabels((prev) => ({ ...prev, company: label }));
  };

  const fetchPurchaseData = useCallback(async () => {
    const [start, end] = dateRange ? dateRange.map((d) => d.format("YYYY-MM-DD")) : startToTodayDate;
    const purchaseResults = await getAllPurchaseForReport({
      ...searchCriteria,
      dateRangeStart: start,
      dateRangeEnd: end,
    });
    const transformedData = transformData(purchaseResults.rows);
    const totals = transformedData.reduce((acc, purchase) => {
      if (!acc.processedInvoiceNos) acc.processedInvoiceNos = new Set();
      if (!acc.processedInvoiceNos.has(purchase.invoiceNo)) {
        acc.processedInvoiceNos.add(purchase.invoiceNo);
        if (typeof purchase.totalAmount === "number") {
          acc.totalAmount = (acc.totalAmount || 0) + purchase.totalAmount;
        }
      }
      Object.keys(purchase).forEach((key) => {
        if (key !== "totalAmount" && typeof purchase[key] === "number") {
          acc[key] = (acc[key] || 0) + purchase[key];
        }
      });
      return acc;
    }, {});

    setUpdatedPurchase(transformedData);
    setTotal(totals);
  }, [dateRange, searchCriteria]);

  useEffect(() => {
    fetchPurchaseData();
  }, [fetchPurchaseData]);

  const uniqueInvoiceCount = new Set(updatedPurchase.map((r) => r.invoiceNo)).size;

  const handleExportPDF = () => {
    const dateFrom = dateRange ? dateRange[0].format("DD-MM-YYYY") : "";
    const dateTo = dateRange ? dateRange[1].format("DD-MM-YYYY") : "";

    exportReportToPDF({
      title: "PURCHASE REPORT",
      dateRange: [`From Date: ${dateFrom}`, `To Date: ${dateTo}`],
      filterLabel: searchLabels.company ? [`Supplier: ${searchLabels.company}`] : undefined,
      columns: [
        { header: "SL", dataKey: "sl", width: 10, halign: "center" },
        { header: "Date", dataKey: "purchaseDate", width: 22 },
        { header: "Invoice", dataKey: "invoiceNo", width: 20 },
        { header: "Supplier", dataKey: "company", width: 32 },
        { header: "Item", dataKey: "itemName", width: 40 },
        { header: "No. of Bales", dataKey: "noOfBales", width: 22, halign: "center" },
        { header: "Sur Charge", dataKey: "surCharge", width: 18, halign: "right" },
        { header: "Total Amount", dataKey: "totalAmount", width: 28, halign: "right" },
      ],
      rows: updatedPurchase,
      summary: [
        { label: "Total Invoices", value: uniqueInvoiceCount },
        { label: "Total Bales", value: total.noOfBales || 0 },
        { label: "Total Amount", value: total.totalAmount || 0 },
      ],
    });
  };

  const handleExportExcel = () => {
    const excelRows = updatedPurchase.map((row, idx) => ({
      SL: idx + 1,
      Date: row.purchaseDate,
      Invoice: row.invoiceNo,
      Supplier: row.company,
      "Item Name": row.itemName,
      "No. of Bales": row.noOfBales,
      "Bale Weight (LBS)": row.baleWeightLbs,
      "Bale Weight (KGS)": row.baleWeightKgs,
      "Rate Per LBS": row.ratePerLbs,
      "Rate Per KGS": row.ratePerKgs,
      "Rate Per Bale": row.ratePerBale,
      "Sur Charge": row.surCharge,
      "Total Amount": row.totalAmount,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Report");

    const summaryStart = excelRows.length + 3;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ["Total Invoices", uniqueInvoiceCount],
        ["Total Bales", total.noOfBales || 0],
        ["Total Amount", total.totalAmount || 0],
      ],
      { origin: `A${summaryStart}` }
    );

    XLSX.writeFile(wb, `purchase_report_${Date.now()}.xlsx`);
  };

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <Row gutter={[16, 16]} className={styles.summaryCards}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className={styles.statCard}>
            <Statistic title="Total Invoices" value={uniqueInvoiceCount} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className={styles.statCard}>
            <Statistic title="Total Bales" value={comaSeparatedValues(total.noOfBales || 0)} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className={styles.statCard}>
            <Statistic title="Total Amount (Rs)" value={comaSeparatedValues(total.totalAmount || 0)} />
          </Card>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card
        className={styles.filterCard}
        title={<span className={styles.filterTitle}>Filters</span>}
        extra={
          <div className={styles.exportButtons}>
            <Button
              type="primary"
              danger
              icon={<FilePdfOutlined />}
              onClick={handleExportPDF}
              disabled={!updatedPurchase.length}
            >
              PDF
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              disabled={!updatedPurchase.length}
              style={{ backgroundColor: "#217346", borderColor: "#217346" }}
            >
              Excel
            </Button>
          </div>
        }
      >
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={8}>
            <div className={styles.filterLabel}>Company</div>
            <SearchInput
              valueKey="companyName"
              placeholder="Search company..."
              handleSearch={(value) => handleSearch(value, "company")}
              handleSelect={(id, label) => handleSelect(id, "company", label)}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div className={styles.filterLabel}>Item</div>
            <SearchInput
              valueKey="itemName"
              valueKey2="company.companyName"
              placeholder="Search item..."
              type="item"
              handleSearch={(value) => handleSearch(value, "item")}
              handleSelect={(id) => handleSelect(id, "item")}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div className={styles.filterLabel}>Date Range</div>
            <RangePicker style={{ width: "100%" }} value={dateRange} onChange={(newRange) => setDateRange(newRange)} />
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <AppTable
        columns={columns}
        dataSource={updatedPurchase}
        paginationHandler={handlePagination}
        pageSize={pageSize}
        rowKey={(record, idx) => `${record.invoiceNo}_${idx}`}
        rowClassName={styles.editableRow}
        totalCount={updatedPurchase ? updatedPurchase.length : 0}
        footer={() => (
          <div className={styles.tableFooterSummary}>
            {tableFooterKeys.map((key) => (
              <div className={styles.tableFooterItem} key={key}>
                <strong>{getFooterLabel(key)}:</strong>
                <InputNumber
                  value={comaSeparatedValues(total[key] || 0)}
                  readOnly
                  className={styles.inputNumberField}
                />
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
};

export default PurchaseReport;

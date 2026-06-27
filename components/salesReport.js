import React, { useEffect, useState, useCallback } from "react";
import { Button, Card, Col, DatePicker, InputNumber, Row, Statistic } from "antd";
import { FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import styles from "@/styles/Report.module.css";
import SearchInput from "./SearchInput";
import { getAllSalesForReport, searchSales } from "@/hooks/sales";
import { searchCompany } from "@/hooks/company";
import { searchItems } from "@/hooks/items";
import dayjs from "dayjs";
import AppTable from "./table";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import { exportReportToPDF } from "@/utils/export.utils";
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
  { title: "CUSTOMER", dataIndex: "customer", key: "customer" },
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
    title: "Labour Charge",
    dataIndex: "laborCharge",
    key: "laborCharge",
    render: (value) => comaSeparatedValues(value),
  },
  { title: "Sold Date", dataIndex: "soldDate", key: "soldDate" },
];

const SalesReport = () => {
  const [searchCriteria, setSearchCriteria] = useState({ customer: "", company: "", item: "" });
  const [searchLabels, setSearchLabels] = useState({ customer: "", company: "" });
  const [dateRange, setDateRange] = useState(startToTodayDate);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_LIMIT);
  const [updatedSales, setUpdatedSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState({});

  const transformData = (salesData) =>
    salesData.flatMap(({ id: invoiceNo, customer, laborCharge, soldDate, totalAmount, soldProducts }) =>
      soldProducts.map(
        ({ itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale, company }) => ({
          customer: `${customer?.firstName} ${customer?.lastName}`,
          invoiceNo,
          laborCharge,
          soldDate: new Date(soldDate).toLocaleDateString("en-US", {
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
    return type === "company"
      ? await searchCompany(value)
      : type === "item"
      ? await searchItems(value)
      : await searchSales(value);
  };

  const handleSelect = (id, type, label) => {
    setSearchCriteria((prev) => ({ ...prev, [type]: id }));
    if (label && (type === "customer" || type === "company")) {
      setSearchLabels((prev) => ({ ...prev, [type]: label }));
    }
  };

  const fetchSalesData = useCallback(async () => {
    const [start, end] = dateRange ? dateRange.map((d) => d.format("YYYY-MM-DD")) : startToTodayDate;
    const salesResults = await getAllSalesForReport({
      ...searchCriteria,
      dateRangeStart: start,
      dateRangeEnd: end,
    });
    const transformedData = transformData(salesResults.rows);
    const totals = transformedData.reduce((acc, sale) => {
      if (!acc.processedInvoiceNos) acc.processedInvoiceNos = new Set();
      if (!acc.processedInvoiceNos.has(sale.invoiceNo)) {
        acc.processedInvoiceNos.add(sale.invoiceNo);
        if (typeof sale.totalAmount === "number") {
          acc.totalAmount = (acc.totalAmount || 0) + sale.totalAmount;
        }
      }
      Object.keys(sale).forEach((key) => {
        if (key !== "totalAmount" && typeof sale[key] === "number") {
          acc[key] = (acc[key] || 0) + sale[key];
        }
      });
      return acc;
    }, {});

    setUpdatedSales(transformedData);
    setTotal(totals);
  }, [dateRange, searchCriteria]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const uniqueInvoiceCount = new Set(updatedSales.map((r) => r.invoiceNo)).size;

  const handleExportPDF = () => {
    const dateFrom = dateRange ? dateRange[0].format("DD-MM-YYYY") : "";
    const dateTo = dateRange ? dateRange[1].format("DD-MM-YYYY") : "";

    const filterLines = [];
    if (searchLabels.customer) filterLines.push(`Customer: ${searchLabels.customer}`);
    if (searchLabels.company) filterLines.push(`Company: ${searchLabels.company}`);

    exportReportToPDF({
      title: "SALE REPORT",
      dateRange: [`From Date: ${dateFrom}`, `To Date: ${dateTo}`],
      filterLabel: filterLines.length ? filterLines : undefined,
      columns: [
        { header: "SL", dataKey: "sl", width: 10, halign: "center" },
        { header: "Date", dataKey: "soldDate", width: 22 },
        { header: "Invoice", dataKey: "invoiceNo", width: 20 },
        { header: "Customer", dataKey: "customer", width: 30 },
        { header: "Item", dataKey: "itemName", width: 35 },
        { header: "Company", dataKey: "company", width: 28 },
        { header: "No. of Bales", dataKey: "noOfBales", width: 22, halign: "center" },
        { header: "Total Amount", dataKey: "totalAmount", width: 25, halign: "right" },
      ],
      rows: updatedSales,
      summary: [
        { label: "Total Invoices", value: uniqueInvoiceCount },
        { label: "Total Bales", value: total.noOfBales || 0 },
        { label: "Total Amount", value: total.totalAmount || 0 },
      ],
    });
  };

  const handleExportExcel = () => {
    const excelRows = updatedSales.map((row, idx) => ({
      SL: idx + 1,
      Date: row.soldDate,
      Invoice: row.invoiceNo,
      Customer: row.customer,
      "Item Name": row.itemName,
      Company: row.company,
      "No. of Bales": row.noOfBales,
      "Bale Weight (LBS)": row.baleWeightLbs,
      "Bale Weight (KGS)": row.baleWeightKgs,
      "Rate Per LBS": row.ratePerLbs,
      "Rate Per KGS": row.ratePerKgs,
      "Rate Per Bale": row.ratePerBale,
      "Labour Charge": row.laborCharge,
      "Total Amount": row.totalAmount,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

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

    XLSX.writeFile(wb, `sale_report_${Date.now()}.xlsx`);
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
              disabled={!updatedSales.length}
            >
              PDF
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              disabled={!updatedSales.length}
              style={{ backgroundColor: "#217346", borderColor: "#217346" }}
            >
              Excel
            </Button>
          </div>
        }
      >
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={8}>
            <div className={styles.filterLabel}>Customer</div>
            <SearchInput
              valueKey="firstName"
              valueKey2="lastName"
              placeholder="Search customer..."
              handleSearch={(value) => handleSearch(value, "customer")}
              handleSelect={(id, label) => handleSelect(id, "customer", label)}
            />
          </Col>
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
        dataSource={updatedSales}
        paginationHandler={handlePagination}
        pageSize={pageSize}
        rowKey={(record, idx) => `${record.invoiceNo}_${idx}`}
        rowClassName={styles.editableRow}
        totalCount={updatedSales ? updatedSales.length : 0}
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

export default SalesReport;

import React, { useEffect, useState, useCallback } from "react";
import { InputNumber, Row, Col, Typography, Divider, DatePicker } from "antd";
import styles from "@/styles/SalesReport.module.css";
import SearchInput from "./SearchInput";
import { getAllSalesForReport, searchSales } from "@/hooks/sales";
import { searchCompany } from "@/hooks/company";
import { searchItems } from "@/hooks/items";
import dayjs from "dayjs";
import AppTable from "./table";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
const { RangePicker } = DatePicker;
const { Title } = Typography;
const startToTodayDate = [dayjs().startOf("month"), dayjs().endOf("month")];

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
    title: "Total Amount",
    dataIndex: "totalAmount",
    key: "totalAmount",
    render: (value) => comaSeparatedValues(value),
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
  const [dateRange, setDateRange] = useState(startToTodayDate);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_LIMIT);
  const [updatedSales, setUpdatedSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [total, setTotal] = useState({});

  const transformData = (salesData) =>
    salesData.flatMap(({ id: invoiceNo, customer, laborCharge, soldDate, totalAmount, soldProducts }) =>
      soldProducts.map(
        ({ itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale, company }) => ({
          customer: `${customer.firstName} ${customer.lastName}`,
          invoiceNo,
          laborCharge,
          soldDate: new Date(soldDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          totalAmount,
          itemName,
          company: company.companyName,
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
    fetchSalesData();
  };

  const handleSearch = async (value, type) => {
    if (!value) {
      setSearchCriteria((prev) => ({ ...prev, [type]: "" }));
      return;
    }
    const result =
      type === "company"
        ? await searchCompany(value)
        : type === "item"
        ? await searchItems(value)
        : await searchSales(value);
    return result;
  };

  const handleSelect = (id, type) => {
    setSearchCriteria((prev) => ({ ...prev, [type]: id }));
  };

  const fetchSalesData = useCallback(async () => {
    const [start, end] = dateRange ? dateRange.map((d) => d.format("YYYY-MM-DD")) : startToTodayDate;
    const salesResults = await getAllSalesForReport({
      ...searchCriteria,
      dateRangeStart: start,
      dateRangeEnd: end,
      page: currentPage,
      limit: pageSize,
    });
    const transformedData = transformData(salesResults.rows);
    const totals = transformedData.reduce((acc, sale) => {
      Object.keys(sale).forEach((key) => {
        if (typeof sale[key] === "number") acc[key] = (acc[key] || 0) + sale[key];
      });
      return acc;
    }, {});
    setUpdatedSales(transformedData);
    setTotal(totals);
  }, [dateRange, searchCriteria, currentPage, pageSize]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  return (
    <div className={styles.container}>
      <Row gutter={16}>
        <Col span={18}>
          <Title level={5}>Search:</Title>
        </Col>
        <Col span={6}>
          <Title level={5}>Date Range:</Title>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={18}>
          <SearchInput
            valueKey="firstName"
            valueKey2="lastName"
            placeholder="Customer"
            handleSearch={(value) => handleSearch(value, "customer")}
            handleSelect={(id) => handleSelect(id, "customer")}
          />
        </Col>
        <Col span={6}>
          <RangePicker className={styles.marginTop} value={dateRange} onChange={(newRange) => setDateRange(newRange)} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={18}>
          <SearchInput
            valueKey="companyName"
            placeholder="Company"
            handleSearch={(value) => handleSearch(value, "company")}
            handleSelect={(id) => handleSelect(id, "company")}
          />
        </Col>
        <Col span={6}>
          <SearchInput
            valueKey="itemName"
            valueKey2="company.companyName"
            placeholder="Item"
            type="item"
            handleSearch={(value) => handleSearch(value, "item")}
            handleSelect={(id) => handleSelect(id, "item")}
          />
        </Col>
      </Row>

      <Divider />
      <AppTable
        columns={columns}
        dataSource={updatedSales}
        paginationHandler={handlePagination}
        current={currentPage}
        pageSize={pageSize}
        rowKey="id"
        rowClassName={styles.editableRow}
        totalCount={updatedSales ? updatedSales.length : 0}
        footer={() => (
          <div>
            <Row gutter={16}>
              <Col span={16} />
              <Col span={8}>
                {["totalAmount", "ratePerBale", "ratePerLbs", "ratePerKgs", "noOfBales"].map((key) => (
                  <Row justify="end" key={key}>
                    <Col span={12}>
                      <strong>{key.replace(/([A-Z])/g, " $1").toUpperCase()}:</strong>
                    </Col>
                    <Col span={12}>
                      <InputNumber
                        value={comaSeparatedValues(total[key] || 0)}
                        readOnly
                        className={styles.inputNumberField}
                      />
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>
          </div>
        )}
      />
    </div>
  );
};

export default SalesReport;

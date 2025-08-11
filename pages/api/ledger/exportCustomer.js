import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Parser } from "json2csv";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Op } from "sequelize";
import { companySumQuery, customerSumQuery } from "@/query/index";

dayjs.extend(utc);
dayjs.extend(timezone);

// Utility for comma formatting
const comaSeparatedValues = (val) => val?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Helper: parse optional dates
const parseDateRange = (startDate, endDate) => {
  const formats = ["YYYY-MM-DD", "YYYY/MM/DD"];
  const start = startDate ? dayjs(startDate, formats, true).startOf("day") : null;
  const end = endDate ? dayjs(endDate, formats, true).endOf("day") : null;
  if (startDate && (!start || !start.isValid())) return { error: "Invalid startDate format." };
  if (endDate && (!end || !end.isValid())) return { error: "Invalid endDate format." };
  if (start && end && start.isAfter(end)) return { error: "startDate cannot be after endDate." };
  return { start, end };
};

// Generate PDF
const generateCustomerLedgerPdf = (transactions, totalBalance, headerFrom, headerTo) => {
  const doc = new jsPDF("landscape", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header title (customer/company)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    transactions[0]?.customer
      ? `${transactions[0].customer.firstName} ${transactions[0].customer.lastName}`
      : transactions[0]?.otherName || "",
    pageWidth / 2,
    30,
    { align: "center" }
  );
  doc.setFontSize(12);
  doc.text("Ledger", pageWidth / 2, 48, { align: "center" });

  // 2. Ledger Header with Dates (use provided range if any; else derive from rows)
  const fromDate =
    headerFrom ?? (transactions[0]?.paymentDate ? dayjs(transactions[0].paymentDate).format("DD-MMM-YYYY") : "");
  const toDate =
    headerTo ??
    (transactions[transactions.length - 1]?.paymentDate
      ? dayjs(transactions[transactions.length - 1].paymentDate).format("DD-MMM-YYYY")
      : "");

  doc.setFontSize(11);
  if (fromDate || toDate) {
    doc.text(`(From ${fromDate} To ${toDate})`, pageWidth / 2, 70, { align: "center" });
  }

  // 3. Date & Time
  const now = dayjs();
  doc.setFontSize(9);
  doc.text(`Date: ${now.format("DD-MMM-YYYY")}`, 40, 105);
  doc.text(`Time: ${now.format("hh:mm A")}`, pageWidth - 110, 105);

  // 4. Table Headers
  const headers = [
    [
      { content: "Date" },
      { content: "Paid To" },
      { content: "Reference" },
      { content: "Invoice Number" },
      { content: "Debit" },
      { content: "Credit" },
      { content: "Closing Balance" },
    ],
  ];

  // 5. Rows
  const rows = transactions.map((row) => [
    row.paymentDate ? dayjs(row.paymentDate).format("DD-MM-YYYY") : "",
    row.company ? row.company.companyName : row.otherName || "",
    row.reference || "",
    row.invoiceNumber || "",
    row.paymentType
      ? comaSeparatedValues(row.amount.toFixed(2))
      : row.spendType === "DEBIT"
      ? comaSeparatedValues(row.amount.toFixed(2))
      : "",
    row.paymentType ? "" : row.spendType === "CREDIT" ? comaSeparatedValues(row.amount.toFixed(2)) : "",
    comaSeparatedValues((row.customerTotal || row.totalBalance || 0).toFixed(2)),
  ]);

  const totalDebit = transactions.reduce((acc, row) => (row.spendType === "DEBIT" ? acc + (row.amount || 0) : acc), 0);

  const totalCredit = transactions.reduce(
    (acc, row) => (row.spendType === "CREDIT" ? acc + (row.amount || 0) : acc),
    0
  );

  const closingBalance = totalBalance || 0;

  // 6. Render Table
  autoTable(doc, {
    startY: 110,
    head: headers,
    showHead: "firstPage",
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 11,
      font: "helvetica",
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
      valign: "middle",
      textColor: 0,
    },
    headStyles: {
      fontStyle: "bold",
      fillColor: [255, 255, 255],
      textColor: 0,
      lineWidth: 0,
    },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "left" },
      2: { halign: "left" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    didDrawCell: ({ section, row, cell }) => {
      if (section !== "head") return;
      const isFirstHeaderRow = row.index === 0;
      const isLastHeaderRow = row.index === 0;
      const { x, width, y, height } = cell;
      if (isFirstHeaderRow) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(x, y, x + width, y);
      }
      if (isLastHeaderRow) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(x, y + height, x + width, y + height);
      }
    },
    didParseCell: (data) => {
      const colIndex = data.column.index;
      if (data.section === "head") {
        if (colIndex <= 2) data.cell.styles.halign = "left";
        if (colIndex === 3) data.cell.styles.halign = "center";
        if (colIndex >= 4) data.cell.styles.halign = "right";
      }
      if (data.section === "body") {
        data.cell.styles.lineWidth = 0;
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 60; // 20pt spacing after table

  const cellWidth = 100;
  const rightMargin = 50;

  const closingBalanceX = pageWidth - rightMargin;
  const creditX = closingBalanceX - cellWidth;
  const debitX = creditX - cellWidth;
  const labelX = debitX - 120;

  const leftMargin = 400;
  const tableEndX = pageWidth - rightMargin;

  doc.setLineWidth(0.5);
  doc.setDrawColor(0);

  // Lines
  doc.line(leftMargin, finalY - 4, tableEndX, finalY - 4);
  doc.line(leftMargin, finalY + 14, tableEndX, finalY + 14);

  // Totals
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Grand Total:", labelX, finalY + 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text(comaSeparatedValues(totalDebit.toFixed(2)), debitX - 15, finalY + 10, { align: "right" });
  doc.text(comaSeparatedValues(totalCredit.toFixed(2)), creditX - 15, finalY + 10, { align: "right" });
  doc.text(comaSeparatedValues(closingBalance.toFixed(2)), closingBalanceX, finalY + 10, { align: "right" });

  return doc.output("arraybuffer");
};

// Generate CSV
const generateCustomerLedgerCsv = (transactions) => {
  const fields = [
    {
      label: "Date",
      value: (row) => dayjs(row.paymentDate).format("DD-MM-YYYY"),
    },
    {
      label: "Paid To",
      value: (row) => (row.company ? row.company.companyName : row.otherName || ""),
    },
    {
      label: "Reference",
      value: (row) => row.reference || "",
    },
    {
      label: "Invoice Number",
      value: "invoiceNumber",
    },
    {
      label: "Debit",
      value: (row) => (row.paymentType || row.spendType === "DEBIT" ? row.amount.toFixed(2) : ""),
    },
    {
      label: "Credit",
      value: (row) => (!row.paymentType && row.spendType === "CREDIT" ? row.amount.toFixed(2) : ""),
    },
    {
      label: "Closing Balance",
      value: (row) => (row.customerTotal || row.totalBalance || 0).toFixed(2),
    },
  ];

  const parser = new Parser({ fields });
  return parser.parse(transactions);
};

const exportCustomerLedger = async (req, res) => {
  try {
    await db.dbConnect();
    const { id, type, fileType, startDate, endDate } = req.query;

    if (type !== "customer" && type !== "company") {
      return res.status(400).json({ message: 'Invalid type. Only "customer" or "company" is allowed.' });
    }

    // Parse and validate date range (optional)
    const { start, end, error } = parseDateRange(startDate, endDate);
    if (error) return res.status(400).json({ message: error });

    // Build where clause
    const baseCondition = type === "company" ? { companyId: id } : { customerId: id };
    const where = { ...baseCondition };

    // Apply inclusive date filter only if both dates are provided
    if (start && end) {
      where.paymentDate = { [Op.between]: [start.toDate(), end.toDate()] };
    } else if (start && !end) {
      // If only startDate provided, from startDate to future
      where.paymentDate = { [Op.gte]: start.toDate() };
    } else if (!start && end) {
      // If only endDate provided, up to endDate
      where.paymentDate = { [Op.lte]: end.toDate() };
    }

    const transactions = await db.Ledger.findAll({
      where,
      // chronological for a statement; tie-breaker on id
      order: [
        ["paymentDate", "DESC"],
        ["id", "DESC"],
      ],
      include: [
        {
          model: db.Company,
          as: "company",
        },
        {
          model: db.Customer,
          as: "customer",
        },
      ],
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found." });
    }

    const rawQuery = type === "company" ? companySumQuery(id) : customerSumQuery(id);
    const totalBalanceRows = await db.sequelize.query(rawQuery, { type: db.Sequelize.QueryTypes.SELECT });
    const totalBalanceFromQuery = Number(totalBalanceRows?.[0]?.amount ?? 0);

    const closingFromRows =
      transactions[transactions.length - 1]?.customerTotal ?? transactions[transactions.length - 1]?.totalBalance;

    const dateFilterApplied = !!(startDate || endDate);
    const effectiveClosingBalance = dateFilterApplied
      ? typeof closingFromRows === "number"
        ? closingFromRows
        : totalBalanceFromQuery
      : totalBalanceFromQuery;

    // Prepare header dates for PDF (if filters provided)
    const headerFrom = start ? start.format("DD-MMM-YYYY") : null;
    const headerTo = end ? end.format("DD-MMM-YYYY") : null;

    if (fileType === "pdf") {
      const pdfBuffer = generateCustomerLedgerPdf(transactions, effectiveClosingBalance, headerFrom, headerTo);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=customer-ledger.pdf`);
      res.setHeader("X-Total-Amount", effectiveClosingBalance);
      return res.send(Buffer.from(pdfBuffer));
    }

    if (fileType === "csv") {
      const csv = generateCustomerLedgerCsv(transactions);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=customer-ledger.csv`);
      res.setHeader("X-Total-Amount", effectiveClosingBalance);
      return res.send(csv);
    }

    return res.status(400).json({ message: "Invalid fileType. Use 'pdf' or 'csv'." });
  } catch (error) {
    console.error("Export Ledger Error:", error);
    return res.status(500).json({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(exportCustomerLedger);

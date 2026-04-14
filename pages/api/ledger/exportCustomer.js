import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { json2csv } from "json-2-csv";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Op } from "sequelize";
import { companySumQuery, customerSumQuery } from "@/query/index";
import { capitalizeName } from "@/utils/ui.util";

dayjs.extend(utc);
dayjs.extend(timezone);

// Utility for comma formatting
const comaSeparatedValues = (val) => val?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const getLedgerBalance = (transaction, type) => {
  if (!transaction) return 0;

  const balance = type === "company" ? transaction.companyTotal : transaction.customerTotal;
  return Number(balance ?? transaction.totalBalance ?? 0);
};

// Net contribution of a single transaction to the running balance
const computeNetAmount = (t, type) => {
  const raw = typeof t.get === "function" ? t.get({ plain: true }) : t;
  if (raw.paymentType) return type === "customer" ? raw.amount : -raw.amount;
  return raw.spendType === "DEBIT" ? raw.amount : -raw.amount;
};

const getDebitAmount = (transaction, type) => {
  if (transaction.paymentType) {
    return type === "customer" ? transaction.amount || 0 : 0;
  }

  return transaction.spendType === "DEBIT" ? transaction.amount || 0 : 0;
};

const getCreditAmount = (transaction, type) => {
  if (transaction.paymentType) {
    return type === "company" ? transaction.amount || 0 : 0;
  }

  return transaction.spendType === "CREDIT" ? transaction.amount || 0 : 0;
};

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
const generateCustomerLedgerPdf = (transactions, totalBalance, headerFrom, headerTo, type, balanceMap) => {
  const doc = new jsPDF("landscape", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header title (customer/company)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    transactions[0]?.customer
      ? capitalizeName(`${transactions[0].customer.firstName} ${transactions[0].customer.lastName}`)
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
  const rows = transactions.map((row) => {
    const rowBalance = balanceMap ? balanceMap.get(row.id) : getLedgerBalance(row, type);
    return [
      row.paymentDate ? dayjs(row.paymentDate).format("DD-MM-YYYY") : "",
      row.company ? row.company.companyName : row.otherName || "",
      row.reference || "",
      row.invoiceNumber || "",
      getDebitAmount(row, type) ? comaSeparatedValues(getDebitAmount(row, type).toFixed(2)) : "",
      getCreditAmount(row, type) ? comaSeparatedValues(getCreditAmount(row, type).toFixed(2)) : "",
      comaSeparatedValues(Number(rowBalance ?? 0).toFixed(2)),
    ];
  });

  const totalDebit = transactions.reduce((acc, row) => acc + getDebitAmount(row, type), 0);
  const totalCredit = transactions.reduce((acc, row) => acc + getCreditAmount(row, type), 0);

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
const sanitizeTransactions = (transactions, type, balanceMap) =>
  transactions.map((t) => {
    const id = t.id;
    if (typeof t.get === "function") {
      t = t.get({ plain: true });
    }
    const rowBalance = balanceMap ? balanceMap.get(id) : getLedgerBalance(t, type);
    return {
      Date: dayjs(t.paymentDate).format("DD-MM-YYYY"),
      PaidTo: t.company ? t.company.companyName : t.otherName || "",
      reference: t.reference,
      Debit: getDebitAmount(t, type) ? getDebitAmount(t, type).toFixed(2) : "",
      Credit: getCreditAmount(t, type) ? getCreditAmount(t, type).toFixed(2) : "",
      ClosingBalance: Number(rowBalance ?? 0).toFixed(2),
    };
  });

const generateCustomerLedgerCsv = (transactions, type, balanceMap) => {
  try {
    const cleanData = sanitizeTransactions(transactions, type, balanceMap);
    const csv = json2csv(cleanData);
    return Buffer.from(csv);
  } catch (error) {
    console.error("Error creating CSV:", error);
    throw new Error(`Error creating CSV: ${error.message}`);
  }
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

    // Compute opening balance: sum of all transactions before the startDate
    let openingBalance = 0;
    if (start) {
      const openingRows = await db.Ledger.findAll({
        where: { ...baseCondition, paymentDate: { [Op.lt]: start.toDate() } },
        attributes: ["paymentType", "spendType", "amount"],
      });
      openingBalance = openingRows.reduce((acc, t) => acc + computeNetAmount(t, type), 0);
    }

    // Compute per-row running balances (transactions are DESC; reverse to ASC for accumulation)
    const balanceMap = new Map();
    let runningBalance = openingBalance;
    const transactionsAsc = [...transactions].reverse();
    for (const t of transactionsAsc) {
      runningBalance += computeNetAmount(t, type);
      balanceMap.set(t.id, runningBalance);
    }

    // Closing balance for the grand total row
    // With date filter: newest transaction's computed balance; without: authoritative sum query
    const dateFilterApplied = !!(startDate || endDate);
    const effectiveClosingBalance = dateFilterApplied ? balanceMap.get(transactions[0].id) ?? 0 : totalBalanceFromQuery;

    // Prepare header dates for PDF (if filters provided)
    const headerFrom = start ? start.format("DD-MMM-YYYY") : null;
    const headerTo = end ? end.format("DD-MMM-YYYY") : null;

    if (fileType === "pdf") {
      const pdfBuffer = generateCustomerLedgerPdf(
        transactions,
        effectiveClosingBalance,
        headerFrom,
        headerTo,
        type,
        balanceMap
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=customer-ledger.pdf`);
      res.setHeader("X-Total-Amount", effectiveClosingBalance);
      return res.send(Buffer.from(pdfBuffer));
    }

    if (fileType === "csv") {
      const csv = generateCustomerLedgerCsv(transactions, type, balanceMap);
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

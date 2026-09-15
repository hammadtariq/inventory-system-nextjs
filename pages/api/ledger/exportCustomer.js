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
import { resolveLedgerPartyFields } from "@/utils/query.utils";
import { capitalizeName } from "@/utils/ui.util";
import TenantContext from "@/lib/tenant-context";
import { ImageBase64URL } from "public/pdfImage/PDFImage";

dayjs.extend(utc);
dayjs.extend(timezone);

// Utility for comma formatting
const comaSeparatedValues = (val) => val?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const getLedgerBalance = (transaction, type, id) => {
  if (!transaction) return 0;

  const { partyBalance } = resolveLedgerPartyFields(transaction, type, id);
  return Number(partyBalance ?? transaction.totalBalance ?? 0);
};

// Mirrors the live ledger table's column logic (pages/ledger/[id].js) exactly: REFUND and
// INVENTORY_RETURN are fixed sides regardless of party or role (they only ever occur on legacy
// customer rows), everything else defers to resolveLedgerPartyFields's displaySpendType, which
// is already role-aware for Pay To/Pay By rows and paymentType-aware for legacy company rows.
// Do NOT special-case CASH/ONLINE/CHEQUE here ahead of that — for a role-based row (e.g. a
// customer-to-customer payment), a cash-like paymentType does not mean "always debit"; it
// depends on whether the viewed party is the Pay To or Pay By side.
const getDebitAmount = (transaction, type, id) => {
  const { paymentType, amount } = transaction;
  if (paymentType === "REFUND") return 0;
  if (paymentType === "INVENTORY_RETURN") return amount || 0;
  const { displaySpendType } = resolveLedgerPartyFields(transaction, type, id);
  return displaySpendType === "DEBIT" ? amount || 0 : 0;
};

const getCreditAmount = (transaction, type, id) => {
  const { paymentType, amount } = transaction;
  if (paymentType === "REFUND") return amount || 0;
  if (paymentType === "INVENTORY_RETURN") return 0;
  const { displaySpendType } = resolveLedgerPartyFields(transaction, type, id);
  return displaySpendType === "CREDIT" ? amount || 0 : 0;
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
const generateCustomerLedgerPdf = (transactions, totalBalance, headerFrom, headerTo, type, id, balanceMap) => {
  const doc = new jsPDF("landscape", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // 0. Logo, top-right, aligned with the table's right margin
  const logoWidth = 95;
  const logoHeight = 85;
  doc.addImage(ImageBase64URL, "PNG", pageWidth - 40 - logoWidth, 12, logoWidth, logoHeight);

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
    headerFrom ??
    (transactions[transactions.length - 1]?.paymentDate
      ? dayjs(transactions[transactions.length - 1].paymentDate).format("DD-MMM-YYYY")
      : "");
  const toDate =
    headerTo ?? (transactions[0]?.paymentDate ? dayjs(transactions[0].paymentDate).format("DD-MMM-YYYY") : "");

  doc.setFontSize(11);
  if (fromDate || toDate) {
    doc.text(`(From ${fromDate} To ${toDate})`, pageWidth / 2, 70, { align: "center" });
  }

  // 3. Date & Time
  const now = dayjs();
  doc.setFontSize(9);
  doc.text(`Date: ${now.format("DD-MMM-YYYY")}`, 40, 105);
  doc.text(`Time: ${now.format("hh:mm A")}`, pageWidth - 110, 105);

  // 3b. Subtle separator between header block and table
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(1);
  doc.line(40, 112, pageWidth - 40, 112);

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
    const rowBalance = balanceMap ? balanceMap.get(row.id) : getLedgerBalance(row, type, id);
    const { payToName } = resolveLedgerPartyFields(row, type, id);
    return [
      row.paymentDate ? dayjs(row.paymentDate).format("DD-MM-YYYY") : "",
      payToName,
      row.reference || "",
      row.invoiceNumber || "",
      getDebitAmount(row, type, id) ? comaSeparatedValues(getDebitAmount(row, type, id).toFixed(2)) : "",
      getCreditAmount(row, type, id) ? comaSeparatedValues(getCreditAmount(row, type, id).toFixed(2)) : "",
      comaSeparatedValues(Number(rowBalance ?? 0).toFixed(2)),
    ];
  });

  const totalDebit = transactions.reduce((acc, row) => acc + getDebitAmount(row, type, id), 0);
  const totalCredit = transactions.reduce((acc, row) => acc + getCreditAmount(row, type, id), 0);

  const closingBalance = totalBalance || 0;

  // 6. Render Table
  autoTable(doc, {
    startY: 120,
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
      fillColor: [245, 245, 245],
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

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // subtle slate emphasis for the closing balance figure
  doc.text(comaSeparatedValues(closingBalance.toFixed(2)), closingBalanceX, finalY + 10, { align: "right" });
  doc.setTextColor(0, 0, 0);

  return doc.output("arraybuffer");
};

// Generate CSV
const sanitizeTransactions = (transactions, type, id, balanceMap) =>
  transactions.map((t) => {
    const rowId = t.id;
    if (typeof t.get === "function") {
      t = t.get({ plain: true });
    }
    const rowBalance = balanceMap ? balanceMap.get(rowId) : getLedgerBalance(t, type, id);
    const { payToName } = resolveLedgerPartyFields(t, type, id);
    return {
      Date: t.paymentDate ? dayjs(t.paymentDate).format("DD-MM-YYYY") : "",
      PaidTo: payToName,
      reference: t.reference,
      Debit: getDebitAmount(t, type, id) ? getDebitAmount(t, type, id).toFixed(2) : "",
      Credit: getCreditAmount(t, type, id) ? getCreditAmount(t, type, id).toFixed(2) : "",
      ClosingBalance: Number(rowBalance ?? 0).toFixed(2),
    };
  });

const generateCustomerLedgerCsv = (transactions, type, id, balanceMap) => {
  try {
    const cleanData = sanitizeTransactions(transactions, type, id, balanceMap);
    const csv = json2csv(cleanData);
    return Buffer.from(csv);
  } catch (error) {
    console.error("Error creating CSV:", error);
    throw new Error(`Error creating CSV: ${error.message}`);
  }
};

export const exportCustomerLedger = async (req, res) => {
  try {
    await db.dbConnect();
    const { id, type, fileType, startDate, endDate } = req.query;
    const organizationId = TenantContext.assertGet();

    if (type !== "customer" && type !== "company") {
      return res.status(400).json({ message: 'Invalid type. Only "customer" or "company" is allowed.' });
    }

    // Parse and validate date range (optional)
    const { start, end, error } = parseDateRange(startDate, endDate);
    if (error) return res.status(400).json({ message: error });

    // Build where clause
    const baseCondition =
      type === "company"
        ? { organizationId, [Op.or]: [{ companyId: id }, { payToCompanyId: id }, { payByCompanyId: id }] }
        : { organizationId, [Op.or]: [{ customerId: id }, { payToCustomerId: id }, { payByCustomerId: id }] };
    const where = { ...baseCondition };

    // Apply inclusive date filter only if both dates are provided
    if (start && end) {
      where.paymentDate = { [Op.between]: [start.toDate(), end.toDate()] };
    } else if (start && !end) {
      where.paymentDate = { [Op.gte]: start.toDate() };
    } else if (!start && end) {
      where.paymentDate = { [Op.lte]: end.toDate() };
    }

    const transactions = await db.Ledger.findAll({
      where,
      order: [["id", "DESC"]],
      include: [
        {
          model: db.Company,
          as: "company",
        },
        {
          model: db.Customer,
          as: "customer",
        },
        {
          model: db.Company,
          as: "payToCompany",
        },
        {
          model: db.Customer,
          as: "payToCustomer",
        },
        {
          model: db.Company,
          as: "payByCompany",
        },
        {
          model: db.Customer,
          as: "payByCustomer",
        },
      ],
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found." });
    }

    const rawQuery = type === "company" ? companySumQuery : customerSumQuery;
    const totalBalanceRows = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { id, organizationId },
    });
    const totalBalanceFromQuery = Number(totalBalanceRows?.[0]?.amount ?? 0);

    // Use stored per-row balances (customerTotal/companyTotal) to match what the UI displays
    const dateFilterApplied = !!(startDate || endDate);
    const effectiveClosingBalance = dateFilterApplied
      ? getLedgerBalance(transactions[0], type, id)
      : totalBalanceFromQuery;

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
        id,
        null
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=customer-ledger.pdf`);
      res.setHeader("X-Total-Amount", effectiveClosingBalance);
      return res.send(Buffer.from(pdfBuffer));
    }

    if (fileType === "csv") {
      const csv = generateCustomerLedgerCsv(transactions, type, id, null);
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

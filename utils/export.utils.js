import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { capitalizeName, formatDDMMYYYY } from "./ui.util";
import { ImageBase64URL } from "public/pdfImage/PDFImage";

// ─── Design tokens (matched to template) ────────────────────────────────────
const HEADER_BLUE = [68, 114, 196]; // table header fill
const BORDER_BLUE = [173, 198, 232]; // row / cell border
const TOTAL_KEY = "__isTotal__"; // marker for bold footer rows

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatNum(value) {
  if (value === undefined || value === null || value === "" || value === "-") return "";
  const num = parseFloat(String(value).replace(/,/g, ""));
  if (isNaN(num)) return String(value);
  return num.toLocaleString("en-US");
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function createPDF() {
  return new jsPDF();
}

/**
 * Renders the header block:
 *   – logo (top-right)
 *   – "SALE INVOICE" centred title
 *   – BILLED TO / customer name (left)
 *   – date (right)
 */
export function addTitleAndDetails(doc, headData, titleOverride = null) {
  const pageWidth = doc.internal.pageSize.width;
  const formattedDate = headData.soldDate ? formatDDMMYYYY(headData.soldDate) : formatDDMMYYYY(new Date());
  const customerName = headData?.customer
    ? `${headData.customer.firstName || ""} ${headData.customer.lastName || ""}`.trim()
    : "";
  const title = titleOverride || (customerName ? "SALE INVOICE" : "INVENTORY DETAIL");

  // Centered title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 34, { align: "center" });

  // Customer block on the left
  if (headData?.customer) {
    if (customerName) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO:", 14, 46);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(capitalizeName(customerName).toUpperCase(), 14, 52);
    }
  }

  // Top-right logo with date directly below it
  const rightColX = pageWidth - 45;
  doc.addImage(ImageBase64URL, "PNG", rightColX, 4, 42, 34);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formattedDate, pageWidth - 14, 43, { align: "right" });
}

/**
 * Maps raw API rows to the flat shape the table/totals functions expect.
 * Produces a single `rate` field (lbs → kgs → bale precedence).
 */
export function mapDataToTable(data) {
  return data.map((item, index) => {
    const rate =
      item.ratePerLbs ?? item.lbsRate ?? item.ratePerKgs ?? item.kgRate ?? item.ratePerBale ?? item.baleRate ?? null;

    return {
      sno: index + 1,
      item: (item.itemDetail ?? item.itemName ?? "").toUpperCase(),
      company: (
        item.company?.companyName ??
        item.companyName ??
        (typeof item.company === "string" ? item.company : null) ??
        "-"
      ).toUpperCase(),
      bales: item.onHand ?? item.bales ?? "-",
      lbs: item.lbs ?? "-",
      kgs: item.kgs ?? "-",
      ...(rate !== null && rate !== "-" ? { rate } : "-"),
      ...(item.totalAmount != null ? { totalAmount: item.totalAmount } : {}),
    };
  });
}

/** Sums numeric columns across all data rows. */
export function calculateTotals(tableData) {
  const parse = (v) => parseFloat(String(v ?? 0).replace(/,/g, "")) || 0;
  const totals = { kgs: 0, lbs: 0, bales: 0, totalAmount: 0 };

  tableData.forEach((row) => {
    totals.kgs += parse(row.kgs);
    totals.lbs += parse(row.lbs);
    totals.bales += parse(row.bales);
    totals.totalAmount += parse(row.totalAmount);
  });

  return totals;
}

/**
 * Appends a bold TOTAL footer row to the table data.
 * The row is flagged with TOTAL_KEY so didParseCell can bold it.
 */
export function appendTotalsRow(tableData, totals) {
  tableData.push({
    sno: "",
    item: "TOTAL",
    company: "",
    bales: totals.bales || "",
    lbs: "",
    kgs: "",
    rate: "",
    totalAmount: totals.totalAmount || "",
    [TOTAL_KEY]: true,
  });
  return tableData;
}

/**
 * Renders the main data table.
 * – WITH_RATES  → 8 columns including Rate and Amount
 * – WITHOUT_RATES → 6 columns (no Rate / Amount)
 */
export function generateTable(doc, tableData) {
  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = 14;
  const tableWidth = pageWidth - marginLeft * 2; // 182 mm on A4

  const showRateColumns =
    tableData.some((row) => row.rate && row.rate !== "-") ||
    tableData.some((row) => row.totalAmount && row.totalAmount !== "-");

  // ── Column definitions ──────────────────────────────────────────────────
  // Widths must sum to tableWidth (182 mm).
  const columns = showRateColumns
    ? [
        { header: "SR", dataKey: "sno", width: 12, halign: "left" }, // widened for 2-digit numbers (change 3)
        { header: "Items", dataKey: "item", width: 40, halign: "left" }, // slightly reduced to free space for Amount
        { header: "Company Name", dataKey: "company", width: 30, halign: "left" },
        { header: "Quantity", dataKey: "bales", width: 19, halign: "center" },
        { header: "Weight (LBS)", dataKey: "lbs", width: 21, halign: "center" },
        { header: "Weight (KGS)", dataKey: "kgs", width: 21, halign: "center" },
        { header: "Rate", dataKey: "rate", width: 16, halign: "center" },
        { header: "Amount", dataKey: "totalAmount", width: 24, halign: "right" },
      ]
    : [
        { header: "SR", dataKey: "sno", width: 12, halign: "left" }, // widened for 2-digit numbers (change 3)
        { header: "Items", dataKey: "item", width: 54, halign: "left" }, // centre-aligned (change 4)
        { header: "Company Name", dataKey: "company", width: 40, halign: "left" },
        { header: "Quantity", dataKey: "bales", width: 22, halign: "center" },
        { header: "Weight (LBS)", dataKey: "lbs", width: 26, halign: "center" },
        { header: "Weight (KGS)", dataKey: "kgs", width: 28, halign: "center" },
      ];

  const columnStyles = Object.fromEntries(columns.map((col, i) => [i, { cellWidth: col.width, halign: col.halign }]));

  // ── Body rows ───────────────────────────────────────────────────────────
  const bodyRows = tableData.map((row) =>
    columns.map((col) => {
      const v = row[col.dataKey];
      if (col.dataKey === "bales" && v !== "") return formatNum(v);
      if (col.dataKey === "rate" && v !== "") return formatNum(v);
      if (col.dataKey === "totalAmount" && v !== "") return formatNum(v);
      return v ?? "";
    })
  );

  autoTable(doc, {
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 56,
    head: [columns.map((col) => col.header)],
    body: bodyRows,
    tableWidth,
    margin: { left: marginLeft },
    styles: {
      fontSize: 9,
      cellPadding: [4, 3],
      textColor: [0, 0, 0],
      lineColor: BORDER_BLUE,
      lineWidth: 0.3,
      font: "helvetica",
    },
    headStyles: {
      fillColor: HEADER_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      lineColor: HEADER_BLUE,
      lineWidth: 0.3,
    },
    columnStyles,
    theme: "grid",
    // Bold the TOTAL footer row
    didParseCell: (data) => {
      if (data.section === "head" && columns[data.column.index]?.dataKey === "totalAmount") {
        data.cell.styles.halign = "right";
      }

      if (data.section === "body" && tableData[data.row.index]?.[TOTAL_KEY]) {
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && ["item", "company"].includes(columns[data.column.index]?.dataKey)) {
        data.cell.styles.fontSize = 8;
      }
    },
  });
}

/**
 * Called for WITHOUT_RATES exports.
 * Totals are already inside the table via appendTotalsRow — nothing extra needed.
 */
export function addSummarySection() {}

/**
 * Called for WITH_RATES exports.
 * Renders "PKR: … ONLY" (left) and an Authorized Signatory line (bottom-right).
 */
export function addNetAmountSection(doc, totalAmount, laborCharge = 0, isQuotation = false) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const tableEnd = doc.lastAutoTable?.finalY - 10;
  const y = tableEnd + 22;
  const grandTotal = totalAmount + laborCharge;

  // Amount in words
  const words = numberToWords(Math.round(grandTotal));
  const pkrText = `PKR: ${words.toUpperCase()} ONLY`;
  const wrapped = doc.splitTextToSize(pkrText, pageWidth * 0.55);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(wrapped, 14, y);

  // Amount summary – lower-right under the table
  const grandTotalStr = `Rs. ${formatNum(grandTotal.toFixed(2))}`;
  const summaryX = pageWidth - 14;
  const summaryStartY = tableEnd + 22;

  doc.setFont("helvetica", "bold");

  if (isQuotation) {
    doc.text(`Grand Total = ${grandTotalStr}`, summaryX, summaryStartY, { align: "right" });
  } else {
    const amountStr = `Rs. ${formatNum(totalAmount.toFixed(2))}`;
    const laborChargeStr = `Rs. ${formatNum(laborCharge.toFixed(2))}`;
    doc.text(`Net Total = ${amountStr}`, summaryX, summaryStartY, { align: "right" });
    doc.text(`Labour Charge = ${laborChargeStr}`, summaryX, summaryStartY + 6, { align: "right" });
    doc.text(`Grand Total = ${grandTotalStr}`, summaryX, summaryStartY + 12, { align: "right" });
  }

  // Authorized Signatory – bottom right
  const sigText = "Authorized Signatory";
  const sigWidth = doc.getTextWidth(sigText);
  const sigX = pageWidth - 14 - sigWidth;
  const sigY = pageHeight - 18;

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(0, 0, 0);
  doc.line(sigX - 5, sigY - 8, sigX + sigWidth + 5, sigY - 8);
  doc.text(sigText, sigX, sigY);
}

/**
 * Renders the quotation table with columns:
 * SR | Items | Company Name | Quantity | Unit Price | Amount
 */
export function generateQuotationTable(doc, tableData) {
  const TOTAL_KEY = "__isTotal__";
  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = 14;
  const tableWidth = pageWidth - marginLeft * 2;

  const columns = [
    { header: "SR", dataKey: "sno", width: 12, halign: "left" },
    { header: "Items", dataKey: "item", width: 50, halign: "left" },
    { header: "Company Name", dataKey: "company", width: 40, halign: "left" },
    { header: "Quantity", dataKey: "quantity", width: 22, halign: "center" },
    { header: "Unit Price (Rs)", dataKey: "unitPrice", width: 30, halign: "center" },
    { header: "Amount (Rs)", dataKey: "totalAmount", width: 28, halign: "right" },
  ];

  const columnStyles = Object.fromEntries(columns.map((col, i) => [i, { cellWidth: col.width, halign: col.halign }]));

  const bodyRows = tableData.map((row) =>
    columns.map((col) => {
      const v = row[col.dataKey];
      if (["quantity", "unitPrice", "totalAmount"].includes(col.dataKey) && v !== "" && v !== "-") return formatNum(v);
      return v ?? "";
    })
  );

  autoTable(doc, {
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 56,
    head: [columns.map((col) => col.header)],
    body: bodyRows,
    tableWidth,
    margin: { left: marginLeft },
    styles: {
      fontSize: 9,
      cellPadding: [4, 3],
      textColor: [0, 0, 0],
      lineColor: BORDER_BLUE,
      lineWidth: 0.3,
      font: "helvetica",
    },
    headStyles: {
      fillColor: HEADER_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      lineColor: HEADER_BLUE,
      lineWidth: 0.3,
    },
    columnStyles,
    theme: "grid",
    didParseCell: (data) => {
      if (data.section === "head" && columns[data.column.index]?.dataKey === "totalAmount") {
        data.cell.styles.halign = "right";
      }
      if (data.section === "body" && tableData[data.row.index]?.[TOTAL_KEY]) {
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && ["item", "company"].includes(columns[data.column.index]?.dataKey)) {
        data.cell.styles.fontSize = 8;
      }
    },
  });
}

/**
 * Generates and downloads a report-style PDF (not an invoice).
 * @param {object} opts
 * @param {string} opts.title - e.g. "SALE REPORT"
 * @param {string[]} [opts.dateRange] - e.g. ["From Date: 01-04-2026", "To Date: 30-04-2026"]
 * @param {string} [opts.filterLabel] - shown left below title, e.g. "Customer: John Doe"
 * @param {{ header: string, dataKey: string, width?: number, halign?: string }[]} opts.columns
 * @param {object[]} opts.rows
 * @param {{ label: string, value: number|string }[]} [opts.summary]
 */
export function exportReportToPDF({ title, dateRange, filterLabel, columns, rows, summary }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Company header top-right (same logo as invoices)
  doc.addImage(ImageBase64URL, "PNG", pageWidth - 45, 4, 42, 34);

  // Centered report title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 44, { align: "center" });

  const contextY = 52;
  const lineHeight = 5;

  // Left: filter lines rendered vertically (one per line)
  const filterLines = Array.isArray(filterLabel) ? filterLabel : filterLabel ? [filterLabel] : [];
  if (filterLines.length) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    filterLines.forEach((line, i) => {
      doc.text(line, 14, contextY + i * lineHeight);
    });
  }

  // Right: date range lines rendered vertically
  if (dateRange && dateRange.length) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    dateRange.forEach((line, i) => {
      doc.text(line, pageWidth - 14, contextY + i * lineHeight, { align: "right" });
    });
  }

  const contextLines = Math.max(filterLines.length, dateRange ? dateRange.length : 0);
  const tableStartY = contextLines > 0 ? contextY + contextLines * lineHeight + 6 : 52;
  const margin = 14;
  const tableWidth = pageWidth - margin * 2; // 182mm on A4

  // Normalize column widths so they sum exactly to tableWidth (keeps proportions, fixes centering)
  const hasWidths = columns.some((c) => c.width);
  let columnStyles = {};
  if (hasWidths) {
    const totalDefined = columns.reduce((sum, c) => sum + (c.width || 0), 0);
    const scale = totalDefined > 0 ? tableWidth / totalDefined : 1;
    columnStyles = Object.fromEntries(
      columns.map((col, i) => [i, { cellWidth: (col.width || 0) * scale, halign: col.halign || "left" }])
    );
  }

  const headRow = columns.map((c) => c.header);
  const bodyRows = rows.map((row, idx) =>
    columns.map((col) => {
      if (col.dataKey === "sl") return idx + 1;
      const v = row[col.dataKey];
      if (v === undefined || v === null || v === "" || v === "-") return "";
      if (typeof v === "number") return formatNum(v);
      return String(v);
    })
  );

  autoTable(doc, {
    startY: tableStartY,
    head: [headRow],
    body: bodyRows,
    tableWidth,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: [3, 2],
      textColor: [0, 0, 0],
      lineColor: BORDER_BLUE,
      lineWidth: 0.3,
      font: "helvetica",
    },
    headStyles: {
      fillColor: HEADER_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      lineColor: HEADER_BLUE,
    },
    columnStyles,
    theme: "grid",
  });

  // Summary section bottom-right
  if (summary && summary.length > 0) {
    const sumStartY = doc.lastAutoTable.finalY + 14;
    const labelX = pageWidth - 65;
    const valueX = pageWidth - 14;

    doc.setFontSize(9);
    summary.forEach((item, i) => {
      const y = sumStartY + i * 7;
      doc.setFont("helvetica", "normal");
      doc.text(item.label, labelX, y);
      doc.setFont("helvetica", "bold");
      const valStr = typeof item.value === "number" ? formatNum(item.value) : String(item.value ?? "0");
      doc.text(valStr, valueX, y, { align: "right" });
    });
  }

  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.pdf`);
}

// ─── Number → words ──────────────────────────────────────────────────────────
export function numberToWords(num) {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n) {
    if (n === 0) return "Zero";
    let word = "";
    if (Math.floor(n / 1_000_000) > 0) {
      word += convert(Math.floor(n / 1_000_000)) + " Million ";
      n %= 1_000_000;
    }
    if (Math.floor(n / 1_000) > 0) {
      word += convert(Math.floor(n / 1_000)) + " Thousand ";
      n %= 1_000;
    }
    if (Math.floor(n / 100) > 0) {
      word += convert(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }
    if (n > 0) word += n < 20 ? units[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    return word.trim();
  }

  return convert(num);
}

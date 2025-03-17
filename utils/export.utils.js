import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Function to create and configure a new jsPDF instance
export function createPDF() {
  return new jsPDF();
}

// Function to add title and invoice details
export function addTitleAndDetails(doc, headData) {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");

  // Title (Company Name)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("VAST APPAREL", 105, 10, { align: "center" });

  // INVOICE text (reduced gap)
  doc.setFontSize(9);
  doc.text("INVOICE", 105, 20, { align: "center" });

  // Underline the 'INVOICE' text
  const invoiceTextWidth = doc.getTextWidth("INVOICE");
  doc.setLineWidth(0.3);
  doc.line(105 - invoiceTextWidth / 2, 21, 105 + invoiceTextWidth / 2, 21);

  // Set font for the details
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  // Customer Details (reduced vertical space)
  if (headData?.customer) {
    const customerName = `${headData.customer.firstName || ""} ${headData.customer.lastName || ""}`.trim();
    doc.text(`Customer: ${customerName}`, 10, 24);
  }

  doc.text("Ticket: MIXING", 10, 28);
  const tableStartX = doc.internal.pageSize.width - 15; // Approximate right margin

  doc.text(`Date: ${formattedDate}`, tableStartX, 26, { align: "right" });
  doc.text(`Invoice No: ${headData?.id ?? headData?.count}`, tableStartX, 31, { align: "right" });
}

// Function to map data to table format with truncated text fields
export function mapDataToTable(data) {
  return data.map((item, index) => ({
    sno: index + 1,
    item: truncateText(item.itemDetail ?? item.itemName, 23).toUpperCase(), // Truncate text
    ...(item.company?.companyName && { company: item.company.companyName || "-" }),
    kgs: item.kgs ?? "-",
    lbs: item.lbs ?? "-",
    bales: item.onHand ?? "-",
    company: item.company ?? "-",
    ...(item.ratePerKgs && { kgRate: item.kgRate ?? item.ratePerKgs }),
    ...(item.ratePerLbs && { lbsRate: item.lbsRate ?? item.ratePerLbs }),
    ...(item.ratePerBale && { baleRate: item.baleRate ?? item.ratePerBale }),
    ...(item.totalAmount && { totalAmount: item.totalAmount }),
  }));
}

// Function to truncate text if it exceeds the specified length
function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength - 3) + "...";
  }
  return text;
}

// Function to generate the table using autoTable with responsive column widths
export function generateTable(doc, tableData) {
  const hasKgRate = tableData.some((row) => row.kgRate !== undefined);
  const hasLbsRate = tableData.some((row) => row.lbsRate !== undefined);
  const hasBaleRate = tableData.some((row) => row.baleRate !== undefined);
  const hasTotalAmount = tableData.some((row) => row.totalAmount !== undefined);

  const columns = [
    { header: "S.No", dataKey: "sno" },
    { header: "Item Detail", dataKey: "item" },
    { header: "KGS", dataKey: "kgs" },
    { header: "LBS", dataKey: "lbs" },
    { header: "Bales", dataKey: "bales" },
    { header: "Company", dataKey: "company" },
    ...(hasKgRate ? [{ header: "KG Rate", dataKey: "kgRate" }] : []),
    ...(hasLbsRate ? [{ header: "LBS Rate", dataKey: "lbsRate" }] : []),
    ...(hasBaleRate ? [{ header: "Bale Rate", dataKey: "baleRate" }] : []),
    ...(hasTotalAmount ? [{ header: "Total Amount", dataKey: "totalAmount" }] : []),
  ];

  const tempDoc = new jsPDF();
  autoTable(tempDoc, {
    head: [columns.map((col) => col.header)],
    body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
    styles: {
      fontSize: 7, // Compact but readable
      halign: "center",
      cellPadding: [0.5, 0.5], // Smaller padding for tight layout
      lineColor: [0, 0, 0],
      lineWidth: 0.5, // Thinner lines to save space
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    columnStyles: {
      sno: { halign: "center", cellWidth: "auto" },
      item: { halign: "left", cellWidth: "auto" },
      kgs: { halign: "center", cellWidth: "auto" },
      lbs: { halign: "center", cellWidth: "auto" },
      bales: { halign: "right", cellWidth: "auto" },
      ...(hasKgRate ? { kgRate: { halign: "right", cellWidth: "auto" } } : {}),
      ...(hasLbsRate ? { lbsRate: { halign: "right", cellWidth: "auto" } } : {}),
      ...(hasBaleRate ? { baleRate: { halign: "right", cellWidth: "auto" } } : {}),
      ...(hasTotalAmount ? { totalAmount: { halign: "right", cellWidth: "auto" } } : {}),
    },
    theme: "grid",
    tableWidth: "auto",
    margin: { left: 11 },
  });

  const tableWidth = tempDoc.internal.pageSize.width - 20;
  const pageWidth = doc.internal.pageSize.width;
  const startX = (pageWidth - tableWidth) / 2;

  autoTable(doc, {
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40,
    head: [columns.map((col) => col.header)],
    body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
    styles: {
      fontSize: 7,
      halign: "center",
      cellPadding: [0.5, 0.5],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    columnStyles: {
      sno: { halign: "center", cellWidth: "auto" },
      item: { halign: "left", cellWidth: "auto" },
      kgs: { halign: "center", cellWidth: "auto" },
      lbs: { halign: "center", cellWidth: "auto" },
      bales: { halign: "right", cellWidth: "auto" },
      ...(hasKgRate && { kgRate: { halign: "right", cellWidth: "auto" } }),
      ...(hasLbsRate && { lbsRate: { halign: "right", cellWidth: "auto" } }),
      ...(hasBaleRate && { baleRate: { halign: "right", cellWidth: "auto" } }),
      ...(hasTotalAmount && { totalAmount: { halign: "right", cellWidth: "auto" } }),
    },
    theme: "grid",
    tableWidth: "auto",
    margin: { left: startX },
  });
}

// Function to calculate totals
export function calculateTotals(tableData) {
  const totals = {
    kgs: 0,
    lbs: 0,
    bales: 0,
    kgRate: 0,
    lbsRate: 0,
    baleRate: 0,
    totalAmount: 0,
  };

  tableData.forEach((row) => {
    totals.kgs += parseFloat(row.kgs || 0);
    totals.lbs += parseFloat(row.lbs || 0);
    totals.bales += parseFloat(row.bales || 0);
    totals.kgRate += parseFloat(row.kgRate || 0);
    totals.lbsRate += parseFloat(row.lbsRate || 0);
    totals.baleRate += parseFloat(row.baleRate || 0);
    totals.totalAmount += parseFloat(row.totalAmount || 0);
  });

  return totals;
}

// Function to append totals row to table data
// export function appendTotalsRow(tableData, totals) {
//   tableData.push({
//     sno: "Total",
//     item: "-",
//     kgs: totals.kgs ? totals.kgs.toFixed(2) : "-",
//     lbs: totals.lbs ? totals.lbs.toFixed(2) : "-",
//     bales: totals.bales ? totals.bales : "-",
//     kgRate: totals.kgRate ? totals.kgRate.toFixed(2) : "-",
//     lbsRate: totals.lbsRate ? totals.lbsRate.toFixed(2) : "-",
//     baleRate: totals.baleRate ? totals.baleRate.toFixed(2) : "-",
//     totalAmount: `RS: ${totals.totalAmount.toFixed(2)}`,
//   });

//   return tableData;
// }

export function appendTotalsRow(tableData, totals) {
  tableData.push({
    sno: "Total",
    item: "-",
    kgs: totals.kgs ? totals.kgs.toFixed(2) : "-",
    lbs: totals.lbs ? totals.lbs.toFixed(2) : "-",
    bales: totals.bales ?? "-",
    ...(totals.kgRate && { kgRate: totals.kgRate ? totals.kgRate.toFixed(2) : "-" }),
    ...(totals.lbsRate && { lbsRate: totals.lbsRate ? totals.lbsRate.toFixed(2) : "-" }),
    ...(totals.baleRate && { baleRate: totals.baleRate ? totals.baleRate.toFixed(2) : "-" }),
    ...(totals.totalAmount && { totalAmount: `RS: ${totals.totalAmount.toFixed(2)}` }),
  });

  return tableData;
}

// Function to add net amount section
export function addNetAmountSection(doc, totalAmount) {
  const yPosAfterTable = doc.previousAutoTable.finalY + 10;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Convert amount to words
  const netAmountInWords = numberToWords(totalAmount);
  const pkText = `PKR: ${netAmountInWords.toUpperCase()} ONLY`;

  // Define Net Amount text and positioning
  const netAmountText = "Net Amount: ";
  const netAmountTextWidth = doc.getTextWidth(netAmountText);
  const amountWidth = doc.getTextWidth(`${totalAmount.toFixed(2)}`);
  const totalWidth = netAmountTextWidth + amountWidth + 20;

  const maxTextWidth = pageWidth * 0.5 - 20;
  const splitPkText = doc.splitTextToSize(pkText, maxTextWidth);

  const yPos = yPosAfterTable + 5;
  const gap = 15;

  // Print amount in words
  doc.setFont("helvetica", "normal");
  doc.text(splitPkText, 10, yPos);

  // Right-align the Net Amount section
  const netAmountX = pageWidth - totalWidth - gap;
  const rsX = netAmountX + netAmountTextWidth + 10;
  const amountX = rsX + 10;

  doc.setFont("helvetica", "bold");
  doc.text(netAmountText, netAmountX, yPos);

  // Draw border lines above and below the amount
  const borderYTop = yPos - 6;
  const borderYBottom = yPos + 2;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(rsX, borderYTop, amountX + amountWidth, borderYTop);
  doc.line(rsX, borderYBottom, amountX + amountWidth, borderYBottom);

  doc.setFont("helvetica", "normal");
  doc.text("Rs.", rsX, yPos);
  doc.text(`${totalAmount.toFixed(2)}`, amountX, yPos);

  // Position "Authorized Signatory" at the bottom of the page
  const bottomMargin = 20;
  const signatoryYPos = pageHeight - bottomMargin;

  const signatoryText = "Authorized Signatory";
  const signatoryTextWidth = doc.getTextWidth(signatoryText);

  const signatoryX = 159;
  const lineStartX = signatoryX - 10;
  const lineEndX = signatoryX + signatoryTextWidth + 10;

  // Draw the signature line and text
  doc.line(lineStartX, signatoryYPos - 10, lineEndX, signatoryYPos - 10);
  doc.text(signatoryText, signatoryX, signatoryYPos);
}

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
  const thousands = ["", "Thousand", "Million", "Billion"];

  function convertToWords(n) {
    if (n === 0) return "Zero";
    let word = "";

    if (Math.floor(n / 1000000) > 0) {
      word += convertToWords(Math.floor(n / 1000000)) + " Million ";
      n %= 1000000;
    }
    if (Math.floor(n / 1000) > 0) {
      word += convertToWords(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      word += convertToWords(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }

    if (n > 0) {
      if (n < 20) {
        word += units[n];
      } else {
        word += tens[Math.floor(n / 10)] + " " + units[n % 10];
      }
    }

    return word.trim();
  }

  return convertToWords(num);
}

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

  // Set font for the title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("COMPANY NAME", 105, 15, { align: "center" });
  doc.setFontSize(16);
  // Add the 'INVOICE' text at the center
  doc.text("INVOICE", 105, 55, { align: "center" });

  // Underline the 'INVOICE' text
  const invoiceText = "INVOICE";
  const invoiceTextWidth = doc.getTextWidth(invoiceText);
  const startX = 105 - invoiceTextWidth / 2; // Center the underline with the text
  const lineY = 56; // Adjust Y position slightly below the text for the underline
  doc.setLineWidth(0.5); // Set line thickness (similar to the "Authorized Signatory" line)
  doc.line(startX, lineY, startX + invoiceTextWidth, lineY);

  // Set font for the details
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  // Add other details
  doc.text(`Customer : ${headData?.customer?.firstName + " " + headData?.customer?.lastName}`, 10, 30);
  doc.text("Ticket : MIXING", 10, 38);
  doc.text(`Date : ${formattedDate}`, 165, 30);
  doc.text(`Invoice No : ${headData?.id}`, 165, 38);
}

// Function to map data to table format with truncated text fields
export function mapDataToTable(data) {
  return data.map((item, index) => ({
    sno: index + 1,
    item: truncateText(item.itemDetail, 23).toUpperCase(), // Truncate text to 30 characters
    kgs: item.kgs,
    lbs: item.lbs,
    bales: item.bales,
    kgRate: item.kgRate,
    lbsRate: item.lbsRate,
    baleRate: item.baleRate,
    totalAmount: item.totalAmount,
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
  const columns = [
    { header: "S.No", dataKey: "sno" },
    { header: "Item Detail", dataKey: "item" },
    { header: "KGS", dataKey: "kgs" },
    { header: "LBS", dataKey: "lbs" },
    { header: "Bales", dataKey: "bales" },
    { header: "KG Rate", dataKey: "kgRate" },
    { header: "LBS Rate", dataKey: "lbsRate" },
    { header: "Bale Rate", dataKey: "baleRate" },
    { header: "Total Amount", dataKey: "totalAmount" },
  ];

  // Generate a temporary table to calculate its width
  const tempDoc = new jsPDF();
  autoTable(tempDoc, {
    head: [columns.map((col) => col.header)],
    body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
    styles: {
      fontSize: 10,
      halign: "center",
      cellPadding: [3, 2],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [192, 192, 192],
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
      kgRate: { halign: "right", cellWidth: "auto" },
      lbsRate: { halign: "right", cellWidth: "auto" },
      baleRate: { halign: "right", cellWidth: "auto" },
      totalAmount: { halign: "right", cellWidth: "auto" },
    },
    theme: "grid",
    tableWidth: "auto",
    margin: { left: 10 },
  });

  const tableWidth = tempDoc.internal.pageSize.width - 20; // Adjust for margins
  const pageWidth = doc.internal.pageSize.width;
  const startX = (pageWidth - tableWidth) / 2;

  autoTable(doc, {
    startY: 60,
    head: [columns.map((col) => col.header)],
    body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
    styles: {
      fontSize: 10,
      halign: "center",
      cellPadding: [3, 2],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [192, 192, 192],
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
      kgRate: { halign: "right", cellWidth: "auto" },
      lbsRate: { halign: "right", cellWidth: "auto" },
      baleRate: { halign: "right", cellWidth: "auto" },
      totalAmount: { halign: "right", cellWidth: "auto" },
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
export function appendTotalsRow(tableData, totals) {
  tableData.push({
    sno: "Total",
    item: "-",
    kgs: totals.kgs ? totals.kgs.toFixed(2) : "-",
    lbs: totals.lbs ? totals.lbs.toFixed(2) : "-",
    bales: totals.bales ? totals.bales : "-",
    kgRate: totals.kgRate ? totals.kgRate.toFixed(2) : "-",
    lbsRate: totals.lbsRate ? totals.lbsRate.toFixed(2) : "-",
    baleRate: totals.baleRate ? totals.baleRate.toFixed(2) : "-",
    totalAmount: `RS: ${totals.totalAmount.toFixed(2)}`,
  });

  return tableData;
}

// Function to add net amount section
export function addNetAmountSection(doc, totalAmount) {
  const yPosAfterTable = doc.previousAutoTable.finalY + 10;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const netAmountInWords = numberToWords(totalAmount);
  const pkText = `PKR: ${netAmountInWords.toUpperCase()} ONLY`;
  const netAmountText = "Net Amount: ";

  const netAmountTextWidth = doc.getTextWidth(netAmountText);
  const amountWidth = doc.getTextWidth(`Rs. ${totalAmount.toFixed(2)}`);
  const totalWidth = netAmountTextWidth + amountWidth + 20;

  const maxTextWidth = pageWidth * 0.5 - 20;
  const splitPkText = doc.splitTextToSize(pkText, maxTextWidth);

  const yPos = yPosAfterTable + 10;
  const gap = 15;

  doc.setFont("helvetica", "normal");
  doc.text(splitPkText, 10, yPos);

  doc.setFont("helvetica", "bold");
  doc.text(netAmountText, pageWidth - totalWidth - gap, yPos);

  const rsX = pageWidth - totalWidth - gap + netAmountTextWidth + 10;
  const amountX = rsX + 15;
  const borderYTop = yPos - 6;
  const borderYBottom = yPos + 2;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(rsX, borderYTop, amountX + amountWidth, borderYTop);
  doc.line(rsX, borderYBottom, amountX + amountWidth, borderYBottom);

  doc.setFont("helvetica", "normal");
  doc.text("Rs.", rsX, yPos);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, amountX, yPos);

  // Position "Authorized Signatory" at the bottom of the page
  const bottomMargin = 20; // Adjust this value if you want more space from the bottom
  const signatoryYPos = pageHeight - bottomMargin; // Calculate Y position based on page height

  // Add "Authorized Signatory" and line
  const signatoryText = "Authorized Signatory";
  const signatoryTextWidth = doc.getTextWidth(signatoryText);

  // Define X position for the text and line
  const signatoryX = 145; // X position for the "Authorized Signatory" text
  const lineStartX = signatoryX - 10; // Line starts at the same X position as the text
  const lineEndX = signatoryX + signatoryTextWidth + 10; // Line ends slightly beyond the text width

  // Draw the signature line
  doc.line(lineStartX, signatoryYPos - 10, lineEndX, signatoryYPos - 10); // Line 10 units above the text

  // Add the "Authorized Signatory" text
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

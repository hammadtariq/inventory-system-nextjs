import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { capitalizeName, formatDDMMYYYY } from "./ui.util";
import { ImageBase64URL } from "public/pdfImage/PDFImage";

// Function to create and configure a new jsPDF instance
export function createPDF() {
  return new jsPDF();
}

// Function to add title and invoice details
export function addTitleAndDetails(doc, headData) {
  const formattedDate = formatDDMMYYYY(headData.soldDate);

  // Company logo/image on the left
  doc.addImage(ImageBase64URL, "PNG", 2, 5, 30, 30);

  // INVOICE title on the right
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 195, 20, { align: "right" });

  // Reset font for other text
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // BILLED TO section
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO:", 10, 45);

  doc.setFont("helvetica", "normal");

  // Customer Details
  let yPosition = 50;
  if (headData?.customer) {
    const customerName = `${headData.customer.firstName || ""} ${headData.customer.lastName || ""}`.trim();
    doc.text(capitalizeName(customerName), 10, yPosition);
    yPosition += 6;
  }

  // Invoice details on the right
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No. ${headData?.id ?? headData?.count}`, 195, 45, { align: "right" });
  doc.text(formattedDate, 195, 50, { align: "right" });

  doc.setLineWidth(0.5);
  doc.setDrawColor(170, 170, 170);
  doc.line(10, 64, 195, 64);
}
// Function to map data to table format with truncated text fields
export function mapDataToTable(data) {
  return data.map((item, index) => ({
    sno: index + 1,
    item: truncateText(item.itemDetail ?? item.itemName, 23).toUpperCase(), // Truncate text
    ...(item.company?.companyName && { company: item.company.companyName || "-" }),
    kgs: item.kgs ?? "-",
    lbs: item.lbs ?? "-",
    bales: item.onHand ? item.onHand : item.bales ? item.bales : "-",
    ...(item.onHand && { company: item.company }),
    ...(item.ratePerKgs && { kgRate: item.kgRate ?? item.ratePerKgs }),
    ...(item.ratePerLbs && { lbsRate: item.lbsRate ?? item.ratePerLbs }),
    ...(item.ratePerBales || (item.baleRate && { baleRate: item.baleRate ?? item.ratePerBales })),
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

export function addSummarySection(doc, summaryData) {
  // Get the Y position after the table
  const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 150;

  // Right-aligned X positions
  const labelX = 155; // X position for labels
  const amountX = 195; // X position for amounts

  // Total Amount (bold and larger)
  doc.text("Total", labelX, startY, { align: "right" });
  doc.text(`RS: ${summaryData.total || "0"}`, amountX, startY, { align: "right" });

  // Draw line below the total amount (dynamic height based on total position)
  doc.setLineWidth(0.5);
  doc.setDrawColor(170, 170, 170);
  doc.line(145, startY + 5, 197, startY + 5);
}

// Function to generate the table using autoTable with responsive column widths
export function generateTable(doc, tableData) {
  const hasKgRate = tableData.some((row) => row.kgRate !== undefined);
  const hasLbsRate = tableData.some((row) => row.lbsRate !== undefined);
  const hasBaleRate = tableData.some((row) => row.baleRate !== undefined);

  const columns = [
    { header: "S.No", dataKey: "sno" },
    { header: "Item Detail", dataKey: "item" },
    { header: "Company", dataKey: "company" },
    { header: "KGS", dataKey: "kgs" },
    { header: "LBS", dataKey: "lbs" },
    { header: "Bales", dataKey: "bales" },
    ...(hasKgRate ? [{ header: "KG Rate", dataKey: "kgRate" }] : []),
    ...(hasLbsRate ? [{ header: "LBS Rate", dataKey: "lbsRate" }] : []),
    ...(hasBaleRate ? [{ header: "Bale Rate", dataKey: "baleRate" }] : []),
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
    },
    theme: "grid",
    tableWidth: "auto",
    margin: { left: 11 },
  });

  const tableWidth = tempDoc.internal.pageSize.width - 20;
  const pageWidth = doc.internal.pageSize.width;
  const startX = (pageWidth - tableWidth) / 2;

  autoTable(doc, {
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 65,
    head: [columns.map((col) => col.header)],
    body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
    styles: {
      fontSize: 9,
      halign: "center",
      cellPadding: [3, 1],
      lineColor: [170, 170, 170],
      lineWidth: 0,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [170, 170, 170],
      lineWidth: 0,
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
    },
    theme: "plain",
    tableWidth: "auto",
    margin: { left: startX },
    didDrawCell: function (data) {
      // Only draw horizontal lines
      if (data.row.section === "head" || data.row.index === tableData.length - 1 || data.row.index >= 0) {
        doc.setLineWidth(0.5);
        doc.setDrawColor(170, 170, 170);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
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

export function appendTotalsRow(tableData) {
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

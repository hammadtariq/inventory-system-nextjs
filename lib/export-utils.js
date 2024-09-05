import { parse } from 'json2csv';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(data) {
  try {
    const doc = new jsPDF();

    // Set font for the title and headers
    doc.setFont('helvetica', 'bold');

    // Title and Invoice Details
    doc.setFontSize(16);
    doc.text('INVOICE', 105, 15, { align: 'center' });

    // Invoice and Customer Info - Left
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice No : T-A/A-A.D-096/2024', 10, 30);
    doc.text('Container : EA-2646/RIN-3990/JU-0857', 10, 38);
    doc.text('Vehicle No : EA-2646', 10, 46);

    // Date and Ticket Info - Right
    doc.text('Date : 21/08/2024', 150, 30);
    doc.text('Customer : ASAD', 150, 38);
    doc.text('Ticket : MIXING', 150, 46);

    // Define columns for the table
    const columns = [
      { header: 'S.No', dataKey: 'sno' },
      { header: 'Item Detail', dataKey: 'item' },
      { header: 'KGS', dataKey: 'kg' },
      { header: 'LBS', dataKey: 'lb' },
      { header: 'Bales', dataKey: 'bales' },
      { header: 'KG Rate', dataKey: 'kgRate' },
      { header: 'LBS Rate', dataKey: 'lbsRate' },
      { header: 'Bale Rate', dataKey: 'baleRate' },
      { header: 'Total Amount', dataKey: 'totalAmount' },
    ];

    // Map data to match the structure of the table
    const tableData = data.map((item, index) => ({
      sno: index + 1,
      item: item.itemDetail,
      bales: item.bales,
      lbsRate: item.lbsRate,
      totalAmount: item.totalAmount,
    }));

    // Generate Table using autoTable
    autoTable(doc, {
      startY: 60,
      head: [columns.map(col => col.header)],
      body: tableData.map(row => columns.map(col => row[col.dataKey])),
      styles: { fontSize: 10, halign: 'center', cellPadding: 4 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        sno: { halign: 'center', cellWidth: 10 },
        item: { halign: 'left', cellWidth: 60 },
        kgs: { halign: 'left', cellWidth: 20 },
        lbs: { halign: 'left', cellWidth: 20 },
        bales: { halign: 'right', cellWidth: 10 },
        kgRate: { halign: 'right', cellWidth: 20 },
        lbsRate: { halign: 'right', cellWidth: 20 },
        baleRate: { halign: 'right', cellWidth: 20 },
        totalAmount: { halign: 'right', cellWidth: 40 },
      },
      theme: 'grid',
    });

    
    // Add Net Total Section (with borders around "Rs. 8,782,783.82")
    const yPosAfterTable = doc.previousAutoTable.finalY + 10;
    const pageWidth = doc.internal.pageSize.width;

    // Net amount on the right with a box around the "Rs." value
    const netAmountText = 'Net Amount: ';
    const amount = 'Rs. 8,782,783.82';

    // Calculate width of the text to align it to the right
    const textWidth = doc.getTextWidth(netAmountText + amount);

    // PKR description on the left
    const pkText = 'PKR : EIGHT MILLION SEVEN HUNDRED EIGHTY-TWO THOUSAND SEVEN HUNDRED EIGHTY-THREE AND EIGHTY-TWO PAISA ONLY';
    const maxTextWidth = pageWidth * 0.5 - 20; // Adjust to take 50% of the page width

    // Use doc.splitTextToSize to split the long text into multiple lines
    const splitPkText = doc.splitTextToSize(pkText, maxTextWidth);

    // Calculate position for both to appear at the same vertical height
    const yPos = yPosAfterTable + 10;

    // Print the long text on the left (with line wrapping)
    doc.setFont('helvetica', 'normal');
    doc.text(splitPkText, 10, yPos); // Left align long text with line breaks

    // Right align "Net Amount" text and box on the same y-axis
    doc.setFont('helvetica', 'bold');
    doc.text(netAmountText, pageWidth - textWidth - 10, yPos);  // Right align "Net Amount" text

    // Border for Rs. amount
    const rsX = pageWidth - textWidth + doc.getTextWidth(netAmountText) - 10;
    const rsY = yPos - 5; // Adjust Y position for border

    doc.setFont('helvetica', 'normal');
    doc.rect(rsX, rsY, doc.getTextWidth(amount) + 2, 8); // Create a rectangle around "Rs." amount
    doc.text(amount, rsX + 1, yPos);  // Position Rs. text inside the box

    // Add Footer for Signature
    doc.text('Authorized Signatory', 150, yPosAfterTable + 30);

    // Output the PDF
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw new Error(`Error creating PDF: ${error.message}`);
  }
}

export function exportToCSV(data) {
  try {
    const csv = parse(data);
    return Buffer.from(csv);
  } catch (error) {
    throw new Error(`Error creating CSV: ${error.message}`);
  }
}

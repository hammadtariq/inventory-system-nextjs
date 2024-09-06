import { parse } from "json2csv";
import { createPDF } from "@/utils/export.utils";
import { addTitleAndDetails } from "@/utils/export.utils";
import { mapDataToTable } from "@/utils/export.utils";
import { calculateTotals } from "@/utils/export.utils";
import { appendTotalsRow } from "@/utils/export.utils";
import { generateTable } from "@/utils/export.utils";
import { addNetAmountSection } from "@/utils/export.utils";
// import { addImageLogo } from "@/utils/export.utils";

// Main function to export to PDF
export function exportToPDF(data, headData) {
  try {
    const doc = createPDF();

    // const imageLogoUrl = `/api/export/image/al-hamd-textiles-logo.png`;

    // if (imageLogoUrl) {
    //   addImageLogo(doc, imageLogoUrl);
    // }

    addTitleAndDetails(doc, headData);

    const tableData = mapDataToTable(data);
    const totals = calculateTotals(tableData);
    const updatedTableData = appendTotalsRow(tableData, totals);

    generateTable(doc, updatedTableData);

    addNetAmountSection(doc, totals.totalAmount);

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("Error creating PDF:", error);
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

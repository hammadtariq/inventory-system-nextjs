import { createPDF } from "@/utils/export.utils";
import { addTitleAndDetails } from "@/utils/export.utils";
import { mapDataToTable } from "@/utils/export.utils";
import { calculateTotals } from "@/utils/export.utils";
import { appendTotalsRow } from "@/utils/export.utils";
import { generateTable } from "@/utils/export.utils";
import { addNetAmountSection } from "@/utils/export.utils";
import { PRINT_TYPE } from "@/utils/ui.util";
import { json2csv } from "json-2-csv";

// Main function to export to PDF
export function exportToPDF(data, headData, typeOf) {
  try {
    const doc = createPDF();

    addTitleAndDetails(doc, headData);

    const tableData = mapDataToTable(data);
    const totals = calculateTotals(tableData);
    const updatedTableData = appendTotalsRow(tableData, totals);

    generateTable(doc, updatedTableData);

    if (typeOf === PRINT_TYPE.WITH_RATES) {
      addNetAmountSection(doc, totals.totalAmount);
    }

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("Error creating PDF:", error);
    throw new Error(`Error creating PDF: ${error.message}`);
  }
}

export function exportToCSV(data) {
  try {
    const csv = json2csv(data);
    return Buffer.from(csv);
  } catch (error) {
    console.error("Error creating CSV:", error);
    throw new Error(`Error creating CSV: ${error.message}`);
  }
}

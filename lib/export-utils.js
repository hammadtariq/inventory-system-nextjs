import { addSummarySection, createPDF } from "@/utils/export.utils";
import { addTitleAndDetails } from "@/utils/export.utils";
import { mapDataToTable } from "@/utils/export.utils";
import { calculateTotals } from "@/utils/export.utils";
import { appendTotalsRow } from "@/utils/export.utils";
import { generateTable } from "@/utils/export.utils";
import { generateQuotationTable } from "@/utils/export.utils";
import { addNetAmountSection } from "@/utils/export.utils";
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

    const hasCustomerName = Boolean(
      `${headData?.customer?.firstName || ""} ${headData?.customer?.lastName || ""}`.trim()
    );

    if (hasCustomerName) {
      addNetAmountSection(doc, totals.totalAmount, headData?.laborCharge || 0);
    } else {
      addSummarySection(doc, {
        total: totals.totalAmount,
      });
    }

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("Error creating PDF:", error);
    throw new Error(`Error creating PDF: ${error.message}`);
  }
}

export function exportQuotationToPDF(data, headData) {
  try {
    const doc = createPDF();

    addTitleAndDetails(doc, headData, "QUOTATION");

    // Compute per-item totalAmount from rate/weight fields before mapping
    const dataWithTotals = data.map((item) => {
      const {
        ratePerKgs = 0,
        baleWeightKgs = 0,
        ratePerLbs = 0,
        baleWeightLbs = 0,
        noOfBales = 0,
        ratePerBale = 0,
      } = item;
      let totalAmount = 0;
      if (ratePerKgs && baleWeightKgs) totalAmount = ratePerKgs * baleWeightKgs;
      else if (ratePerLbs && baleWeightLbs) totalAmount = ratePerLbs * baleWeightLbs;
      else if (noOfBales && ratePerBale) totalAmount = noOfBales * ratePerBale;
      return { ...item, totalAmount };
    });

    const tableData = mapDataToTable(dataWithTotals);
    const totals = calculateTotals(tableData);
    const updatedTableData = appendTotalsRow(tableData, totals);

    generateTable(doc, updatedTableData);
    addNetAmountSection(doc, totals.totalAmount, 0, true);

    doc.save(`quotation_${Date.now()}.pdf`);
  } catch (error) {
    console.error("Error creating quotation PDF:", error);
    throw new Error(`Error creating quotation PDF: ${error.message}`);
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

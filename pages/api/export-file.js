import { exportToPDF, exportToCSV } from '@/lib/export-utils';

export const exportHandler = async (req, res) => {
  const { type, data } = req.body;

  if (type === 'pdf') {
    try {
      const pdfBuffer = await exportToPDF(data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="export.pdf"');
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      res.status(500).json({ error: 'Error exporting PDF' });
    }
  } else if (type === 'csv') {
    try {
      const csvBuffer = await exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      res.send(csvBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Error exporting CSV' });
    }
  } else {
    res.status(400).json({ error: 'Invalid export type' });
  }
};

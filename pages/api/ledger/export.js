import { exportHandler } from 'pages/api/export-file';

export default async function handler(req, res) {
  console.log('ledger export file handler')
  await exportHandler(req, res);
}
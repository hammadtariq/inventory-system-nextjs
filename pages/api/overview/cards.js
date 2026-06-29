import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

export const getCards = async (req, res) => {
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const queryOptions = {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { organizationId, year },
    };

    const [totalSalesResult, totalPurchasesResult, customerBalances, companyBalances] = await Promise.all([
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM sales
         WHERE status = 'APPROVED'
           AND "organizationId" = :organizationId
           AND EXTRACT(YEAR FROM "soldDate") = :year`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM("totalAmount"), 0) as total
         FROM purchases
         WHERE status = 'APPROVED'
           AND "organizationId" = :organizationId
           AND EXTRACT(YEAR FROM "purchaseDate") = :year`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM(t.total), 0) as total FROM (
          SELECT c."id",
            SUM(CASE
              WHEN l."paymentType" = 'REFUND' THEN -l.amount
              WHEN l."paymentType" IN ('CASH', 'ONLINE', 'CHEQUE') THEN l.amount
              WHEN l."paymentType" = 'INVENTORY_RETURN' THEN l.amount
              WHEN l."spendType" = 'DEBIT' THEN l.amount
              WHEN l."spendType" = 'CREDIT' THEN -l.amount
              ELSE 0
            END) AS total
          FROM ledgers l
          INNER JOIN customers c ON l."customerId" = c.id
          WHERE l."organizationId" = :organizationId
            AND c."organizationId" = :organizationId
            AND EXTRACT(YEAR FROM l."createdAt") = :year
          GROUP BY c."id"
        ) t WHERE t.total > 0`,
        queryOptions
      ),
      db.sequelize.query(
        `SELECT COALESCE(SUM(t.total), 0) as total FROM (
          SELECT comp."id",
            SUM(CASE
              WHEN l."paymentType" IN ('CASH', 'ONLINE', 'CHEQUE') THEN -l.amount
              WHEN l."spendType" = 'CREDIT' THEN -l.amount
              WHEN l."spendType" = 'DEBIT' THEN l.amount
              ELSE 0
            END) AS total
          FROM ledgers l
          INNER JOIN companies comp ON l."companyId" = comp.id
          WHERE l."organizationId" = :organizationId
            AND comp."organizationId" = :organizationId
            AND EXTRACT(YEAR FROM l."createdAt") = :year
          GROUP BY comp."id"
        ) t WHERE t.total < 0`,
        queryOptions
      ),
    ]);

    return res.send({
      totalSales: parseFloat(totalSalesResult[0].total) || 0,
      totalPurchases: parseFloat(totalPurchasesResult[0].total) || 0,
      totalSaleDue: parseFloat(customerBalances[0].total) || 0,
      totalPurchaseDue: parseFloat(companyBalances[0].total) || 0,
    });
  } catch (error) {
    console.error("Error retrieving dashboard cards:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getCards);

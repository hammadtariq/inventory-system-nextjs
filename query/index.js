export const companyTotalBalesQuery = `
SELECT "companies"."companyName" as name,
  SUM(CASE
    WHEN "inventories"."onHand" > 0 THEN "inventories"."onHand"
    ELSE 0
  END) AS total
FROM inventories
INNER JOIN companies ON "inventories"."companyId" = companies.id
GROUP BY "companies"."id";`;

export const companyQuery = `SELECT "companies"."companyName" as name,
"companies"."createdAt" as "createdAt",
"companies"."id" as "id",
SUM(
    CASE 
        WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
        - amount
        WHEN "ledgers"."spendType" = 'CREDIT' THEN
        - amount
        WHEN "ledgers"."spendType" = 'DEBIT' THEN
        amount
    ELSE
        0
    END) AS total
FROM ledgers
INNER JOIN companies ON "ledgers"."companyId" = companies.id
GROUP BY "companies"."id"`;

export const customerQuery = `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
c."id" as "id",
SUM(
    CASE
        WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
        amount
        WHEN "ledgers"."spendType" = 'DEBIT' THEN
        amount
        WHEN "ledgers"."spendType" = 'CREDIT' THEN
        - amount
    ELSE
        0
    END) AS total
FROM ledgers
INNER JOIN customers c ON "ledgers"."customerId" = c.id
GROUP BY c."id"`;

export const companySumQuery = (id) => `SELECT SUM(
    CASE 
		WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
		- amount
		WHEN "ledgers"."spendType" = 'CREDIT' THEN
        - amount
		WHEN "ledgers"."spendType" = 'DEBIT' THEN
        amount
    ELSE
        0
    END) AS amount
FROM ledgers
INNER JOIN companies ON "ledgers"."companyId" = companies.id
WHERE "ledgers"."companyId" = ${id}
GROUP BY "companies"."id"`;

export const customerSumQuery = (id) => `SELECT SUM(
    CASE
        WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
        amount
        WHEN "ledgers"."spendType" = 'DEBIT' THEN
        amount
        WHEN "ledgers"."spendType" = 'CREDIT' THEN
        - amount
    ELSE
        0
    END) AS amount
FROM ledgers
INNER JOIN customers ON "ledgers"."customerId" = customers.id
WHERE "ledgers"."customerId" = ${id}
GROUP BY "customers"."id"`;

export const purchaseGraphQuery = `SELECT EXTRACT(YEAR FROM "purchaseDate") AS year, COUNT(*)::integer AS count
  FROM "purchases"
  GROUP BY year
  ORDER BY year;`;

export const saleGraphQuery = `SELECT EXTRACT(YEAR FROM "soldDate") AS year, COUNT(*)::integer AS count
FROM "sales"
GROUP BY year
ORDER BY year`;

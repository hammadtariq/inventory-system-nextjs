export const companyTotalBalesQuery = `
SELECT "companies"."companyName" as name,
  SUM(CASE
    WHEN "inventories"."onHand" > 0 THEN "inventories"."onHand"
    ELSE 0
  END) AS total
FROM inventories
INNER JOIN companies ON "inventories"."companyId" = companies.id
WHERE "inventories"."organizationId" = :organizationId
  AND companies."organizationId" = :organizationId
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
WHERE "ledgers"."organizationId" = :organizationId
AND companies."organizationId" = :organizationId
GROUP BY "companies"."id"`;

export const customerQuery = `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
c."id" as "id",
SUM(
    CASE
        WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' OR "ledgers"."paymentType" = 'REFUND' THEN
        amount
        WHEN "ledgers"."paymentType" = 'INVENTORY_RETURN' THEN
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
WHERE "ledgers"."organizationId" = :organizationId
AND c."organizationId" = :organizationId
GROUP BY c."id"`;

export const companySumQuery = `SELECT SUM(
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
WHERE "ledgers"."companyId" = :id
AND "ledgers"."organizationId" = :organizationId
AND companies."organizationId" = :organizationId
GROUP BY "companies"."id"`;

export const customerSumQuery = `SELECT SUM(
    CASE
        WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' OR "ledgers"."paymentType" = 'REFUND' THEN
        amount
        WHEN "ledgers"."paymentType" = 'INVENTORY_RETURN' THEN
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
WHERE "ledgers"."customerId" = :id
AND "ledgers"."organizationId" = :organizationId
AND customers."organizationId" = :organizationId
GROUP BY "customers"."id"`;

export const purchaseGraphQuery = `SELECT EXTRACT(YEAR FROM "purchaseDate") AS year, COUNT(*)::integer AS count
  FROM "purchases"
  WHERE "organizationId" = :organizationId
  GROUP BY year
  ORDER BY year;`;

export const saleGraphQuery = `SELECT EXTRACT(YEAR FROM "soldDate") AS year, COUNT(*)::integer AS count
FROM "sales"
WHERE "organizationId" = :organizationId
GROUP BY year
ORDER BY year`;

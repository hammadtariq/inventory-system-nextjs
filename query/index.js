export const companyQuery = `SELECT "companies"."companyName" as name,
"companies"."createdAt" as "createdAt",
"companies"."id" as "id",
SUM(
    CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
        amount
    WHEN "ledgers"."spendType" = 'DEBIT' THEN
        - amount
    ELSE
        0
    END) AS total
FROM ledgers
INNER JOIN companies ON "ledgers"."companyId" = companies.id
GROUP BY "companies"."id"`;

export const customerQuery = `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
c."id" as "id",
SUM(
    CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
        amount
    WHEN "ledgers"."spendType" = 'DEBIT' THEN
        - amount
    ELSE
        0
    END) AS total
FROM ledgers
INNER JOIN customers c ON "ledgers"."customerId" = c.id
GROUP BY c."id"`;

export const companySumQuery = (id) => `SELECT SUM(
    CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
        amount
    WHEN "ledgers"."spendType" = 'DEBIT' THEN
        - amount
    ELSE
        0
    END) AS amount
FROM ledgers
INNER JOIN companies ON "ledgers"."companyId" = companies.id
WHERE "ledgers"."companyId" = ${id}
GROUP BY "companies"."id"`;

export const customerSumQuery = (id) => `SELECT SUM(
    CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
        amount
    WHEN "ledgers"."spendType" = 'DEBIT' THEN
        - amount
    ELSE
        0
    END) AS amount
FROM ledgers
INNER JOIN customers ON "ledgers"."customerId" = customers.id
WHERE "ledgers"."customerId" = ${id}
GROUP BY "customers"."id"`;

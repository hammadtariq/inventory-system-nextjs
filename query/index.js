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

// A ledger row is "legacy" when none of the new pay-to/pay-by role columns are set.
// Legacy rows keep the original paymentType/spendType-derived sign. Role-based rows
// (including the dual-filled default Company/Customer combo) use the uniform rule:
// Pay To contributes -amount, Pay By contributes +amount, for the selected party.
const LEGACY_ROW_CONDITION = `"ledgers"."payToCompanyId" IS NULL AND "ledgers"."payToCustomerId" IS NULL
      AND "ledgers"."payByCompanyId" IS NULL AND "ledgers"."payByCustomerId" IS NULL`;

export const companyQuery = `SELECT "companies"."companyName" as name,
"companies"."createdAt" as "createdAt",
"companies"."id" as "id",
SUM(
    CASE
      WHEN ${LEGACY_ROW_CONDITION} THEN
        CASE
          WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
          - amount
          WHEN "ledgers"."spendType" = 'CREDIT' THEN
          - amount
          WHEN "ledgers"."spendType" = 'DEBIT' THEN
          amount
          ELSE
          0
        END
      WHEN "ledgers"."payToCompanyId" = companies.id THEN
      - amount
      WHEN "ledgers"."payByCompanyId" = companies.id THEN
      amount
      ELSE
      0
    END) AS total
FROM ledgers
INNER JOIN companies ON (
  "ledgers"."companyId" = companies.id
  OR "ledgers"."payToCompanyId" = companies.id
  OR "ledgers"."payByCompanyId" = companies.id
)
WHERE "ledgers"."organizationId" = :organizationId
AND companies."organizationId" = :organizationId
GROUP BY "companies"."id"`;

export const customerQuery = `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
c."id" as "id",
SUM(
    CASE
      WHEN ${LEGACY_ROW_CONDITION} THEN
        CASE
          WHEN "ledgers"."paymentType" = 'REFUND' THEN
          - amount
          WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
          amount
          WHEN "ledgers"."paymentType" = 'INVENTORY_RETURN' THEN
          amount
          WHEN "ledgers"."spendType" = 'DEBIT' THEN
          amount
          WHEN "ledgers"."spendType" = 'CREDIT' THEN
          - amount
          ELSE
          0
        END
      WHEN "ledgers"."payToCustomerId" = c.id THEN
      - amount
      WHEN "ledgers"."payByCustomerId" = c.id THEN
      amount
      ELSE
      0
    END) AS total
FROM ledgers
INNER JOIN customers c ON (
  "ledgers"."customerId" = c.id
  OR "ledgers"."payToCustomerId" = c.id
  OR "ledgers"."payByCustomerId" = c.id
)
WHERE "ledgers"."organizationId" = :organizationId
AND c."organizationId" = :organizationId
GROUP BY c."id"`;

export const companySumQuery = `SELECT SUM(
    CASE
      WHEN ${LEGACY_ROW_CONDITION} THEN
        CASE
          WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
          - amount
          WHEN "ledgers"."spendType" = 'CREDIT' THEN
          - amount
          WHEN "ledgers"."spendType" = 'DEBIT' THEN
          amount
          ELSE
          0
        END
      WHEN "ledgers"."payToCompanyId" = companies.id THEN
      - amount
      WHEN "ledgers"."payByCompanyId" = companies.id THEN
      amount
      ELSE
      0
    END) AS amount
FROM ledgers
INNER JOIN companies ON (
  "ledgers"."companyId" = companies.id
  OR "ledgers"."payToCompanyId" = companies.id
  OR "ledgers"."payByCompanyId" = companies.id
)
WHERE companies.id = :id
AND "ledgers"."organizationId" = :organizationId
AND companies."organizationId" = :organizationId
GROUP BY "companies"."id"`;

export const customerSumQuery = `SELECT SUM(
    CASE
      WHEN ${LEGACY_ROW_CONDITION} THEN
        CASE
          WHEN "ledgers"."paymentType" = 'REFUND' THEN
          - amount
          WHEN "ledgers"."paymentType" = 'CASH' OR "ledgers"."paymentType" = 'ONLINE' OR "ledgers"."paymentType" = 'CHEQUE' THEN
          amount
          WHEN "ledgers"."paymentType" = 'INVENTORY_RETURN' THEN
          amount
          WHEN "ledgers"."spendType" = 'DEBIT' THEN
          amount
          WHEN "ledgers"."spendType" = 'CREDIT' THEN
          - amount
          ELSE
          0
        END
      WHEN "ledgers"."payToCustomerId" = customers.id THEN
      - amount
      WHEN "ledgers"."payByCustomerId" = customers.id THEN
      amount
      ELSE
      0
    END) AS amount
FROM ledgers
INNER JOIN customers ON (
  "ledgers"."customerId" = customers.id
  OR "ledgers"."payToCustomerId" = customers.id
  OR "ledgers"."payByCustomerId" = customers.id
)
WHERE customers.id = :id
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

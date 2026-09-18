# Ledger Create Flexible Pay To / Pay By - Backend Spec

## Scope

Update the existing manual ledger payment backend so `POST /api/ledger/createPayment` supports:

- Pay To Company, Pay By Customer
- Pay To Customer, Pay By Company
- Pay To Company, Pay By Company
- Pay To Customer, Pay By Customer

The existing Pay To Company / Pay By Customer behavior must continue to work exactly as it does today.

Do not add unrelated payment types, ledger edit/delete, invoice allocation, party creation, seed data changes, or dashboard redesigns.

## Current Backend Implementation

Current create route:

- `pages/api/ledger/createPayment.js`
- route: `POST /api/ledger/createPayment`
- uses `auth`
- validates with Joi
- optionally creates a Cheque
- calls `createLedgerPayment` from `lib/ledger.js`

Current ledger helper:

- `lib/ledger.js`
- `createLedgerPayment` accepts `companyId`, `customerId`, `totalAmount`, `spendType`, `paymentType`, `paymentDate`, `otherName`, `reference`
- when `paymentType` exists:
  - company balance is calculated as previous company balance minus amount
  - customer balance is calculated as previous customer balance plus amount
- creates one `Ledger` row

Current model:

- `models/ledger.js`
- existing party columns:
  - `companyId`
  - `customerId`
- existing running-balance columns:
  - `totalBalance`
  - `companyTotal`
  - `customerTotal`

Current read paths that depend on `companyId` and `customerId`:

- `query/index.js`
- `utils/query.utils.js`
- `pages/api/ledger/index.js`
- `pages/api/ledger/[id].js`
- `pages/api/ledger/exportCustomer.js`

Existing create callers that must remain compatible:

- `pages/ledger/create.js`, currently sends Company paid-to and Customer paid-by data.
- `pages/ledger/refund.js`, currently sends a `customerId`-only refund payload.
- `pages/api/sales/returns/index.js`, currently calls `createLedgerPayment` directly with `customerId`.

## Why A Migration Is Required

The existing schema has only one `companyId` and one `customerId`.

That can represent the current legacy case:

- Pay To Company
- Pay By Customer

It cannot correctly represent:

- Company A pays Company B
- Customer A pays Customer B

Those cases require two companies or two customers in one payment. Therefore a small additive migration is required.

## Safe Database Change

Add only these nullable columns to `ledgers`:

- `payToCompanyId`
- `payToCustomerId`
- `payByCompanyId`
- `payByCustomerId`
- `payToTotal`
- `payByTotal`

Column types:

- id columns: integer, nullable
- total columns: float, nullable

Reason for each column:

- `payToCompanyId`: stores Pay To when the receiver is a company.
- `payToCustomerId`: stores Pay To when the receiver is a customer.
- `payByCompanyId`: stores Pay By when the payer is a company.
- `payByCustomerId`: stores Pay By when the payer is a customer.
- `payToTotal`: stores the selected Pay To party's running balance after this payment.
- `payByTotal`: stores the selected Pay By party's running balance after this payment.

Do not remove, rename, or repurpose existing columns:

- `companyId`
- `customerId`
- `totalBalance`
- `companyTotal`
- `customerTotal`
- `spendType`
- `paymentType`

Existing rows must remain valid with all new columns as `NULL`.

Migration safety requirements:

- `up` only adds the six nullable columns.
- `down` removes only those six newly-added columns.
- No data deletion.
- No table drops.
- No truncation.
- No seeders.
- No backfill required.

Do not introduce:

- `DROP DATABASE`
- `DROP TABLE`
- `TRUNCATE`
- database reset commands
- destructive scripts
- destructive migration steps

## Model Changes

Modify only `models/ledger.js` for the model layer.

Add fields:

- `payToCompanyId`
- `payToCustomerId`
- `payByCompanyId`
- `payByCustomerId`
- `payToTotal`
- `payByTotal`

Keep existing fields and existing associations unchanged.

Add aliased `belongsTo` associations only if needed by the read APIs:

- `payToCompany`
- `payToCustomer`
- `payByCompany`
- `payByCustomer`

Do not modify `models/company.js` or `models/customer.js` unless Sequelize requires reverse aliases for a specific query. The existing code reads ledger rows from `Ledger`, so reverse associations should not be necessary.

## Request Compatibility

The existing manual create payload must remain accepted:

```json
{
  "companyId": 1,
  "customerId": 2,
  "totalAmount": 1000,
  "spendType": "DEBIT",
  "paymentType": "CASH",
  "paymentDate": "2026-09-07T00:00:00.000Z",
  "reference": "",
  "otherName": ""
}
```

The existing refund-style payload must also remain accepted:

```json
{
  "customerId": 2,
  "totalAmount": 1000,
  "spendType": "CREDIT",
  "paymentType": "REFUND",
  "paymentDate": "2026-09-07T00:00:00.000Z",
  "reference": ""
}
```

The new payload must be accepted:

```json
{
  "payToType": "company",
  "payToId": 1,
  "payByType": "customer",
  "payById": 2,
  "totalAmount": 1000,
  "spendType": "DEBIT",
  "paymentType": "CASH",
  "paymentDate": "2026-09-07T00:00:00.000Z",
  "reference": "",
  "otherName": ""
}
```

Allowed role types:

- `company`
- `customer`

Do not add more role types.

Response shape:

- keep returning the created ledger row on success
- keep validation errors as HTTP 400 with `{ message }`
- keep unexpected errors as HTTP 500 with `{ message }`

## Validation

Modify Joi validation in `pages/api/ledger/createPayment.js`.

Required validation:

- `totalAmount` is required and must be greater than 0.
- `spendType` remains required.
- `paymentType` is required.
- `paymentDate` is required.
- For new payloads, `payToType`, `payToId`, `payByType`, and `payById` are required.
- For legacy payloads, current `companyId` and/or `customerId` handling remains accepted.
- `payToType` and `payByType` must be `company` or `customer`.
- `payToId` and `payById` must be valid ids, except the existing legacy `Other` sentinel `-1`.
- If `payToType === payByType` and `payToId === payById`, reject the request.
- If `paymentType === "CHEQUE"`, `chequeId` and `dueDate` are required.
- If `paymentType !== "CHEQUE"`, `chequeId` and `dueDate` are not required.

Entity validation:

- If Pay To is Company, verify the company exists.
- If Pay To is Customer, verify the customer exists.
- If Pay By is Company, verify the company exists.
- If Pay By is Customer, verify the customer exists.

Existing `Other` behavior:

- Preserve current support for one `Other` side in the legacy Company/Customer flow.
- Reject both sides as `Other`.
- Do not add new `Other` behavior for Customer/Company, Company/Company, or Customer/Customer.

## Role Payload Handling

Add one small role-mapping function for requests that include the new role fields.

New role payload:

```js
{
  payToType, payToId, payByType, payById;
}
```

maps to the new ledger columns:

```js
{
  payToCompanyId, payToCustomerId, payByCompanyId, payByCustomerId;
}
```

Legacy payloads that do not include role fields must continue through the current `companyId`/`customerId` behavior. Do not require role fields for existing refund, sales return, purchase, or sales flows.

For a new role payload where:

```js
payToType === "company" && payByType === "customer";
```

also fill the existing legacy columns exactly as the current manual create flow does.

## Ledger Creation Logic

Modify `createLedgerPayment` in `lib/ledger.js`.

Required behavior:

- Continue accepting existing callers that pass only `companyId` and/or `customerId`.
- Accept the new role fields.
- Preserve the existing Pay To Company / Pay By Customer balance result.
- Create one ledger row per payment.

Balance rule for manual payment rows:

- Pay To party total = previous balance for that party minus `totalAmount`.
- Pay By party total = previous balance for that party plus `totalAmount`.
- The previous balance lookup must use the updated role-aware balance logic, so it includes both legacy rows and new role-based rows for that party.

This preserves the current behavior for the existing Company/Customer payment:

- company total decreases
- customer total increases

When saving a new role-based row:

- fill exactly one Pay To id column:
  - `payToCompanyId` or `payToCustomerId`
- fill exactly one Pay By id column:
  - `payByCompanyId` or `payByCustomerId`
- save `payToTotal`
- save `payByTotal`
- save existing common ledger fields:
  - `amount`
  - `spendType`
  - `paymentType`
  - `paymentDate`
  - `reference`
  - `otherName`
  - `transactionId`
  - `invoiceNumber`

For the legacy Company/Customer combination, also continue filling existing legacy columns exactly as today:

- `companyId`
- `customerId`
- `companyTotal`
- `customerTotal`
- `totalBalance`

For non-legacy combinations, do not fill `companyId` or `customerId` with reversed or ambiguous role data.

## Read API Changes

Update read APIs only enough for new rows to appear correctly.

Modify:

- `query/index.js`
- `utils/query.utils.js`
- `pages/api/ledger/index.js`
- `pages/api/ledger/[id].js`
- `pages/api/ledger/exportCustomer.js`

Required rules:

- Existing legacy rows must still be included exactly as before.
- New role-based rows must be included when the selected party appears on either side.
- Avoid double-counting rows that contain both legacy columns and new role columns.

Company ledger detail should include rows where:

- legacy row: `companyId = selected id` and all new role columns are null
- new row: `payToCompanyId = selected id` or `payByCompanyId = selected id`

Customer ledger detail should include rows where:

- legacy row: `customerId = selected id` and all new role columns are null
- new row: `payToCustomerId = selected id` or `payByCustomerId = selected id`

For each returned detail row, include computed fields:

- `payToName`
- `payByName`
- `partyBalance`

`partyBalance` rules:

- for a new row where selected party is Pay To, use `payToTotal`
- for a new row where selected party is Pay By, use `payByTotal`
- for a legacy company row, keep current `companyTotal || totalBalance`
- for a legacy customer row, keep current `customerTotal || totalBalance`

`payToName` and `payByName` rules:

- for new rows, resolve names from the role-specific company/customer ids
- for legacy rows, keep current fallback:
  - Pay To name from `company.companyName` or `otherName`
  - Pay By name from customer full name or `otherName`

Summary queries must use the same legacy-vs-new distinction:

- use existing `companyId` / `customerId` logic only for rows where new role columns are null
- use role-specific id columns for new rows
- for the selected party, Pay To rows contribute `-amount`
- for the selected party, Pay By rows contribute `+amount`
- these updated summary queries must also be used by balance lookup during new ledger creation

## Export Changes

Modify only:

- `pages/api/ledger/exportCustomer.js`

Required behavior:

- Existing exports for legacy rows remain compatible.
- New rows appear in exports for the selected party.
- Paid To uses `payToName` when available.
- Closing Balance uses `partyBalance` when available.
- Keep the existing export columns and file types.

Do not rename export files or add new export formats.

## Existing Callers That Must Not Break

Do not require role fields from these paths:

- existing direct calls to `/api/ledger/createPayment` using `companyId` and `customerId`
- existing `/ledger/refund` calls using only `customerId`
- `pages/api/sales/returns/index.js`
- purchase approval ledger creation
- sales approval ledger creation

Do not modify purchase approval or sales approval for this feature unless a test proves the shared helper change requires a small compatibility fix.

## Testing

Add or update backend tests for:

Legacy behavior:

1. Old `companyId` + `customerId` payload still creates successfully.
2. Legacy created row still fills `companyId`, `customerId`, `companyTotal`, `customerTotal`, and `totalBalance`.
3. Legacy balance behavior remains unchanged.
4. Cheque payment validation still works.
5. Existing `customerId`-only refund-style payload still creates successfully.

New behavior:

1. Pay To Company, Pay By Customer.
2. Pay To Customer, Pay By Company.
3. Pay To Company, Pay By Company with different ids.
4. Pay To Customer, Pay By Customer with different ids.
5. Same company on both sides is rejected.
6. Same customer on both sides is rejected.
7. Invalid party type is rejected.
8. Missing role fields are rejected for new payloads.
9. Nonexistent company/customer id is rejected.
10. Non-positive amount is rejected.

Read/export behavior:

1. Company ledger detail includes role-based rows where the company is Pay To.
2. Company ledger detail includes role-based rows where the company is Pay By.
3. Customer ledger detail includes role-based rows where the customer is Pay To.
4. Customer ledger detail includes role-based rows where the customer is Pay By.
5. Legacy ledger detail still displays old rows correctly.
6. Export includes new role-based rows for the selected party.
7. Export still works for legacy rows.

Regression checks:

1. `/ledger?type=company`
2. `/ledger?type=customer`
3. `/ledger/[id]?type=company`
4. `/ledger/[id]?type=customer`
5. `/ledger/refund`
6. purchase approval
7. sales approval
8. sales return/refund

## Implementation Order

1. Add the safe additive migration with the six nullable columns.
2. Update `models/ledger.js`.
3. Update Joi validation in `pages/api/ledger/createPayment.js`.
4. Add role payload mapping.
5. Update `lib/ledger.js` to create role-based ledger rows while preserving legacy behavior.
6. Update ledger summary/detail queries to include new role columns without double-counting legacy rows.
7. Update export logic to use role-aware names and balances.
8. Add or update tests for legacy behavior and the four new party combinations.
9. Run regression checks for ledger create, ledger detail, ledger export, refund, purchase approval, sales approval, and sales return/refund.

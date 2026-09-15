# Ledger Create Flexible Pay To / Pay By - Frontend Spec

## Scope

Update the existing Ledger Create UI so manual payments can be created with:

- Pay To: Company or Customer
- Pay By: Company or Customer

The existing default flow must remain the same:

- Pay To defaults to Company.
- Pay By defaults to Customer.
- Cash, Online, and Cheque payment types remain unchanged.
- Cheque fields remain conditional.
- Payment Date still blocks future dates.
- Reference remains optional.
- Successful create still redirects to `/ledger`.
- Existing permission behavior for the Create button remains unchanged.

Do not add unrelated screens, payment types, party creation, invoice allocation, ledger editing, or layout redesigns.

## Current Frontend Implementation

Current Ledger Create file:

- `pages/ledger/create.js`

Current supporting hooks/utilities:

- `hooks/ledger.js`
- `hooks/company.js`
- `hooks/customers.js`
- `utils/api.util.js`
- `utils/filter.util.js`
- `utils/ui.util.js`

Current behavior in `pages/ledger/create.js`:

- Companies are loaded with `useCompanyAttributes(["companyName", "id"])`.
- Customers are loaded with `useCustomerAttributes(["firstName", "lastName", "id"])`.
- The Paid To field is always the company selector.
- The Paid By field is always the customer selector.
- `onFinish` posts through `createPayment` from `hooks/ledger.js`.
- `createPayment` posts to `/api/ledger/createPayment`.
- The submitted payload currently includes `companyId`, `customerId`, `totalAmount`, `spendType`, `paymentDate`, `paymentType`, optional cheque fields, `otherName`, and `reference`.

## Required File Changes

Modify:

- `pages/ledger/create.js`
- `pages/ledger/[id].js`

Do not modify unless a backend contract change makes it necessary:

- `hooks/ledger.js`
- `hooks/company.js`
- `hooks/customers.js`
- `components/selectCompany.js`
- `components/selectCustomer.js`
- `pages/ledger/index.js`
- `pages/ledger/refund.js`
- purchase pages
- sales pages
- sale return pages

## Ledger Create UI Changes

In `pages/ledger/create.js`, add one type selector for each party role:

- `payToType`
- `payByType`

Allowed values:

- `company`
- `customer`

Default values:

```js
payToType = "company";
payByType = "customer";
```

Add role-specific selected ids:

- `payToId`
- `payById`

Required rendering rules:

- If `payToType === "company"`, Pay To shows the existing company options.
- If `payToType === "customer"`, Pay To shows the existing customer options.
- If `payByType === "company"`, Pay By shows the existing company options.
- If `payByType === "customer"`, Pay By shows the existing customer options.

Keep existing dropdown behavior:

- `showSearch`
- `filterOption={selectSearchFilter}`
- `optionFilterProp="children"`
- `allowClear`
- company loading uses `companyLoading`
- customer loading uses `customerLoading`

Do not add new data-fetching hooks or new dropdown endpoints.

## Existing Other Option

The current form adds `Other` with id `-1` to:

- Paid To company options
- Paid By customer options

This behavior must continue for the default legacy flow:

- Pay To Type = Company
- Pay By Type = Customer

Do not expand `Other` to the new combinations unless the backend explicitly supports role-specific other parties.

Keep the existing rule that both sides cannot be `Other` at the same time.

## Form Validation

Required frontend validation:

- `payToType` is required.
- `payToId` is required.
- `payByType` is required.
- `payById` is required.
- `totalAmount` remains required.
- `paymentDate` remains required.
- `reference` remains optional.
- `chequeId` is required only when payment type is Cheque.
- `dueDate` is required only when payment type is Cheque.

Same-party validation:

- If `payToType === payByType` and `payToId === payById`, block submission.
- This validation applies only when both ids are real entity ids.
- Do not block same-type payments between different companies or different customers.

Other validation:

- If one side is `-1`, require `otherName`.
- If both sides are `-1`, block submission.

## State Behavior

When a party type changes:

- Clear that role's selected id.
- Clear that role's form field value.
- Do not clear unrelated fields such as amount, payment type, payment date, cheque fields, or reference.

Examples:

- Changing Pay To from Company to Customer clears only Pay To selection.
- Changing Pay By from Customer to Company clears only Pay By selection.

## Submit Payload

Continue calling:

```js
createPayment(params);
```

The new payload sent by `pages/ledger/create.js` must include:

```js
{
  payToType,
  payToId,
  payByType,
  payById,
  totalAmount,
  spendType: SPEND_TYPE.DEBIT,
  paymentDate: dayjs(paymentDate),
  paymentType,
  reference,
  otherName
}
```

For Cheque, continue adding:

```js
{
  chequeId: values.chequeId,
  dueDate: values.dueDate
}
```

Do not send reversed legacy fields. For example, do not send `companyId` for Pay By Company or `customerId` for Pay To Customer.

The backend remains responsible for supporting old `companyId`/`customerId` payloads from existing callers.

## Ledger Detail UI Compatibility

`pages/ledger/[id].js` currently renders:

- Paid By from `record.customer`
- Paid To from `record.company`
- Balance from `companyTotal`, `customerTotal`, or `totalBalance`

After backend changes, use role-aware fields when present:

- Paid By column:
  - use `record.payByName` if present
  - otherwise keep the existing `record.customer` / `otherName` fallback
- Paid To column:
  - use `record.payToName` if present
  - otherwise keep the existing `record.company` / `otherName` fallback
- Balance column:
  - use `record.partyBalance` if present
  - otherwise keep the existing company/customer balance fallback

Do not change the existing invoice link behavior, action column behavior, export button, or table structure except for these field fallbacks.

## Backward Compatibility Checks

Existing behavior that must still pass:

1. `/ledger/create` opens with Pay To Company and Pay By Customer.
2. Existing Company-paid-to and Customer-paid-by Cash payment still creates successfully.
3. Existing Company-paid-to and Customer-paid-by Online payment still creates successfully.
4. Existing Company-paid-to and Customer-paid-by Cheque payment still creates successfully.
5. Cheque ID and Due Date still appear only for Cheque.
6. Future Payment Date is still disabled.
7. Create button still respects `canCreate`.
8. Success still redirects to `/ledger`.
9. Existing legacy `Other` behavior still works in the default flow.
10. `/ledger/[id]?type=company` and `/ledger/[id]?type=customer` still display old rows correctly.

New behavior that must pass:

1. Pay To Company, Pay By Customer.
2. Pay To Customer, Pay By Company.
3. Pay To Company, Pay By Company with different companies.
4. Pay To Customer, Pay By Customer with different customers.
5. Same company selected on both sides is blocked.
6. Same customer selected on both sides is blocked.
7. Changing Pay To Type clears only Pay To selection.
8. Changing Pay By Type clears only Pay By selection.
9. Newly created rows show correct Paid To and Paid By names in ledger detail.

## Implementation Order

1. Update `pages/ledger/create.js` with `payToType`, `payToId`, `payByType`, and `payById` state.
2. Add Pay To Type and Pay By Type controls with default values matching current behavior.
3. Render Pay To and Pay By dropdowns based on their selected type.
4. Preserve existing payment type, cheque, amount, payment date, reference, permission, loading, and redirect behavior.
5. Preserve existing `Other` behavior only for the default Company/Customer flow.
6. Add same-party validation.
7. Submit the role-based payload to the existing `createPayment` hook.
8. Update `pages/ledger/[id].js` to prefer backend-provided `payToName`, `payByName`, and `partyBalance` when present.
9. Run the backward compatibility checks and new behavior checks listed above.

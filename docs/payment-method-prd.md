# Lean Payment Integration Plan for Inventory System

## Main Objective

Launch local Pakistan payment collection with the smallest reliable flow first.

The first live version should not try to solve full recurring billing, multiple gateways, wallet integrations, refunds, or complex accounting. It should simply allow a customer to receive an invoice, pay through PayFast or manual bank transfer, and have their subscription activated.

---

# Phase 0: Business Readiness

## Goal

Prepare everything required before development starts.

## Manual Steps

1. Create or finalize the pricing plans.
2. Decide monthly and yearly prices.
3. Prepare business bank account details.
4. Prepare Raast ID if available.
5. Create basic website pages:

   - Pricing
   - Terms and Conditions
   - Privacy Policy
   - Refund Policy
   - Contact

6. Apply for PayFast merchant account.
7. Request sandbox credentials.
8. Confirm transaction charges and settlement timeline.

## Development Work

No major development required.

## Output

You should have:

- Plan prices finalized.
- Bank/Raast details ready.
- PayFast sandbox access requested or received.
- Website/business information ready for payment provider review.

---

# Phase 1: Minimum Live Payment Flow

## Goal

Go live with the smallest working version.

This phase should support:

- Invoice generation
- Manual bank transfer/Raast payment
- Admin manual approval
- Basic subscription activation

## Why This Phase Comes First

This lets you start collecting payments even if PayFast onboarding or sandbox testing takes time.

## Customer Flow

1. Customer selects a plan.
2. System creates an invoice.
3. Customer sees payment instructions.
4. Customer pays through bank transfer or Raast.
5. Customer uploads payment proof.
6. Admin reviews payment.
7. Admin approves payment.
8. System activates or extends subscription.

## Admin Flow

1. Admin sees pending payment proof.
2. Admin verifies the bank/Raast payment manually.
3. Admin clicks Approve or Reject.
4. If approved, customer subscription is activated.

## Required Features

### Customer Side

- Billing page
- Current plan display
- Subscription expiry display
- Plan selection
- Invoice generation
- Bank/Raast payment instructions
- Upload payment proof
- Invoice status display

### Admin Side

- Payment requests list
- View payment proof
- Approve payment
- Reject payment
- Add admin note
- Customer subscription status update

### Backend

- Plans table
- Invoices table
- Subscriptions table
- Manual payment proofs table
- Subscription activation logic

## Database Tables Needed

Minimum required:

- `plans`
- `subscriptions`
- `invoices`
- `manual_payment_proofs`

You can delay `payment_attempts` and `webhook_logs` until PayFast is added.

## Invoice Statuses

Use only these in Phase 1:

- `UNPAID`
- `PENDING_REVIEW`
- `PAID`
- `REJECTED`

## Subscription Statuses

Use:

- `ACTIVE`
- `EXPIRED`
- `PENDING`

## What Not to Build Yet

Do not build these in Phase 1:

- PayFast checkout
- Safepay
- Webhooks
- Automated recurring billing
- Refund automation
- Payment reminders
- Advanced revenue dashboard
- Wallet system
- Partial payments
- Coupon system

## Phase 1 Go-Live Criteria

You can go live when:

1. Customer can generate invoice.
2. Customer can see bank/Raast payment details.
3. Customer can upload proof.
4. Admin can approve payment.
5. Subscription activates after approval.
6. Customer can see active plan and expiry date.

## Estimated Effort

Smallest useful version.

A good developer can build this quickly because it does not depend on external gateway complexity.

---

# Phase 2: PayFast Online Checkout

## Goal

Add online payment after the manual payment flow is stable.

## Customer Flow

1. Customer selects a plan.
2. System creates an invoice.
3. Customer clicks Pay Online.
4. System redirects customer to PayFast.
5. Customer completes payment.
6. PayFast sends callback/webhook.
7. System verifies payment.
8. Invoice becomes paid.
9. Subscription activates automatically.

## Required Features

### Backend

- `payment_attempts` table
- `payment_webhook_logs` table
- PayFast checkout creation endpoint
- PayFast callback/webhook endpoint
- Payment verification logic
- Duplicate webhook protection
- Invoice amount verification

### Customer Side

- Pay Online button
- Payment success page
- Payment failed/cancelled page
- Retry payment button

### Admin Side

- View online payment attempts
- View gateway reference
- View payment status
- Retry verification manually if needed

## New Invoice Statuses

Add:

- `FAILED`
- `CANCELLED`

## Payment Attempt Statuses

Use:

- `INITIATED`
- `SUCCESS`
- `FAILED`
- `CANCELLED`

## Phase 2 Go-Live Criteria

You can enable PayFast when:

1. Sandbox payment succeeds.
2. Failed payment is handled properly.
3. Cancelled payment is handled properly.
4. Duplicate callback does not activate subscription twice.
5. Wrong invoice amount is rejected.
6. Real small test payment works in production.

## What Not to Build Yet

Still avoid:

- Safepay
- Recurring card billing
- Refund automation
- Advanced analytics
- Coupons
- Complex accounting sync

---

# Phase 3: Payment Receipts and Basic Notifications

## Goal

Improve customer trust and reduce manual support.

## Required Features

### Customer Side

- Download receipt
- Download invoice
- Payment history
- Subscription renewal status

### Notifications

Send email or in-app notification for:

- Invoice created
- Payment proof submitted
- Manual payment approved
- Manual payment rejected
- Online payment successful
- Online payment failed
- Subscription expiring soon
- Subscription expired

## Admin Side

- Basic revenue summary
- Paid invoices count
- Pending manual payments count
- Failed payments count
- Expiring subscriptions list

## Phase 3 Go-Live Criteria

This phase is complete when:

1. Customer receives confirmation after payment.
2. Customer can download invoice/receipt.
3. Admin can quickly see pending and paid payments.
4. Expiring customers can be identified.

---

# Phase 4: Automated Renewal Flow

## Goal

Make subscription renewals smoother without implementing complex recurring billing.

## Recommended Approach

Use invoice-based renewal instead of automatic card charging.

## Flow

1. System detects subscription is near expiry.
2. System generates renewal invoice.
3. Customer receives invoice/payment link.
4. Customer pays online or manually.
5. Subscription extends after payment.

## Required Features

- Auto-generate renewal invoice before expiry
- Send renewal reminder
- Grace period after expiry
- Suspend account after grace period
- Reactivate account after payment

## Suggested Reminder Schedule

- 7 days before expiry
- 3 days before expiry
- On expiry day
- 3 days after expiry

## Grace Period

Recommended:

- 3 to 7 days for Pakistani SMEs

## Phase 4 Go-Live Criteria

This phase is complete when:

1. Renewal invoices are created automatically.
2. Customers receive reminders.
3. Grace period works.
4. Expired accounts are restricted.
5. Paid accounts reactivate automatically.

---

# Phase 5: Safepay or Additional Gateway

## Goal

Add a second provider only after PayFast/manual payment flow is working.

## When to Add Safepay

Add Safepay if:

1. PayFast approval is slow.
2. PayFast developer experience is limiting.
3. PayFast support is not reliable enough.
4. You want a cleaner custom checkout.
5. You need better subscription/invoice API support.

## Required Architecture

Before this phase, the payment module should already use:

```ts
PaymentProvider;
```

With methods like:

```ts
createCheckoutSession();
verifyWebhook();
getPaymentStatus();
```

Then add:

```ts
SafepayProvider;
```

without changing the billing module.

## Phase 5 Go-Live Criteria

This phase is complete when:

1. Admin can choose active payment provider.
2. Safepay checkout works in sandbox.
3. Safepay webhook works.
4. Invoice/subscription logic remains provider-independent.
5. Customer experience remains the same.

---

# Final Recommended Launch Path

## Fastest Path to Go Live

### Step 1

Launch **manual bank transfer/Raast + admin approval**.

### Step 2

Add **PayFast online checkout**.

### Step 3

Add **receipts and notifications**.

### Step 4

Add **automatic renewal invoices**.

### Step 5

Add **Safepay only if needed**.

---

# Minimum Version I Recommend Building First

For the first live release, build only this:

## Customer

- View plan
- Generate invoice
- See bank/Raast details
- Upload payment proof
- See subscription status

## Admin

- View payment proof
- Approve/reject payment
- Activate subscription

## Backend

- Plans
- Invoices
- Subscriptions
- Manual payment proofs
- Subscription activation

This is the smallest practical version that can start collecting money from Pakistani customers.

---

# Recommended Development Order

## Sprint 1

- Plans table
- Subscriptions table
- Invoices table
- Manual payment proofs table
- Customer billing page
- Admin payment approval page

## Sprint 2

- Subscription activation logic
- Invoice status handling
- Manual payment rejection flow
- Basic invoice history
- Basic admin filters

## Sprint 3

- PayFast checkout endpoint
- PayFast callback/webhook
- Payment attempts table
- Webhook logs table
- Payment success/failure pages

## Sprint 4

- Receipts
- Email/in-app notifications
- Renewal reminders
- Expiry handling

---

# My Final Recommendation

Do not start with full PayFast integration first.

Start with **manual bank transfer/Raast + invoice + admin approval** because it is the fastest way to go live and collect payments locally.

Then add **PayFast** once your subscription and invoice logic is already stable.

This approach reduces risk because your billing system will work even if PayFast onboarding, sandbox testing, or production approval takes longer than expected.

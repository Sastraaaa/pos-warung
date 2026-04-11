# Plan: Sync, Input UX, and Hot Stock Refresh

## Problem Statement
The current POS application has several UX and reliability gaps:
1. Offline changes do not automatically sync when the connection is restored.
2. Numeric inputs (stock, capital, selling price) are difficult to use on mobile/desktop.
3. Manual product entry lacks a category dropdown, leading to data inconsistency.
4. Stock levels do not refresh immediately after payment actions without a manual reload.

## Proposed Changes
### a) Auto Sync Reliability
- Implement a listener for online status changes.
- Trigger sync queue processing automatically when the internet returns.
- Provide a non-intrusive toast notification for sync progress.

### b) Numeric Input UX Fix
- Standardize input components for `stock`, `capital_price`, and `selling_price`.
- Implement auto-formatting for Rupiah (IDR) currency.
- Ensure numeric keyboards appear on mobile devices.

### c) Category Selection in Manual Form
- Add a dropdown/select option for categories in the manual product entry form.
- Fetch available categories from the existing database/store.

### d) Hot Stock Refresh
- Update the stock state immediately after a successful payment transaction.
- Ensure the product list reflects the new stock without a full page refresh.

### e) Quality Assurance
- Verification of all features in local environment.
- Subagent code review for potential AI-generated code smells or slop.

## Constraints
- No database schema migrations unless absolutely necessary.
- Maintain existing Indonesian UX context (Bahasa Indonesia UI).
- Performance should not degrade during sync operations.

## Acceptance Criteria
- [ ] Changes made while offline are pushed to Supabase once online.
- [ ] Numeric inputs format "1000" to "1.000" as the user types.
- [ ] Manual product form displays a list of existing categories.
- [ ] Stock count decreases correctly in the UI after a transaction.

## Test Checklist
- [ ] Toggle flight mode and verify auto-sync.
- [ ] Enter various price amounts and check formatting.
- [ ] Create a manual product and select a category.
- [ ] Perform a checkout and check the stock label update.

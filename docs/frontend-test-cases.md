# Frontend Test Cases

This document lists comprehensive frontend test cases for the current application surface in `frontend/src`.

## Scope

- Authentication and route protection
- Dashboard shell, sidebar, notifications, and shared UI states
- Admin/manager pages
- Waiter and kitchen pages
- Billing detail flow
- Reports and settings
- Responsive behavior, accessibility, and error handling

## Assumptions

- Roles: `admin`, `manager`, `waiter`, `kitchen`
- Frontend talks to the existing API layer in `frontend/src/lib/api.js`
- Live updates come through the order event system

## 1. Authentication

- Verify login page renders for unauthenticated users.
- Verify successful login redirects user to role home route.
- Verify failed login shows an error message and does not redirect.
- Verify authenticated user visiting `/login` is redirected to `/`.
- Verify logout clears session and returns user to login page.
- Verify refresh session keeps the user logged in after page reload.
- Verify expired session redirects user to `/login`.
- Verify `me` endpoint failure during app boot shows a safe loading or error state.
- Verify password change success message is shown.
- Verify password change validation errors render correctly.

## 2. Protected Routing And Role Access

- Verify unauthenticated access to any protected route redirects to `/login`.
- Verify `admin` can access all admin/manager pages.
- Verify `manager` can access all admin/manager pages allowed by policy.
- Verify `waiter` cannot access admin-only routes like reports and staff accounts.
- Verify `kitchen` cannot access waiter-only pages like new order creation.
- Verify unknown paths redirect to `/`.
- Verify `/operations/billing/:orderId` is accessible to admin/manager.
- Verify dynamic billing detail route does not appear in sidebar navigation.
- Verify disallowed direct URL navigation redirects to role default path.

## 3. Dashboard Layout And Sidebar

- Verify desktop layout renders sidebar and content panel together.
- Verify mobile layout hides sidebar until the menu button is clicked.
- Verify mobile overlay closes sidebar when backdrop is clicked.
- Verify sidebar links navigate correctly.
- Verify active sidebar item is highlighted.
- Verify sidebar scroll works independently from page content scroll.
- Verify page content scroll works independently from sidebar scroll.
- Verify sidebar custom scrollbar uses dark themed styling.
- Verify layout uses full screen width after frame removal.
- Verify top-right notifications do not block primary navigation.

## 4. Shared Data States

- Verify loading state renders on all pages using `DataState`.
- Verify API failure shows error state instead of a broken page.
- Verify empty state renders when data returns no rows.
- Verify pages recover correctly after a retry or background refresh.

## 5. Role Home Behavior

- Verify admin lands on dashboard overview from `/`.
- Verify manager lands on dashboard overview from `/`.
- Verify waiter lands on `/staff/orders/new`.
- Verify kitchen lands on `/staff/orders/kitchen`.

## 6. Menu Items Page

- Verify menu item list renders grouped by category.
- Verify category filter narrows visible items correctly.
- Verify service filter narrows visible items correctly.
- Verify combined category + service filters work together.
- Verify filter empty state appears when no items match.
- Verify item card shows name, description, price, service mode, availability, offer, prep time, calories, and display order.
- Verify featured badge appears only for featured items.
- Verify manager/admin can open create item modal.
- Verify manager/admin can open edit item modal.
- Verify waiter/kitchen see read-only actions.
- Verify create item success updates the list and shows a success message.
- Verify edit item success updates the card and shows a success message.
- Verify delete item removes it from the list and shows a success message.
- Verify availability toggle updates the item and message.
- Verify create/edit validation errors show in modal.
- Verify service station selection persists after save.
- Verify offer percentage persists after save.

## 7. Menu Categories Page

- Verify category table renders name, description, display order, item count, status, and actions.
- Verify manager/admin can create category.
- Verify manager/admin can edit category.
- Verify manager/admin can delete category.
- Verify waiter/kitchen see read-only or restricted actions.
- Verify active/inactive badge color matches status.
- Verify linked item count displays correctly.
- Verify create/edit validation errors show in modal.

## 8. Orders Page For Admin/Manager

- Verify list of orders renders with status and metadata.
- Verify status buttons appear only for allowed next statuses.
- Verify colored status buttons match order status theme.
- Verify updating status changes order card state.
- Verify status failure shows error message.
- Verify live websocket updates replace the correct order row/card.
- Verify recently billed orders show billed amount in metadata.
- Verify add-more action opens or routes to additional-order flow where allowed.
- Verify add-more action is hidden on disallowed statuses.

## 9. Staff New Order Page

- Verify waiter/admin/manager can create new order.
- Verify dine-in requires table number.
- Verify takeaway and delivery flows work without table number if allowed by backend.
- Verify menu item selection works across categories.
- Verify line item quantity updates preview correctly.
- Verify line notes are saved with order.
- Verify order-level notes are saved with order.
- Verify counter and kitchen service mode labels appear while building order.
- Verify creating a kitchen order starts in pending.
- Verify creating a counter-only order starts in ready.
- Verify create order success resets form and shows confirmation.
- Verify create order failure shows validation message.

## 10. Waiter Active Orders Page

- Verify active orders exclude served and cancelled orders.
- Verify counter item summary renders when counter items exist.
- Verify counter item served/pending badges render correctly.
- Verify `Serve counter items` button only shows when pending counter items exist.
- Verify waiter can serve counter items.
- Verify waiter can mark only ready orders as served.
- Verify waiter cannot see prepare/ready/confirm actions.
- Verify add-more button shows only for confirmed/preparing/ready orders.
- Verify add-more flow updates order after save.
- Verify background refresh does not lose current list.

## 11. Kitchen Display Page

- Verify kitchen page shows only kitchen-relevant orders.
- Verify counter-only orders do not appear in kitchen queue.
- Verify kitchen sees order-level notes.
- Verify kitchen sees kitchen line-item notes.
- Verify kitchen can move orders from pending to confirmed.
- Verify kitchen can move confirmed to preparing.
- Verify kitchen can move preparing to ready.
- Verify kitchen cannot serve ready orders.
- Verify kitchen cannot cancel ready orders if blocked by backend.
- Verify live updates remove orders no longer relevant to kitchen.

## 12. Additional Order Flow

- Verify add-more UI opens for eligible orders.
- Verify additional item lines can be added.
- Verify additional item lines can be removed.
- Verify note-only addition works without adding items.
- Verify item-only addition works without note.
- Verify item + note addition works together.
- Verify appended notes do not replace previous notes.
- Verify adding a kitchen item to a ready order reopens it to confirmed.
- Verify adding only counter items does not incorrectly reopen kitchen flow.
- Verify modal/page closes after successful save.
- Verify API errors show in the add-more UI.

## 13. Billing Queue Page

- Verify served orders appear in billing queue.
- Verify unserved orders do not appear in billing queue.
- Verify billed revenue stat equals sum of billed final amounts.
- Verify pending billing count equals served but unbilled orders.
- Verify global tax and service charge are displayed.
- Verify summary cards show subtotal, tax + service, menu offers, and estimated final.
- Verify clicking `Finalize` routes to `/operations/billing/:orderId`.
- Verify billing detail route does not redirect unexpectedly for admin/manager.

## 14. Billing Detail Page

- Verify billing detail page loads the selected served order.
- Verify invalid order id shows an empty or safe state.
- Verify order item list shows item name, quantity, service mode, and row amount.
- Verify bill summary shows subtotal, tax, service, menu offers, manager discount, and net total.
- Verify selecting `No discount` disables discount value input.
- Verify selecting `Direct amount` enables discount value input.
- Verify selecting `Percentage` enables discount value input.
- Verify discount changes update summary preview immediately.
- Verify background refresh does not reset user-entered discount selection.
- Verify finalize bill success redirects back to billing list.
- Verify finalize bill failure shows error message.
- Verify close/back button returns to billing list.

## 15. Reservations Page

- Verify reservation list renders correctly.
- Verify create reservation works with valid inputs.
- Verify reservation update works.
- Verify reservation status update works.
- Verify reservation delete works where allowed.
- Verify overlapping or invalid reservation errors are shown.
- Verify party size exceeding table capacity shows validation error.
- Verify waiter can manage reservations.
- Verify kitchen cannot access reservation management pages if blocked by route guard.

## 16. Tables Page

- Verify tables list renders.
- Verify create table works for allowed roles.
- Verify update table works.
- Verify delete table works.
- Verify table availability search returns valid tables.
- Verify inactive tables are excluded from availability results.
- Verify waiter can read tables but not necessarily manage them if restricted.

## 17. Reports Pages

- Verify revenue report loads and renders metrics/chart rows.
- Verify bills report loads and lists billed orders.
- Verify bills report PDF download link/button works.
- Verify top-items report loads and sorts correctly.
- Verify staff-performance report loads and renders order/reservation stats.
- Verify empty report periods show safe empty states.
- Verify report API failures show error states.

## 18. Settings Pages

- Verify billing rules page loads current global tax and service charge.
- Verify updating billing rules persists and shows success.
- Verify invalid billing rule values show validation errors.
- Verify profile page loads current user data.
- Verify profile update flow works if supported.
- Verify staff accounts page lists allowed users for admin.
- Verify manager sees only self, waiters, and kitchen users if that is the enforced rule.
- Verify create staff account works for allowed roles.
- Verify edit staff account works for allowed roles.
- Verify delete staff account works for admin only.

## 19. Notifications And Live Events

- Verify new order notification appears for kitchen/manager/admin as configured.
- Verify confirmed notification appears for waiter/manager/admin.
- Verify preparing notification appears for manager/admin.
- Verify ready notification appears for waiter/manager/admin.
- Verify served notification appears and follows persistence rules.
- Verify billed notification appears for other managers/admins but not self.
- Verify publisher does not see their own popup.
- Verify counter-only orders do not wrongly notify kitchen.
- Verify additional-order event notification behavior matches the implemented design.
- Verify role-based manual close vs auto-dismiss rules work.
- Verify audio plays after user interaction and does not crash when blocked.

## 20. Accessibility And UX

- Verify all buttons are keyboard reachable.
- Verify modals, forms, and routed pages are usable with keyboard only.
- Verify visible focus states appear on interactive elements.
- Verify form labels are associated with controls.
- Verify color-only statuses still include readable text.
- Verify scrollable areas remain usable with keyboard and wheel/trackpad.
- Verify top-right notifications can be dismissed with keyboard.

## 21. Responsive Tests

- Verify login page on mobile.
- Verify sidebar open/close on mobile.
- Verify long tables remain usable on tablet widths.
- Verify menu item cards remain readable on narrow screens.
- Verify billing detail page remains usable on mobile widths.
- Verify reports pages remain readable without horizontal layout breaks.
- Verify notification cards do not overflow viewport on mobile.

## 22. Regression And Integration

- Verify order lifecycle end-to-end:
  create -> confirm -> prepare -> ready -> served -> bill.
- Verify mixed counter + kitchen order lifecycle.
- Verify order additional-items flow after confirmation.
- Verify billing math matches bill report and PDF output.
- Verify global billing rules affect frontend billing preview consistently.
- Verify menu offer changes affect new orders but do not corrupt historical billed totals.
- Verify route changes do not break sidebar highlighting or guards.

## Suggested Automation Priority

- P0: login, route guards, order creation, waiter restrictions, kitchen flow, billing queue, billing detail finalize, notifications self-suppression
- P1: menu CRUD, category CRUD, reservations, tables, billing rules, reports smoke tests
- P2: responsive tests, visual regressions, notification audio behavior, scrollbar/theme polish

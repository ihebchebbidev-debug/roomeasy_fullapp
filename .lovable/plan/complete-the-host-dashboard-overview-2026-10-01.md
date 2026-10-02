# Complete the host dashboard overview

## Current state

- A normal signed-in account can start a listing from **List your place**.
- On the first save, the listing flow requests identity details, upgrades the account to host, and then saves the draft or submits it for review.
- Host access remains additive: the account still keeps its traveler features while gaining the host dashboard.
- The new overview structure already exists, including the checklist, stat cards, activity, requests, chart, listings, reviews, messages, and five-language copy. This implementation will finish the incomplete behavior and validate every item in the approved plan.

## Implementation

### 1. Make the attention checklist accurate
- Show pending-review and rejected listings separately, including the rejection reason.
- Show identity review status with a direct action to the appropriate profile or listing flow.
- Use the confirmed payout onboarding state for the payout task.
- Derive each pending request’s expiry from its creation time and display the nearest remaining response time in the checklist as well as in the request card.
- Treat a message thread as unanswered when the latest message came from the guest, rather than relying only on its unread count.
- Keep unreplied reviews in the checklist and preserve the “You’re all set” state when no action remains.

### 2. Correct activity and request actions
- Include every check-in and check-out occurring today or within the next seven days, with guest, listing, event date, stay dates, nights, and full total.
- Sort activity by the actual event date and distinguish arrival from departure when both are in range.
- Keep the three newest pending requests with immediate Accept and Decline actions and expiry details.

### 3. Finish the dashboard metrics
- Keep Earned and Upcoming revenue visible without truncation on narrow screens.
- Compare revenue and request volume with the preceding 30-day period.
- Compute next-30-day occupancy from overlapping confirmed nights and live listings.
- Add an occupancy comparison against the previous comparable 30-day window.
- Keep rating comparison and clear no-data labels where a meaningful comparison cannot be calculated.

### 4. Correct the revenue chart
- Show exactly six historical months ending with the current month plus three future months.
- Count completed past earnings in the earned series and confirmed future stays in the forecast series without double-counting the current month.
- Keep currency values readable in the chart tooltip and axis labels.

### 5. Complete listings, reviews, messages, and empty states
- Show a clear empty listing state with a Create listing action.
- Keep each listing card’s photo, title, Live/Pending review/Draft/Rejected status, rejection reason, nightly price, next booking, Edit, Calendar, and View page actions.
- Show the latest two reviews with reply actions and the latest three conversations with unread and unanswered indicators.
- Keep actionable first-booking tips for new hosts instead of a page dominated by zero values.

### 6. Keep the host page maintainable and multilingual
- Split calculations and major overview panels into focused modules under the existing host overview folder, leaving the host route responsible for orchestration.
- Add or correct all labels in English, French, Spanish, German, and Portuguese.
- Preserve the existing white-card, blue-accent, serif-heading visual system.

## Verification

- Test the signed-in flow from traveler account to first listing submission and host access.
- Verify pending, rejected, verified, payout-ready, unread/unanswered, no-booking, and fully-complete states.
- Test Accept and Decline actions from the overview.
- Check desktop and mobile layouts, especially monetary values, listing cards, buttons, chart labels, and one-column stacking.
- Confirm the preview has no build, runtime, console, or failed-request errors.

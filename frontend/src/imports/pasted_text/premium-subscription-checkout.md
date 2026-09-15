You are refining the CareerOS Premium Subscription & Checkout experience.

GOAL:
Create a smooth, role-aware, production-ready subscription flow for Student, College, and Recruiter users.

The experience must be:
- fast
- trustworthy
- minimal
- transparent
- secure
- role-specific
- consistent with CareerOS light/dark/system themes

Do not redesign unrelated screens.

==================================================
CORE FLOW
==================================================

User clicks a Premium CTA
→ Selected plan is passed automatically
→ Review Plan
→ Billing Details
→ Secure Payment
→ Backend Verification
→ Subscription Activated
→ Return to Role Dashboard

IMPORTANT:
Do NOT ask the user to choose the same plan again.

Example:

Student clicks:
"Go Pro"

Open:

/subscription?plan=student-pro&billing=annual

The subscription page should already show:

CareerOS Pro
₹1,999/year

Provide only a small:
"Change Plan"

link if the user wants to modify their selection.

==================================================
SUBSCRIPTION ENTRY POINTS
==================================================

Premium checkout can be opened from:

- Onboarding pricing
- Premium feature lock
- Profile → Billing
- Upgrade banner
- Usage limit reached
- Subscription management

Always preserve:

role
selected plan
billing cycle

==================================================
ROLE-SPECIFIC PLANS
==================================================

STUDENT

FREE
₹0

PRO
₹199/month
₹1,999/year

Includes:
- Advanced Career Twin
- Unlimited ARIA
- Resume Intelligence
- Full Skill Gap Analysis
- Adaptive Roadmap
- ECHO Interview Sessions
- Advanced Job Matching
- Progress Analytics

--------------------------------

COLLEGE

STANDARD
₹50,000/year

Includes:
- Placement Dashboard
- Student Readiness Monitoring
- Skill Gap Analytics
- Department Analytics
- Reports

ENTERPRISE
₹2,00,000/year

Includes:
- Everything in Standard
- Advanced Institutional Analytics
- Multi-Department Intelligence
- Recruiter Engagement Analytics
- Priority Support

--------------------------------

RECRUITER

STARTER
₹25,000/year

Includes:
- AI Talent Search
- Candidate Profiles
- Match Scores
- Shortlisting
- Basic Hiring Analytics

ENTERPRISE
₹1,50,000/year

Includes:
- Everything in Starter
- Advanced Talent Intelligence
- Hiring Pipeline
- Bulk Candidate Discovery
- Advanced Analytics
- Institutional Talent Access
- Priority Support

ADMIN

No subscription plans.

==================================================
PAGE ROUTE
==================================================

Use:

/subscription

Desktop layout:

MAIN AREA
Checkout Steps

RIGHT SIDE
Sticky Order Summary

Use a minimal checkout header:

CareerOS Logo
Secure Checkout
Back to CareerOS

Do not show the full application sidebar during checkout.

==================================================
STEP 1 — REVIEW SELECTED PLAN
==================================================

Heading:

"Review Your Plan"

Show the selected plan automatically.

Example:

CareerOS Pro

₹1,999 / year

Badge:
Most Popular

Include concise benefits.

Allow Student users to switch:

Monthly | Annual

If billing cycle changes:
update total instantly.

Buttons:

Continue to Billing

Change Plan

Do not force another plan-selection screen.

==================================================
ORDER SUMMARY
==================================================

Keep a sticky summary visible on desktop.

Show:

Plan:
CareerOS Pro

Billing:
Annual

Subtotal:
₹1,999

Taxes:
Calculated at checkout

Total:
₹1,999 + applicable taxes

Renewal:
Renews annually until cancelled

If annual pricing genuinely saves money compared with monthly billing, calculate and display:

"Save ₹389 annually"

Do not use fake discounts.

==================================================
STEP 2 — BILLING DETAILS
==================================================

Pre-fill all information already available from CareerOS profile data.

Do not force users to enter the same details again.

--------------------------------
STUDENT
--------------------------------

Required:
- Full Name
- Email
- Country
- State
- City
- Postal Code

Optional:
- Phone

--------------------------------
COLLEGE
--------------------------------

Required:
- Institution / Legal Name
- Billing Contact
- Official Email
- Phone
- Billing Address
- City
- State
- Postal Code

Optional:
- GSTIN
- Finance Email
- Purchase Order Number

Checkbox:
"Billing address is same as institution address"

--------------------------------
RECRUITER
--------------------------------

Required:
- Company / Legal Name
- Billing Contact
- Work Email
- Phone
- Billing Address
- City
- State
- Postal Code

Optional:
- GSTIN
- Finance Email
- Purchase Order Number

Checkbox:
"Billing address is same as company address"

==================================================
VALIDATION
==================================================

Validate fields immediately.

Examples:

Invalid Email:
"Enter a valid email address"

Invalid Postal Code:
"Enter a valid postal code"

Invalid GSTIN:
"Enter a valid GSTIN"

Do not wait until payment submission to surface form errors.

==================================================
STEP 3 — PAYMENT
==================================================

Heading:

"Secure Payment"

Use a trusted external payment gateway.

Preferred for India:
Razorpay

Alternative:
Stripe where appropriate.

CareerOS must NEVER directly collect or store:

- card number
- CVV
- full sensitive card data

The payment provider should securely handle payment credentials.

Possible methods:

- UPI
- Credit Card
- Debit Card
- Net Banking
- Wallet
- Other supported gateway methods

==================================================
ENTERPRISE PURCHASE LOGIC
==================================================

College Enterprise and Recruiter Enterprise plans should support BOTH:

OPTION 1
Direct Payment

OPTION 2
Request Enterprise Access

This is important because high-value B2B purchases may require:

- procurement approval
- invoice processing
- GST documentation
- finance approval
- purchase orders
- legal review

Do not force Enterprise customers through a consumer-style instant checkout.

For:

College Enterprise
Recruiter Enterprise

show:

"Pay Online"

and

"Talk to Sales"

or

"Request Enterprise Access"

==================================================
ENTERPRISE REQUEST FORM
==================================================

Ask:

- Organization Name
- Contact Person
- Work Email
- Phone
- Expected Users
- Requirements
- Purchase Timeline
- Message optional

Submit CTA:

Request Enterprise Access

Success message:

"Thanks. Our team will contact you regarding your CareerOS Enterprise setup."

==================================================
PAYMENT CONFIRMATION
==================================================

Before payment opens, show:

Selected Plan
Billing Cycle
Billing Information
Final Amount

Required checkbox:

☐ I agree to the Terms of Service and Subscription Terms.

Primary CTA example:

Pay ₹1,999 Securely

Small trust message:

"Payments are processed securely by our payment partner."

Do not claim certifications CareerOS does not actually have.

==================================================
PAYMENT STATES
==================================================

PROCESSING

Heading:
"Processing your payment"

Text:
"Please don't close this window."

Use:
small spinner
subtle progress indicator

--------------------------------

SUCCESS

Route:
/subscription/success

Heading:
"You're all set!"

Student example:

CareerOS Pro is now active.

Show:

Plan:
CareerOS Pro

Billing:
Annual

Amount:
₹1,999

Next Renewal:
Dynamic Date

Transaction Reference:
Dynamic ID

Buttons:

Explore Pro Features
View Subscription

Redirect:

Student → /dashboard
College → /college
Recruiter → /recruiter

--------------------------------

FAILED

Route:
/subscription/failed

Heading:

"Payment wasn't completed"

Description:

"Your subscription has not been activated. Please try again or choose another payment method."

Actions:

Try Again
Change Payment Method
Back to Plans

--------------------------------

CANCELLED

Show:

"Payment cancelled"

Actions:

Resume Checkout
Return to CareerOS

Never activate the subscription.

==================================================
BACKEND VERIFICATION
==================================================

CRITICAL:

Do not activate Premium from frontend success alone.

Correct flow:

Frontend requests order creation
↓
Backend creates provider order
↓
Gateway processes payment
↓
Payment provider returns result
↓
Backend verifies signature / webhook
↓
Backend updates subscription
↓
Frontend retrieves verified subscription state
↓
Premium access unlocks

Never trust frontend-only payment status.

==================================================
SUBSCRIPTION RECORD
==================================================

Use structured fields:

subscription_id
user_id
role
plan_id
billing_cycle
status
provider
provider_customer_id
provider_subscription_id
amount
currency
started_at
current_period_start
current_period_end
auto_renew
cancel_at_period_end
created_at
updated_at

Statuses:

free
pending
active
past_due
cancelled
expired

==================================================
PREMIUM FEATURE ACCESS
==================================================

After verified activation:

Update account entitlement immediately.

Student:
unlock Pro capabilities

College:
unlock selected institutional plan

Recruiter:
unlock selected recruiter plan

Use plan-based feature permissions.

Do not hardcode premium access separately on every page.

Use one central subscription/entitlement source.

==================================================
PREMIUM FEATURE LOCKED STATE
==================================================

Free users should still be able to understand premium features.

Example:

Advanced Career Twin

Lock icon

"Unlock deeper career projections with CareerOS Pro."

CTA:

Upgrade to Pro

Click:
→ /subscription?plan=student-pro&billing=annual

Do not repeatedly show intrusive upgrade modals.

==================================================
BILLING & SUBSCRIPTION SETTINGS
==================================================

Provide:

Student:
/profile/billing

College:
/college/settings/billing

Recruiter:
/recruiter/settings/billing

Show:

- Current Plan
- Subscription Status
- Billing Cycle
- Next Renewal
- Billing Information
- Payment Method
- Billing History

Actions:

Change Plan
Update Billing Details
Manage Payment Method
Cancel Subscription

==================================================
BILLING HISTORY
==================================================

Columns:

Date
Plan
Amount
Status
Invoice

Example:

05 Sep 2026
CareerOS Pro
₹1,999
Paid
Download Invoice

==================================================
UPGRADE / DOWNGRADE
==================================================

UPGRADE

Examples:

Student Free → Pro

College Standard → Enterprise

Recruiter Starter → Enterprise

Show:
new price
billing date
effective date

before confirmation.

--------------------------------

DOWNGRADE

Explain clearly:

"Your current plan remains active until the end of this billing period."

Do not remove already-paid access immediately unless business rules explicitly require it.

==================================================
CANCELLATION
==================================================

Use confirmation dialog.

Heading:

"Cancel CareerOS Pro?"

Explain:

- Premium access continues until current period ends
- Future renewal stops
- CareerOS profile and data remain available
- Premium-only tools become unavailable after expiry

Buttons:

Keep My Plan
Confirm Cancellation

Do not use dark patterns.

==================================================
ANIMATIONS
==================================================

Keep payment flow calm and professional.

Allowed:

- subtle plan selection transition
- 200–250ms step fade
- smooth order-total update
- small processing spinner
- simple success check animation
- brief premium unlocked animation

Do NOT use:

- confetti
- flying coins
- bouncing cards
- flashing payment buttons
- excessive glow
- long success animation

==================================================
LIGHT MODE
==================================================

Do not use dark-themed payment cards in light mode.

Use:

Background:
Soft off-white

Cards:
White

Summary:
White or very light blue-grey

Borders:
Light neutral

CTA:
CareerOS blue

Do NOT use:

- black payment cards
- dark navy checkout blocks
- black pricing cards
- cyberpunk visuals

==================================================
DARK MODE
==================================================

Use:

- neutral charcoal background
- layered dark-grey surfaces
- subtle borders
- off-white text
- restrained blue accents

Do NOT use:

- neon green
- glowing payment cards
- excessive purple
- cyberpunk effects

Checkout must communicate trust.

==================================================
DO'S
==================================================

DO:

✓ Carry the selected plan into checkout automatically.
✓ Keep a Change Plan option.
✓ Pre-fill known user data.
✓ Clearly show recurring billing.
✓ Clearly show final amount.
✓ Make tax handling transparent.
✓ Use trusted payment providers.
✓ Verify payment server-side.
✓ Support Enterprise assisted sales.
✓ Provide invoice history.
✓ Allow cancellation.
✓ Provide payment failure recovery.
✓ Keep role plans separated.
✓ Maintain theme consistency.
✓ Keep payment UX minimal.
✓ Keep checkout mobile-friendly.

==================================================
DON'TS
==================================================

DON'T:

✗ Ask users to select the same plan twice.
✗ Trust frontend payment success.
✗ Store raw card data.
✗ Store CVV.
✗ Hide recurring terms.
✗ Use fake discounts.
✗ Add fake urgency timers.
✗ Preselect more expensive plans deceptively.
✗ Force Enterprise plans into consumer checkout.
✗ Show Admin pricing.
✗ Use dark cards in light mode.
✗ Make cancellation difficult.
✗ Display raw payment gateway errors.
✗ Collect unnecessary personal data.
✗ redesign unrelated CareerOS pages.

==================================================
SUCCESS CRITERIA
==================================================

The final flow is complete when:

1. User clicks a paid-plan CTA.
2. Their plan is automatically loaded.
3. They can change it if needed.
4. Billing data is pre-filled where possible.
5. Checkout collects only necessary information.
6. Secure provider payment is initiated.
7. Backend verifies payment.
8. Subscription becomes active only after verification.
9. Premium access unlocks immediately.
10. Failure/cancellation does not activate Premium.
11. Billing history and invoices are accessible.
12. Users can manage or cancel subscriptions.
13. Enterprise plans support direct payment and assisted sales.
14. Light mode remains genuinely light.
15. Checkout feels trustworthy, professional, and production-ready.
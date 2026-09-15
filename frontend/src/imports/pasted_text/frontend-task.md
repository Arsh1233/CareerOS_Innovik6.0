# CAREEROS — MAKE EVERY CLICK / BUTTON FUNCTIONAL

You are now working on the existing CareerOS frontend.

The UI and major role structure already exist.

Your task is NOT to redesign the product.

Your task is to make EVERY clickable element in the application functional.

This includes:

- buttons
- links
- cards
- tabs
- dropdowns
- filters
- search
- sidebar navigation
- topbar controls
- profile menu
- theme selector
- modals
- drawers
- forms
- onboarding steps
- CTAs
- save actions
- edit actions
- delete actions
- subscription actions
- role selector
- auth flows
- job actions
- recruiter actions
- college actions
- student actions

The final frontend should have no decorative dead buttons.

==================================================
0. FIRST — AUDIT BEFORE CODING
==================================================

Before editing:

1. Inspect the whole project.
2. Search for:
   - <button>
   - Button components
   - Link components
   - onClick
   - href
   - dropdown triggers
   - tabs
   - icon buttons
   - cards styled as clickable
   - CTAs
   - submit buttons
3. Identify:
   - functional interactions
   - dead buttons
   - placeholder handlers
   - `href="#"` links
   - `javascript:void(0)`
   - console.log-only actions
   - buttons without handlers
   - forms that do not submit
   - tabs that do nothing
   - filters that do not change data
4. Create an interaction inventory.

Do not modify anything until the audit is complete.

==================================================
1. INTERACTION INVENTORY
==================================================

Create a temporary implementation checklist grouped by:

PUBLIC
AUTH
ONBOARDING
STUDENT
COLLEGE
RECRUITER
PROFILE
SUBSCRIPTION
GLOBAL UI

For every clickable element record:

- page
- element label
- expected behavior
- existing behavior
- required fix
- backend dependency yes/no

Example:

Page:
/dashboard

Element:
Continue My Plan

Expected:
Navigate to active roadmap

Current:
No action

Fix:
router.push("/roadmap")

Backend dependency:
No

==================================================
2. RULE — NO DEAD INTERACTIONS
==================================================

Every visible clickable control must do one of the following:

1. Navigate
2. Open a modal
3. Open a menu
4. Change view/state
5. Submit data
6. Filter data
7. Trigger an API/service call
8. Download/export something
9. Start a workflow
10. Show a clear unavailable/coming-soon state

Never leave a button with no effect.

If a real backend capability does not exist:
use a realistic frontend mock interaction through the centralized service/mock layer.

Do NOT fake success for destructive or payment actions.

==================================================
3. GLOBAL NAVIGATION
==================================================

Verify all sidebar items.

STUDENT:

HOME
→ /dashboard

TWIN
→ /career-twin

MENTOR
→ /mentor

RESUME
→ /resume

SKILLS
→ /skills

ROADMAP
→ /roadmap

ECHO
→ /echo

JOBS
→ /jobs

PROGRESS
→ /progress

COLLEGE:

HOME
→ /college

STUDENTS
→ /college/students

READINESS
→ /college/readiness

SKILLS
→ /college/skills

DEPARTMENTS
→ /college/departments

RECRUITERS
→ /college/recruiters

REPORTS
→ /college/reports

PROGRESS
→ /college/progress

RECRUITER:

HOME
→ /recruiter

TALENT
→ /recruiter/talent

CANDIDATES
→ /recruiter/candidates

MATCHES
→ /recruiter/matches

PIPELINE
→ /recruiter/pipeline

JOBS
→ /recruiter/jobs

ANALYTICS
→ /recruiter/analytics

PROGRESS
→ /recruiter/progress

Highlight current route correctly.

==================================================
4. TOPBAR CONTROLS
==================================================

SEARCH

Search input must function.

If global search exists:
search relevant entities by role.

Student:
- jobs
- roadmap items
- skills
- mentor commands

College:
- students
- departments
- recruiters

Recruiter:
- candidates
- jobs
- skills

At minimum:
show a searchable command/results dropdown.

ARIA ACTIVE

If clicked:
open ARIA quick panel or navigate to /mentor.

Do not leave it decorative.

NOTIFICATIONS

Bell click:
open notification popover.

Notifications can:
- open relevant destination
- mark as read
- mark all read

PROFILE AVATAR

Click:
open account menu.

Menu:

Profile
Settings
Billing
Appearance
Help
Feedback
Sign Out

All must work.

==================================================
5. THEME CONTROLS
==================================================

Light
Dark
System

must immediately update appearance.

Persist selection.

System must follow OS theme.

Profile dropdown appearance submenu must work.

Do not require page reload.

==================================================
6. PUBLIC LANDING PAGE
==================================================

Every navbar link:

Features
→ smooth scroll to features

Ecosystem
→ ecosystem section

How It Works
→ corresponding section

Pricing
→ pricing

Get Started
→ /onboarding

Explore CareerOS
→ scroll to product/features

Login
→ open role selector in login mode

Sign Up
→ open role selector in signup mode

Pricing CTAs:
route into correct signup/subscription flow.

Footer links must work or be removed.

==================================================
7. ROLE SELECTOR
==================================================

Login:

Student
→ /auth/student?mode=login

College
→ /auth/college?mode=login

Recruiter
→ /auth/recruiter?mode=login

Admin
→ /auth/admin?mode=login

Signup:

Student
→ /auth/student?mode=signup

College
→ /auth/college?mode=signup

Recruiter
→ /auth/recruiter?mode=signup

Admin
→ admin login only

Close button:
closes selector.

Change Role:
returns to selector.

==================================================
8. AUTH FORMS
==================================================

All auth forms need:

- field validation
- password visibility toggle
- loading state
- submit behavior
- error state
- success transition

Forgot Password:
open reset flow/modal/page.

Login:
call auth service.

Signup:
call signup service or mock service.

After signup:

Student
→ /onboarding/student

College
→ /onboarding/college

Recruiter
→ /onboarding/recruiter

After login:
redirect based on role and onboarding completion.

==================================================
9. ONBOARDING WIZARDS
==================================================

Every onboarding button must work:

Back
Continue
Skip
Save
Add
Remove
Upload
Review
Edit
Confirm

Progress must update.

Answers must persist across steps.

If the user refreshes:
restore current onboarding state where possible.

Final confirm:
create/update role profile.

Then show personalized result screen.

CTA:
Enter Dashboard

Secondary:
Review Profile

==================================================
10. STUDENT DASHBOARD
==================================================

Continue My Plan
→ /roadmap

Career Readiness card
→ /career-twin

Skill Progress
→ /skills

Upcoming ECHO
→ /echo

Recommended Job
→ job detail / jobs page

ARIA Insight
→ /mentor or open ARIA panel

Recent Activity items:
navigate to relevant feature.

==================================================
11. CAREER TWIN
==================================================

Improve My Twin
→ open recommended actions or /skills

Target role edit:
open inline edit/modal.

Trajectory controls:
switch time range if present.

Missing capability:
click skill → /skills

Recommended action:
route to roadmap/skills/resume/etc.

==================================================
12. ARIA MENTOR
==================================================

Chat input:
send messages.

Enter:
send.

Shift+Enter:
new line.

Quick prompts:
populate/send correct prompt.

Suggested actions:
functional.

Clear chat:
confirmation.

New conversation:
reset current conversation.

If backend unavailable:
use mock agent response from service layer.

Do not hardcode response directly into component.

==================================================
13. RESUME
==================================================

Upload Resume:
open file selector.

Drag/drop:
work.

Validate:
PDF if that is the accepted format.

Upload:
show progress.

Analyze:
trigger mock/API analysis.

Improvement cards:
expand/collapse.

Detected skill:
click can route/add to profile where appropriate.

Improve Resume:
open recommendations/action panel.

Replace Resume:
work.

Remove Resume:
confirmation.

==================================================
14. SKILLS
==================================================

Build My Learning Roadmap
→ /roadmap

Skill cards:
click expands detail.

Filters:
priority/category/status must work.

Current vs Required view:
toggle/tab must work.

Recommended action:
route appropriately.

==================================================
15. ROADMAP
==================================================

Continue Roadmap:
scroll/open next unfinished milestone.

Milestone:
expand/collapse.

Mark Complete:
updates progress.

Undo:
reverts.

Course/project links:
open appropriate detail/external placeholder safely.

Add to Calendar:
only if real integration exists; otherwise show clear integration-required state.

Do not fake calendar success.

==================================================
16. ECHO
==================================================

Start Session:
validate interview configuration.

Start:
show live session UI.

Mic:
toggle state.

Next Question:
advance question.

End Session:
confirmation.

Finish:
show results.

Practice Again:
reset/start new session.

View Improvements:
scroll/open result details.

If voice backend does not exist:
simulate frontend state clearly via mock service.

==================================================
17. JOBS
==================================================

Search:
filters job list.

Filters:
location
salary
role
match
type

Save:
toggle saved state.

Apply:
open application flow/modal.

View Match:
open job detail/match explanation.

Missing skill:
navigate to /skills.

Company:
open company detail if available.

Pagination/load more:
functional.

==================================================
18. PROGRESS
==================================================

Time-range controls:
7D / 30D / 3M / 6M etc. must update charts.

Metric cards:
click should reveal detail where designed.

Export:
download generated mock CSV if frontend-only.

Do not show export button if nothing happens.

==================================================
19. COLLEGE HOME
==================================================

View Students Needing Action
→ /college/students?filter=at-risk

KPI cards:
click into relevant filtered view.

Department card:
→ /college/departments

Recruiter activity:
→ /college/recruiters

==================================================
20. COLLEGE STUDENTS
==================================================

Search:
functional.

Filters:
department
readiness
placement status
graduation year

Sort:
functional.

Student row:
open student detail.

View:
works.

Flag Intervention:
updates state with confirmation.

Export:
download current filtered CSV.

Pagination:
works.

==================================================
21. COLLEGE READINESS
==================================================

Readiness segment:
click filters relevant students.

Batch selector:
updates charts.

View At-Risk Students:
→ filtered student page.

Chart tooltips:
functional.

==================================================
22. COLLEGE SKILLS
==================================================

Heatmap:
interactive.

Skill click:
show detail panel.

Department selector:
updates data.

View Skill Breakdown:
works.

==================================================
23. COLLEGE DEPARTMENTS
==================================================

Department row/card:
open detailed view.

Sort and filter:
functional.

Trend range:
functional.

==================================================
24. COLLEGE RECRUITERS
==================================================

Recruiter entry:
open recruiter activity detail.

Filters:
active/inactive/engagement.

Role links:
work.

==================================================
25. COLLEGE REPORTS
==================================================

Report type selection:
works.

Generate Report:
produces frontend mock or calls report service.

Export PDF/CSV:
only show if functional.

Date range:
updates report request.

==================================================
26. RECRUITER HOME
==================================================

Discover Candidates
→ /recruiter/talent

Top Match:
open candidate.

Active Role:
open job.

Pipeline card:
→ /recruiter/pipeline

==================================================
27. TALENT SEARCH
==================================================

Natural-language search:
must return filtered/mock results.

Filters:
skills
college
graduation
location
readiness
availability

Clear Filters:
works.

Candidate card:
opens candidate detail.

Shortlist:
updates state.

==================================================
28. CANDIDATES
==================================================

Profile tabs:
Profile
Resume
Skills
Projects
ECHO
Match

All tabs must work.

Shortlist:
works.

Remove from shortlist:
works.

Open Resume:
functional.

==================================================
29. MATCHES
==================================================

Role selector:
updates ranked candidates.

Sort by:
match
readiness
skill fit

Candidate:
open detail.

Explain Match:
open detail panel.

Shortlist:
works.

==================================================
30. PIPELINE
==================================================

Kanban stages:

Discovered
Reviewed
Shortlisted
Interview
Offer
Hired

Cards must be draggable if drag/drop is present.

On drop:
update stage.

Click candidate:
open detail.

Remove:
confirmation.

Filter by job:
functional.

==================================================
31. RECRUITER JOBS
==================================================

Create Role:
open form.

Edit:
populate form.

Save:
validate and update.

Deactivate:
confirmation.

Delete:
confirmation.

View Matching Candidates:
→ /recruiter/matches?job=...

==================================================
32. RECRUITER ANALYTICS
==================================================

Date filters:
work.

Job selector:
work.

Charts:
update.

Export:
functional or removed.

==================================================
33. PROFILE
==================================================

Edit:
enable fields.

Save:
validate and persist.

Cancel:
restore previous state.

Skills:
add/remove/edit.

Experience:
add/edit/delete.

Education:
edit.

Resume:
replace.

Changes should propagate to relevant pages.

==================================================
34. BILLING / SUBSCRIPTION
==================================================

Upgrade:
route to subscription.

Change Plan:
works.

Billing cycle:
updates summary.

Billing form:
validates.

Pay:
call payment service or open provider integration.

If gateway is not connected:
do not fake successful payment.

Use a safe development state:

"Payment provider is not connected in this environment."

Cancellation:
confirmation.

Manage Subscription:
works through local/service state if backend exists.

==================================================
35. HELP & FEEDBACK
==================================================

Help:
open page/modal.

FAQ accordion:
works.

Contact Support:
functional form or mail action if configured.

Feedback:
open modal.

Submit:
validate and show success only if stored/sent through service layer.

==================================================
36. SIGN OUT
==================================================

Click Sign Out:
show confirmation.

Confirm:
clear auth state.

Redirect:
landing/login.

Cancel:
close dialog.

==================================================
37. BUTTON STATES
==================================================

Every button should support relevant states:

Default
Hover
Pressed
Focus
Disabled
Loading

Loading buttons:
prevent double click.

Disabled:
must explain reason if not obvious.

==================================================
38. FORMS
==================================================

Every form must have:

Zod validation where practical.

Inline errors.

Clear required/optional distinction.

Submit disabled while invalid only where appropriate.

Loading.

Success.

Error.

No silent failures.

==================================================
39. MODALS / POPOVERS
==================================================

Every modal/popover:

Open correctly.

Close via:
- X
- outside click where appropriate
- Escape

Return focus to trigger.

Do not stack broken overlays.

==================================================
40. SEARCH AND FILTER RULE
==================================================

A search field that exists visually MUST affect data.

A filter that exists visually MUST affect data.

If current data is mock:
filter the mock data.

Do not keep decorative filters.

==================================================
41. DOWNLOAD / EXPORT RULE
==================================================

If button says:

Download
Export
CSV
PDF
Invoice

it must actually download something or call the correct service.

If unsupported:
remove or replace with disabled state plus explanation.

Do not fake downloaded reports.

==================================================
42. EXTERNAL LINKS
==================================================

External links:
open safely.

Use:
target="_blank"
rel="noopener noreferrer"

where appropriate.

Do not use empty hrefs.

==================================================
43. BACKEND-DEPENDENT INTERACTIONS
==================================================

Classify each action:

A. Fully frontend
B. Frontend + existing API
C. Backend unavailable

For C:

Build:
- UI interaction
- loading state
- typed service method
- mock adapter if appropriate

Do not pretend production completion.

Example:

Payment
Voice interview
Real AI response
Real email support

must not falsely report real-world success unless actually integrated.

==================================================
44. CENTRALIZED SERVICE LAYER
==================================================

Do not place random mock handlers inside components.

Use services such as:

authService
profileService
studentService
collegeService
recruiterService
resumeService
skillsService
roadmapService
echoService
jobsService
subscriptionService
notificationService
supportService

UI components call these interfaces.

==================================================
45. TOAST / FEEDBACK SYSTEM
==================================================

Add consistent feedback.

Examples:

"Profile updated"
"Job saved"
"Candidate shortlisted"
"Roadmap step completed"
"Report generated"

Errors:

"Unable to save changes"
"Something went wrong"

Avoid toast spam.

==================================================
46. URL STATE
==================================================

Use URL/query parameters where useful.

Examples:

/college/students?status=at-risk

/recruiter/matches?job=ai-engineer

/jobs?type=internship

This allows links and navigation to preserve context.

==================================================
47. ACCESSIBILITY
==================================================

Clickable divs should become proper buttons/links where appropriate.

Support:

Tab
Enter
Space
Escape
Focus indicators
ARIA labels

Do not rely only on hover.

==================================================
48. MOBILE
==================================================

Every interaction must remain usable on mobile.

Dropdowns:
become sheets if needed.

Tables:
responsive alternatives / horizontal scroll.

Buttons:
minimum usable touch target.

No hover-only critical functionality.

==================================================
49. ANIMATIONS
==================================================

Preserve existing approved motion.

Functional interactions may use:

150–250ms state transitions
button press
popover animation
tab transition
drawer slide
loading shimmer
success check

Do not add excessive animation while fixing functionality.

==================================================
50. DO'S
==================================================

DO:

✓ Audit every clickable element.
✓ Make all primary CTAs functional.
✓ Use real routes.
✓ Use centralized handlers/services.
✓ Make filters actually filter.
✓ Make search actually search.
✓ Make tabs actually switch.
✓ Make forms actually validate.
✓ Make modals actually open/close.
✓ Add useful feedback.
✓ Handle loading/error states.
✓ Prevent double submissions.
✓ Preserve role boundaries.
✓ Maintain theme system.
✓ Keep existing design.
✓ Test interactions after implementation.

==================================================
51. DON'TS
==================================================

DON'T:

✗ Leave decorative buttons.
✗ Use href="#".
✗ Use console.log as final behavior.
✗ Create fake success for payment.
✗ Create fake success for email.
✗ Create fake backend data mutations without a mock/service model.
✗ Break navigation.
✗ Rewrite approved design.
✗ Add new features outside scope.
✗ Ignore mobile interactions.
✗ Leave filters static.
✗ Leave tabs static.
✗ Leave upload controls non-functional.
✗ leave buttons without keyboard behavior.

==================================================
52. TESTING REQUIREMENTS
==================================================

After implementation:

Run:
- typecheck
- lint
- tests

Then manually verify every route.

Create an interaction test matrix.

For every page verify:

- navigation
- primary CTA
- secondary CTA
- forms
- dropdowns
- tabs
- filters
- search
- modal
- mobile behavior

Fix all introduced errors.

==================================================
53. AUTOMATED TEST PRIORITY
==================================================

Prioritize tests for:

1. Role routing
2. Login/signup navigation
3. Onboarding steps
4. Theme switching
5. Student sidebar
6. College sidebar
7. Recruiter sidebar
8. Profile menu
9. Search/filter behavior
10. Forms
11. Subscription routing
12. Sign out

Use the project's existing test stack.

Do not introduce a huge new testing framework unless necessary.

==================================================
54. FINAL DEAD-CLICK AUDIT
==================================================

Before claiming completion:

Search the codebase again for:

href="#"
TODO handlers
console.log
empty onClick
buttons without action
placeholder anchors
disabled buttons without explanation

Inspect all pages visually.

There must be no unexplained dead clicks.

==================================================
55. FINAL REPORT
==================================================

At completion return:

FUNCTIONALITY COMPLETED:
[...]

DEAD INTERACTIONS FIXED:
[number]

ROUTES VERIFIED:
[...]

FORMS VERIFIED:
[...]

SEARCH/FILTERS VERIFIED:
[...]

BACKEND-DEPENDENT FEATURES:
[...]

MOCKED FEATURES:
[...]

TESTS RUN:
[...]

ISSUES FIXED:
[...]

KNOWN LIMITATIONS:
[...]

FINAL STATUS:
GO / NO-GO

==================================================
DEFINITION OF DONE
==================================================

This task is complete only when:

✓ Every visible navigation item works.
✓ Every primary button works.
✓ Every secondary action works or clearly explains why unavailable.
✓ Role selector works.
✓ Login/signup interactions work.
✓ Onboarding controls work.
✓ Student features are interactive.
✓ College features are interactive.
✓ Recruiter features are interactive.
✓ Profile menu works.
✓ Theme switch works.
✓ Search works.
✓ Filters work.
✓ Tabs work.
✓ Forms validate.
✓ Modals work.
✓ Subscription navigation works.
✓ Logout works.
✓ No dead links remain.
✓ No fake production success states are introduced.
✓ Typecheck/lint/tests pass or remaining issues are explicitly reported.

Do not consider visual completeness equivalent to functional completeness.

The goal of this iteration is:

EVERY CLICK SHOULD HAVE A MEANINGFUL RESULT.
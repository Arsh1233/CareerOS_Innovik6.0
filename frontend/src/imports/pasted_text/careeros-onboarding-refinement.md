Refine the existing CareerOS onboarding page.

IMPORTANT:
Preserve the approved CareerOS design system, light/dark/system themes, onboarding hierarchy, role cards, pricing, typography, spacing, and existing content.

Do NOT redesign the entire onboarding page.

The goal of this iteration is to add:

1. Login and Sign Up buttons in the onboarding header
2. Role selection before authentication
3. Separate role-specific Login and Signup experiences
4. Premium Figma prototype animations
5. Advanced hover interactions
6. Smooth page transitions
7. Strong visual delight while remaining professional

==================================================
1. ONBOARDING HEADER
==================================================

Create a clean sticky navigation bar at the top of the onboarding page.

LEFT:
CareerOS logo

CENTER / OPTIONAL:
Navigation links:

Features
How It Works
Ecosystem
Pricing

Clicking these should smoothly scroll to the relevant onboarding section.

RIGHT:

Theme Switcher
Light / Dark / System

Login

Sign Up

LOGIN:
Secondary / ghost button

SIGN UP:
Primary CareerOS blue button

Desktop structure:

CareerOS      Features   Ecosystem   Pricing        Theme   Login   Sign Up

On mobile:
Use a compact menu while keeping Login and Sign Up clearly accessible.

The header should become slightly more opaque / elevated after scrolling.

==================================================
2. LOGIN BUTTON FLOW
==================================================

When the user clicks:

LOGIN

Do NOT immediately open a generic login form.

First show a role-selection experience.

Heading:

"Welcome back"

Subheading:

"Choose how you use CareerOS."

Show four role options:

STUDENT
COLLEGE
RECRUITER
ADMIN

Each role card should contain:

Icon
Role name
One-line description

STUDENT
"Continue your career journey."

COLLEGE
"Access placement intelligence."

RECRUITER
"Return to your talent workspace."

ADMIN
"Manage the CareerOS platform."

When selected:

Student
→ /auth/student?mode=login

College
→ /auth/college?mode=login

Recruiter
→ /auth/recruiter?mode=login

Admin
→ /auth/admin?mode=login

==================================================
3. SIGN UP BUTTON FLOW
==================================================

When the user clicks:

SIGN UP

First ask:

"How will you use CareerOS?"

Show:

Student
College
Recruiter
Admin

Student:

"Build your career with AI."

→ /auth/student?mode=signup

College:

"Turn student progress into placement intelligence."

→ /auth/college?mode=signup

Recruiter:

"Discover job-ready talent faster."

→ /auth/recruiter?mode=signup

Admin:

Do NOT allow public Admin signup.

Show:

"Admin accounts are provisioned internally."

CTA:

Admin Login

→ /auth/admin?mode=login

==================================================
4. ROLE SELECTION UX
==================================================

Prefer a premium modal / floating panel instead of navigating to a completely separate role-selection page.

Desktop:

Centered modal.

Width:
Approximately 720–900px.

Show 4 role cards in a row or 2x2 grid.

Mobile:

Bottom sheet / full-screen modal.

Allow:

Close

Back

Keyboard navigation

Escape to close on desktop.

==================================================
5. ROLE CARD INTERACTION
==================================================

Each role card should feel highly interactive.

DEFAULT:

White card in light mode.

Subtle neutral border.

Minimal shadow.

Outlined role icon.

HOVER:

Card moves upward:
-4px to -6px

Border transitions toward role accent.

Soft ambient glow appears behind the card.

Icon slightly scales:
1.05

Tiny background gradient moves subtly.

Arrow appears:
→

Duration:
180–250ms

SELECTED:

Card slightly enlarges:
1.02

Border becomes CareerOS blue.

Small check indicator appears.

Background becomes very subtle tinted surface.

Then after approximately 250ms:

Transition to authentication screen.

Do NOT use dark cards in light mode.

==================================================
6. AUTHENTICATION PAGE TRANSITION
==================================================

When a role is selected:

Role card
→ expands / morphs
→ becomes authentication container

Create a smooth visual continuity effect.

Example:

Student card selected
↓
Card expands toward center
↓
Student icon remains visible briefly
↓
Login form fades in
↓
Background content softly fades

Target duration:
350–500ms

The effect should feel similar to premium Apple / Linear interface transitions.

Do not make it too slow.

==================================================
7. STUDENT AUTH
==================================================

Route:

/auth/student

LOGIN MODE:

Heading:
"Welcome back"

Supporting text:
"Continue building your career with CareerOS."

Fields:

Email
Password

Options:

Remember Me
Forgot Password
Continue with Google

CTA:

Login as Student

Secondary:

New to CareerOS?
Create Account

Switching to signup should animate the form rather than reload the whole page.

SIGNUP MODE:

Heading:
"Start building your CareerOS"

Fields:

Full Name
Email
Password
Confirm Password

CTA:

Create Student Account

Then:

→ /onboarding/student

==================================================
8. COLLEGE AUTH
==================================================

Route:

/auth/college

LOGIN:

Heading:
"Welcome back"

Subheading:
"Access your placement intelligence workspace."

Fields:

Official Institution Email
Password

CTA:

Login to College Portal

Secondary:

Register Institution

SIGNUP:

Fields:

Institution Name
Official Institution Email
Contact Person
Designation
Password

Show:

"Institution verification may be required."

CTA:

Register Institution

Then:

→ /onboarding/college

==================================================
9. RECRUITER AUTH
==================================================

Route:

/auth/recruiter

LOGIN:

Heading:
"Welcome back"

Subheading:
"Your next great hire could already be here."

Fields:

Work Email
Password

Options:

Continue with Google Workspace
Forgot Password

CTA:

Login to Recruiter Portal

SIGNUP:

Fields:

Full Name
Work Email
Company Name
Job Title
Password

CTA:

Create Recruiter Account

Then:

→ /onboarding/recruiter

==================================================
10. ADMIN AUTH
==================================================

Route:

/auth/admin

Login only.

Heading:

"CareerOS Administration"

Fields:

Admin Email
Password
2FA Code

CTA:

Secure Admin Login

No:
Signup
Google signup
Public registration

==================================================
11. CRAZY BUT PREMIUM ONBOARDING ANIMATIONS
==================================================

The onboarding page should feel significantly more alive.

Use bold interaction design but maintain premium restraint.

--------------------------------
HERO
--------------------------------

CareerOS AI Core should slowly float.

Use:
2–4px vertical movement

Duration:
4–6 seconds

Loop:
Ease-in-out

The Student, College, and Recruiter nodes should orbit or drift extremely subtly.

Connection lines should animate as if intelligence/data is flowing through them.

Use small moving light particles inside the connecting paths.

Do not fill the entire background with particles.

--------------------------------
HERO TEXT
--------------------------------

On page load:

Small label fades in.

Headline reveals line-by-line.

Supporting text fades upward.

CTA buttons appear with a slight stagger.

Total entrance should finish within approximately 800ms.

--------------------------------
PRIMARY CTA
--------------------------------

On hover:

Button moves upward 2px.

Gradient subtly shifts.

Arrow moves 3–5px right.

Soft glow increases slightly.

On click:

Scale to 0.97 briefly.

--------------------------------
FRAGMENTED VS CAREEROS
--------------------------------

Create an interactive transformation animation.

Initially:

Multiple disconnected nodes appear.

As the section enters viewport:

Their individual connecting lines animate inward.

They merge into:

CareerOS

Then connect outward to:

Understand
Learn
Prepare
Practice
Apply
Grow

This should visually demonstrate:

Fragmented → Unified

Keep animation around:
700–1000ms.

--------------------------------
FEATURES
--------------------------------

Cards should stagger into view.

Hover behavior:

Card lifts 4px.

Icon rotates / moves only 2–4 degrees if appropriate.

Description becomes slightly darker.

Small animated line / highlight appears beneath title.

Optional:

For Career Twin:
small trajectory animation

For ARIA:
subtle AI pulse

For Resume:
small scan animation

For Skills:
progress line fills

For Roadmap:
path draws

For ECHO:
voice waveform animates

For Jobs:
match percentage fills

Do NOT animate continuously when not hovered.

--------------------------------
CLOSED-LOOP USP
--------------------------------

Create the strongest interaction on this section.

Students
→ Colleges
→ Recruiters
→ CareerOS AI
→ Students

Animate the connection path continuously but VERY slowly.

When user hovers:

STUDENT:
Highlight Student node and downstream College impact.

COLLEGE:
Highlight College → Recruiter relationship.

RECRUITER:
Highlight Recruiter → CareerOS → Student feedback path.

Other nodes reduce opacity slightly.

This should help users understand how each stakeholder impacts the next.

--------------------------------
ROLE SELECTION
--------------------------------

On hover:

Role illustration moves subtly toward cursor / card center.

Use mild 3D tilt:

Maximum:
2–3 degrees

Do NOT create dramatic perspective distortion.

Role-specific hover accent:

Student:
Blue

College:
Violet

Recruiter:
Cyan

Admin:
Neutral Indigo

--------------------------------
PRICING
--------------------------------

Plan cards:

Hover:
-2px elevation

Selected:
border accent

Popular:
very subtle gradient highlight

Billing toggle:
animated sliding selector

Price:
smooth number transition when Monthly / Annual changes.

Do not make pricing cards wobble or scale excessively.

==================================================
12. CURSOR-BASED INTERACTIONS
==================================================

For desktop only:

Allow very subtle cursor-responsive movement on:

Hero AI Core
Role cards
Large ecosystem illustration

Maximum translation:
4–8px

Do not move text.

Do not move forms.

Do not use heavy parallax.

==================================================
13. SCROLL REVEAL SYSTEM
==================================================

Use consistent section reveal animations.

Default:

Opacity:
0 → 1

Y:
20px → 0

Duration:
400–600ms

Stagger:
50–90ms

Do not use a completely different animation for every section.

==================================================
14. PAGE TRANSITIONS
==================================================

Onboarding
→ Role Modal
→ Auth
→ Questionnaire
→ Dashboard

should feel connected.

Use:

shared card transitions
fade
small horizontal slide
progressive reveal

Avoid:
full-screen flashes
hard cuts
dramatic zooms

==================================================
15. LOGIN / SIGNUP SWITCH
==================================================

Inside Student / College / Recruiter authentication:

Allow:

Login ↔ Sign Up

without returning to role selection.

Animate:

Current form:
fade + slide left 12px

New form:
fade + slide right 12px

Duration:
200–250ms

Keep selected role visible.

Add:

"Change Role"

which returns to role selector.

==================================================
16. FUNCTIONAL PROTOTYPE FLOW
==================================================

Create actual Figma prototype links.

LOGIN:

Onboarding Login
→ Role Selector

Student
→ Student Login

College
→ College Login

Recruiter
→ Recruiter Login

Admin
→ Admin Login


SIGNUP:

Onboarding Sign Up
→ Role Selector

Student
→ Student Signup
→ Student Questionnaire
→ Student Result
→ Dashboard

College
→ College Signup
→ College Questionnaire
→ College Result
→ College Dashboard

Recruiter
→ Recruiter Signup
→ Recruiter Questionnaire
→ Recruiter Result
→ Recruiter Dashboard

Admin
→ Admin Login

==================================================
17. LIGHT MODE
==================================================

CRITICAL:

Do not use dark-themed cards anywhere in light mode.

Use:

Off-white canvas

White floating cards

Subtle grey secondary surfaces

Light borders

CareerOS blue/violet/cyan accents

Soft shadows

Do not introduce:

Black cards
Charcoal cards
Dark hero panels
Dark pricing cards
Dark auth forms

==================================================
18. DARK MODE
==================================================

Use:

Neutral charcoal background

Layered neutral surfaces

Off-white text

Subtle borders

Restrained blue accents

Do NOT turn dark mode into:

Cyberpunk
Neon gaming
Purple gradient overload
Black + glowing blue cards everywhere

==================================================
19. DO'S
==================================================

DO:

✓ Keep Login and Sign Up visible in header.
✓ Ask role before showing authentication form.
✓ Keep role choice remembered through auth flow.
✓ Create separate role-specific authentication.
✓ Animate important interactions.
✓ Make the role selector visually exciting.
✓ Use premium hover states.
✓ Use shared transitions where possible.
✓ Keep animations short.
✓ Use Smart Animate appropriately.
✓ Use hover states as component variants.
✓ Maintain accessibility.
✓ Support keyboard navigation.
✓ Respect reduced-motion preferences.
✓ Preserve Light/Dark/System modes.
✓ Maintain existing CareerOS brand system.
✓ Use actual prototype connections.

==================================================
20. DON'TS
==================================================

DON'T:

✗ Open generic login before choosing role.
✗ Put Student/College/Recruiter/Admin into one confusing form.
✗ Give Admin public signup.
✗ Use dark cards in light mode.
✗ Add bouncing icons everywhere.
✗ Use constant card animations.
✗ Use giant cursor effects.
✗ Use excessive parallax.
✗ Animate important text continuously.
✗ Make animations delay user actions.
✗ Use cyberpunk/neon visuals.
✗ add random gradient blobs to make the design “futuristic.”
✗ make hover effects inconsistent.
✗ redesign existing approved sections.
✗ sacrifice usability for visual effects.

==================================================
21. FIGMA IMPLEMENTATION GUIDANCE
==================================================

Use Figma component variants for:

Buttons:
Default
Hover
Pressed
Disabled

Role Cards:
Default
Hover
Selected

Feature Cards:
Default
Hover

Pricing:
Default
Hover
Selected

Inputs:
Default
Focus
Filled
Error
Disabled

Theme Switch:
Light
Dark
System

Use Smart Animate for:

Role card expansion
Login/signup switching
Step transitions
Modal opening
Pricing toggle
Success state
Navigation indicator movement

Recommended easing:

Ease Out:
most entrances

Ease In-Out:
shared transitions

Spring:
only very subtle interactive elements

Avoid excessive spring animations.

==================================================
SUCCESS CRITERIA
==================================================

This iteration is successful when:

1. Login and Sign Up are clearly visible on onboarding.
2. Both ask for role before authentication.
3. Student, College, Recruiter, and Admin get separate login pages.
4. Signup leads into the correct role questionnaire.
5. Admin does not have public signup.
6. Role selection feels visually memorable.
7. Hover interactions feel premium.
8. Major onboarding sections include meaningful animation.
9. Figma prototype flow is actually clickable.
10. Animations never reduce usability.
11. Light mode remains genuinely light.
12. Dark mode remains professional.
13. CareerOS feels significantly more dynamic without looking vibe-coded.
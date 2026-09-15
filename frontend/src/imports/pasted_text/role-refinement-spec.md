You are now refining the CareerOS application after the onboarding and role-selection system has been designed.

Your task is to make every role-specific experience COMPLETE, FIXED, FUNCTIONAL, VISUALLY CONSISTENT, and properly separated by permissions.

IMPORTANT:
Do not invent new major features beyond what is already assigned to each role.
Do not move features between roles.
Do not expose Student features to College users.
Do not expose College features to Recruiters.
Do not expose Recruiter features to Students.
Do not expose Admin capabilities to public users.

The goal is to make the existing role structure feel production-ready.

==================================================
GLOBAL PRODUCT RULE
==================================================

CareerOS has four roles:

1. Student
2. College
3. Recruiter
4. Admin

Each role has:
- its own authentication flow
- its own onboarding flow
- its own dashboard
- its own sidebar
- its own feature set
- its own permissions
- its own empty/loading/error states
- its own role-specific data

All roles must still look like the same CareerOS product.

==================================================
ROLE ACCESS LOGIC
==================================================

Use strict role-based routing.

STUDENT
Allowed:
- /dashboard
- /career-twin
- /mentor
- /resume
- /skills
- /roadmap
- /echo
- /jobs
- /progress
- /profile

COLLEGE
Allowed:
- /college
- /college/students
- /college/readiness
- /college/skills
- /college/departments
- /college/recruiters
- /college/reports
- /college/progress
- /college/settings

RECRUITER
Allowed:
- /recruiter
- /recruiter/talent
- /recruiter/candidates
- /recruiter/matches
- /recruiter/pipeline
- /recruiter/jobs
- /recruiter/analytics
- /recruiter/progress
- /recruiter/settings

ADMIN
Allowed:
- /admin
- /admin/users
- /admin/colleges
- /admin/recruiters
- /admin/analytics
- /admin/ai-usage
- /admin/logs
- /admin/control
- /admin/settings

If a user tries to access another role’s route:
redirect them to their own role dashboard.

==================================================
SIDEBAR RULES
==================================================

Use the same compact vertical sidebar layout across all roles.

Visual style:
- light sidebar in light mode
- dark neutral sidebar in dark mode
- compact icon + uppercase label
- rounded active state
- subtle left active indicator
- minimal width
- scroll if needed
- profile/settings near bottom

IMPORTANT:
In light mode:
DO NOT use black or dark themed cards in the sidebar or content area.

Use:
- white
- off-white
- soft grey
- subtle blue selected states

In dark mode:
Use neutral charcoal surfaces.

==================================================
STUDENT ROLE
==================================================

Sidebar:
HOME
TWIN
MENTOR
RESUME
SKILLS
ROADMAP
ECHO
JOBS
PROGRESS

--------------------------------
HOME / DASHBOARD
--------------------------------

Goal:
Show what the student should focus on today.

Must include:
- Career Readiness Score
- Target Role
- Top AI Insight
- Weekly Goal
- Skill Progress
- Upcoming ECHO session
- Recommended Job
- Recent Activity

Primary CTA:
Continue My Plan

Animations:
- readiness score count-up
- progress bar fill
- card fade-up
- subtle hover elevation

Do not overload with more than 4 major KPI cards.

--------------------------------
TWIN
--------------------------------

Must include:
- target role
- readiness score
- goal alignment
- salary projection
- placement probability
- career trajectory
- missing capability summary

Primary CTA:
Improve My Twin

Animations:
- smooth trajectory line draw
- circular score fill
- subtle AI pulse

--------------------------------
MENTOR
--------------------------------

ARIA Mentor must include:
- chat
- quick actions
- current target role
- readiness context
- roadmap context
- suggested prompts

Quick actions:
- What should I learn next?
- Review my progress
- Improve my resume
- Prepare me for ECHO
- Find relevant jobs

Animations:
- typing indicator
- soft AI orb pulse
- message fade-in

Do not make it look like a generic ChatGPT clone.

--------------------------------
RESUME
--------------------------------

Must include:
- PDF upload
- ATS score
- detected skills
- strengths
- missing keywords
- priority improvements
- target role fit

Primary CTA:
Improve Resume

Animations:
- upload progress
- score fill
- analysis shimmer
- suggestion reveal

--------------------------------
SKILLS
--------------------------------

Must include:
- target role
- overall skill readiness
- current vs required skills
- top 3–5 critical gaps
- priority level
- recommended actions

Primary CTA:
Build My Learning Roadmap

Animations:
- radar/chart draw
- bar fill
- hover skill highlight

--------------------------------
ROADMAP
--------------------------------

Must include:
- personalized week-by-week plan
- milestones
- recommended skills
- projects
- certifications
- completion progress
- estimated readiness improvement

Primary CTA:
Continue Roadmap

Animations:
- milestone reveal
- progress line draw
- completion check animation

--------------------------------
ECHO
--------------------------------

Rename Interview to ECHO everywhere.

Must include:
Start Screen:
- interview type
- role
- difficulty
- duration

Live Session:
- ECHO avatar/orb
- current question
- timer
- microphone state
- voice waveform

Results:
- overall score
- technical
- communication
- confidence
- strengths
- improvement area

Primary CTA:
Practice Again

Animations:
- waveform
- listening pulse
- score reveal

--------------------------------
JOBS
--------------------------------

Must include:
- job matches
- match %
- location
- salary where available
- matching skills
- missing requirement
- save/apply actions

Primary CTA:
View Match

Animations:
- card hover
- match score fill
- filter transition

--------------------------------
PROGRESS
--------------------------------

Must include:
- readiness trend
- roadmap completion
- interview improvement
- skill growth
- applications
- activity streak

Animations:
- line chart draw
- metric count-up

==================================================
COLLEGE ROLE
==================================================

Sidebar:
HOME
STUDENTS
READINESS
SKILLS
DEPARTMENTS
RECRUITERS
REPORTS
PROGRESS

--------------------------------
HOME
--------------------------------

Goal:
Show how placement-ready the institution is.

Must include:
- Placement Readiness %
- Job-Ready Students
- At-Risk Students
- Active Recruiters
- Department performance
- recent placement activity

Primary CTA:
View Students Needing Action

--------------------------------
STUDENTS
--------------------------------

Must include:
- searchable student table
- readiness score
- department
- target role
- resume status
- skill gaps
- ECHO performance
- placement status

Actions:
- View Student
- Filter
- Export
- Flag for Intervention

--------------------------------
READINESS
--------------------------------

Must include:
- placement readiness distribution
- job-ready vs developing vs at-risk
- batch comparison
- readiness trend
- placement forecast

Primary CTA:
View At-Risk Students

--------------------------------
SKILLS
--------------------------------

Must include:
- skill gap heatmap
- top missing skills
- industry-aligned demand
- department comparison
- employability gaps

Primary CTA:
View Skill Breakdown

--------------------------------
DEPARTMENTS
--------------------------------

Must include:
- department rankings
- readiness %
- average skill score
- placement performance
- trend comparison

--------------------------------
RECRUITERS
--------------------------------

Must include:
- active recruiters
- campus engagement
- roles shared
- applications
- shortlisted students
- engagement score

--------------------------------
REPORTS
--------------------------------

Must include:
- placement reports
- employability reports
- department reports
- skill reports
- recruiter reports
- export PDF/CSV

--------------------------------
PROGRESS
--------------------------------

Must include:
- placement trend
- student readiness growth
- skill gap reduction
- recruiter engagement growth

Animations:
- subtle KPI count-up
- chart line draw
- heatmap fade
- table row hover

College experience must remain analytical and professional.

==================================================
RECRUITER ROLE
==================================================

Sidebar:
HOME
TALENT
CANDIDATES
MATCHES
PIPELINE
JOBS
ANALYTICS
PROGRESS

--------------------------------
HOME
--------------------------------

Goal:
Answer:
Who should I talk to first?

Must include:
- top candidate matches
- active jobs
- shortlisted candidates
- pipeline overview
- average match score

Primary CTA:
Discover Candidates

--------------------------------
TALENT
--------------------------------

Must include:
Natural-language search:
"Find final-year students with Python, FastAPI, GenAI projects and 80%+ readiness"

Filters:
- skill
- college
- graduation year
- location
- readiness
- availability

Results:
- candidate
- match %
- skill fit
- readiness
- college
- availability

--------------------------------
CANDIDATES
--------------------------------

Must include:
- candidate profiles
- resume
- skills
- projects
- readiness
- ECHO score
- match explanation
- shortlist status

--------------------------------
MATCHES
--------------------------------

Must include:
- ranked candidates
- skill match
- role fit
- missing skills
- AI summary
- confidence score

--------------------------------
PIPELINE
--------------------------------

Stages:
- Discovered
- Reviewed
- Shortlisted
- Interview
- Offer
- Hired

Use a clean Kanban or stage-based view.

--------------------------------
JOBS
--------------------------------

Must include:
- create role
- edit role
- target skills
- experience
- location
- active/inactive
- matching candidates

--------------------------------
ANALYTICS
--------------------------------

Must include:
- time-to-shortlist
- match quality
- top skills
- source breakdown
- role performance
- hiring funnel

--------------------------------
PROGRESS
--------------------------------

Must include:
- hiring velocity
- pipeline growth
- shortlist conversion
- successful hires

Animations:
- candidate cards fade in
- match score fill
- pipeline drag motion
- filters animate smoothly
- chart transitions restrained

Recruiter experience must feel fast, premium, and efficiency-focused.

==================================================
ADMIN ROLE
==================================================

Sidebar:
HOME
USERS
COLLEGES
RECRUITERS
ANALYTICS
AI USAGE
LOGS
CONTROL

--------------------------------
HOME
--------------------------------

Must include:
- total users
- active students
- active colleges
- active recruiters
- AI usage
- system health

--------------------------------
USERS
--------------------------------

Must include:
- user search
- role
- status
- joined date
- suspend/reactivate
- profile review

--------------------------------
COLLEGES
--------------------------------

Must include:
- college list
- verification
- active students
- subscription status
- usage

--------------------------------
RECRUITERS
--------------------------------

Must include:
- recruiter/company list
- verification
- active roles
- usage
- status

--------------------------------
ANALYTICS
--------------------------------

Must include:
- platform adoption
- role growth
- usage trends
- retention
- feature usage

--------------------------------
AI USAGE
--------------------------------

Must include:
- AI requests
- agent usage
- token/API usage
- high-volume users
- error rate

--------------------------------
LOGS
--------------------------------

Must include:
- auth logs
- API logs
- system events
- failures
- security events

--------------------------------
CONTROL
--------------------------------

Must include:
- role permissions
- feature flags
- system settings
- access control

Animations:
Minimal only.

Admin should feel operational, secure, and serious.

==================================================
FUNCTIONAL REQUIREMENTS
==================================================

Every page should have:

- real button interactions
- logical navigation
- loading state
- empty state
- error state
- success feedback
- disabled states
- hover states
- focus states
- confirmation dialogs when destructive
- responsive layouts

Examples:

Student clicks:
Build My Learning Roadmap
→ goes to /roadmap

Student clicks:
Practice with ECHO
→ goes to /echo

College clicks:
At-Risk Students
→ filtered student list

Recruiter clicks:
Discover Candidates
→ /recruiter/talent

Admin clicks:
Suspend User
→ confirmation modal

==================================================
ANIMATION SYSTEM
==================================================

Use motion only to improve usability.

Allowed:
- 180–300ms fade-up
- subtle hover lift
- smooth tab transition
- count-up numbers
- progress fill
- line chart draw
- soft AI pulse
- loading shimmer
- panel slide-in
- drawer transition
- modal scale/fade

Do NOT:
- animate all cards constantly
- use bouncing icons
- use particle backgrounds inside dashboards
- use neon glow pulses everywhere
- add unnecessary parallax
- make pages feel like a gaming UI

==================================================
LIGHT MODE RULES
==================================================

CRITICAL:
Do not use dark themed cards in light mode.

Light mode must use:
- white cards
- off-white page background
- soft grey secondary surfaces
- subtle blue/violet accents
- light neutral borders
- minimal shadows

Do NOT use:
- black cards
- dark navy cards
- charcoal card backgrounds
- heavy gradient panels
- black glassmorphism
- neon outlines

Dark content can only appear where functionally justified:
- charts
- small icon details
- code-like visual previews
- media thumbnails

Not as major UI containers.

==================================================
DARK MODE RULES
==================================================

Use:
- charcoal/slate surfaces
- off-white text
- muted borders
- restrained accents

Do not:
- over-glow
- use pure black everywhere
- make all cards purple/blue
- overuse transparency

==================================================
DO'S
==================================================

DO:
✓ Keep every role's features fixed.
✓ Maintain strict role separation.
✓ Use the same design system across roles.
✓ Keep navigation predictable.
✓ Add functional CTAs.
✓ Use real interaction states.
✓ Keep light mode actually light.
✓ Use subtle meaningful animation.
✓ Use progressive disclosure.
✓ Make tables/filtering functional.
✓ Use responsive layouts.
✓ Keep role-specific dashboards purpose-driven.
✓ Reuse components.
✓ Maintain accessibility.
✓ Keep content density controlled.
✓ Use clear empty states.
✓ Provide feedback after every major action.

==================================================
DON'TS
==================================================

DON'T:
✗ Move features between roles.
✗ Show Student features to College users.
✗ Show Recruiter tools to Students.
✗ Show Admin controls publicly.
✗ Use dark cards in light mode.
✗ Make every card glassmorphic.
✗ Use neon borders everywhere.
✗ Overload dashboards with charts.
✗ Add fake features.
✗ Add meaningless animations.
✗ Use inconsistent sidebars.
✗ Create different visual identities per role.
✗ Hardcode colors directly into components.
✗ Use generic admin templates.
✗ Hide important CTAs.
✗ Leave buttons non-functional.
✗ Use placeholder lorem ipsum.
✗ duplicate the same analytics on multiple pages.

==================================================
SUCCESS CRITERIA
==================================================

The implementation is successful when:

1. Each role sees only its own features.
2. Every sidebar item routes to a real page.
3. Student includes ROADMAP after SKILLS.
4. INTERVIEW is renamed to ECHO everywhere.
5. College and Recruiter experiences are clearly visible and complete.
6. Every major button performs a meaningful action.
7. Light mode contains no dark-themed content cards.
8. Dark mode feels professional, not vibe coded.
9. Animations support usability rather than decoration.
10. All roles feel like one unified CareerOS ecosystem.
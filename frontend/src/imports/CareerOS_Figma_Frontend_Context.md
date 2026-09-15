# CareerOS — Figma Frontend Design Context

## 1. Purpose of This File

This file is the single design-context handoff for creating the **CareerOS frontend in Figma**.

The goal is **not** to show every possible metric or feature on every screen. CareerOS should feel:

- Minimal
- Premium
- Calm
- Student-friendly
- Modern AI SaaS
- Highly usable
- Visually engaging without looking “vibe coded”
- Consistent across Student, College, and Recruiter interfaces

Use **Talenlio** as a visual/reference benchmark for the overall career-tech feel, strong visual hierarchy, coordinated-AI storytelling, clean CTA treatment, and motion-led engagement — but **do not copy its layout, branding, illustrations, or components directly**.

CareerOS must have its own recognizable design language.

---

# 2. Product Summary

## Product Name
**CareerOS**

## Product Category
AI-powered B2B2C Career Intelligence SaaS

## Core Idea
CareerOS is an AI-powered Career Operating System that connects:

- Students
- Colleges
- Recruiters

into one closed-loop career intelligence ecosystem.

## Core Student Promise
> Know where you are, where you want to go, what is missing, and what to do next.

## Core USP
CareerOS does not stop at student guidance.

It connects:

**Student Growth → College Placement Intelligence → Recruiter Hiring Intelligence → Industry Feedback → Better Student Guidance**

This creates a continuous employability loop.

---

# 3. Primary User Roles

## A. Student
Needs:
- Career clarity
- Skill-gap understanding
- Resume improvement
- Learning guidance
- Interview preparation
- Job/internship recommendations
- Progress visibility

## B. College / Placement Team
Needs:
- Placement readiness visibility
- Student monitoring
- Skill-gap insights
- Department analytics
- At-risk student identification
- Recruiter engagement visibility

## C. Recruiter
Needs:
- Fast talent discovery
- Candidate relevance
- Match scores
- Verified student profiles
- Shortlisting
- Hiring pipeline visibility
- Candidate intelligence

---

# 4. Design Philosophy

CareerOS should look like a **career intelligence product**, not:

- a school LMS
- a generic admin dashboard
- a crypto product
- a cyberpunk AI interface
- a dashboard filled with 20 charts
- a template marketplace UI

The user should understand every screen within **5–10 seconds**.

## Design Principles

### 1. One Main Goal Per Screen
Every page should have one dominant action or insight.

### 2. Progressive Disclosure
Show the important information first.
Secondary details should appear only when needed.

### 3. Low Cognitive Load
Avoid putting every score, chart, action, and feature above the fold.

### 4. Visual Hierarchy
Use:
- one large page title
- one supporting sentence
- 1–2 hero insights
- a few supporting cards
- clear CTA

### 5. Human AI
AI should feel supportive and intelligent, not robotic or overly futuristic.

### 6. Calm Motion
Animations should guide attention, not constantly move.

---

# 5. Talenlio-Inspired Reference Direction

Use Talenlio as inspiration for:

- Career-tech positioning
- Clean storytelling
- Strong primary CTA
- Agent-based feature presentation
- Easy-to-understand feature grouping
- Smooth section reveals
- Light, energetic SaaS feel
- Bold but controlled use of accent color
- Clear “AI works for you” messaging

CareerOS should extend this into a more complete product ecosystem for:
- Students
- Colleges
- Recruiters

Do not duplicate Talenlio's page structures, text, logos, or visual assets.

---

# 6. Global Visual Theme

## Overall Mood

**Bright AI Workspace**

Think:
- premium AI startup
- Apple-like whitespace
- modern SaaS
- soft glass surfaces
- subtle gradients
- light blue/cyan/purple accents
- clean cards
- soft shadows
- smooth animated feedback

Avoid dark full-screen backgrounds as the default.

---

# 7. Color System

Use a light-first palette.

## Core Backgrounds

- App Background: `#F7F9FC`
- Primary Surface: `#FFFFFF`
- Secondary Surface: `#F1F5F9`
- Elevated Surface: `rgba(255,255,255,0.82)`

## Brand Colors

- Primary Blue: `#4F7CFF`
- Bright Blue: `#5B8CFF`
- Soft Cyan: `#55C7F3`
- AI Violet: `#8B7CFF`
- Soft Indigo: `#6E72E8`

## Text Colors

- Primary Text: `#101828`
- Secondary Text: `#475467`
- Muted Text: `#667085`
- Disabled: `#98A2B3`

## Semantic Colors

- Success: `#22A06B`
- Warning: `#F59E0B`
- Error: `#E5484D`
- Info: `#3B82F6`

## Gradient Rules

Use gradients sparingly.

Recommended:
`#4F7CFF → #8B7CFF`

Alternative:
`#55C7F3 → #4F7CFF`

Use gradients for:
- Hero numbers
- AI active states
- Primary CTA emphasis
- Career Twin visuals
- Selected states
- Progress visualization

Do NOT apply gradients to every card.

---

# 8. Typography

Use one clean family throughout.

Recommended:
- **Inter**
- **Manrope**
- **SF Pro-like system font**

## Type Scale

### Display
48–56px / 600–700

### Page Title
30–36px / 600–700

### Section Title
20–24px / 600

### Card Title
15–18px / 600

### Body
14–16px / 400–500

### Caption
12–13px / 400–500

Avoid:
- oversized decorative typography
- too many weights
- all-caps headings everywhere

---

# 9. Spacing & Shape

## Grid
Use an 8px spacing system.

Common values:
- 8
- 12
- 16
- 24
- 32
- 48
- 64

## Border Radius
- Small Controls: 10–12px
- Inputs: 12px
- Cards: 16px
- Hero Cards: 20–24px
- Pills: Fully rounded

## Shadows
Very subtle.

Use:
- light blur
- low-opacity neutral shadow
- mild blue glow only for AI-active elements

Avoid:
- strong black shadows
- excessive glow
- floating every card

---

# 10. Animation & Interaction Language

Motion should feel **smooth, intelligent, and premium**.

## Page Load
- 180–300ms fade-up
- stagger major cards by 40–70ms
- no dramatic zooming

## Cards
Hover:
- translate Y by -2 to -4px
- very slight shadow increase
- border tint shifts toward blue

## Buttons
Hover:
- subtle scale: 1.01–1.02
- gradient shift or soft glow
- 150–200ms ease

Press:
- scale: 0.98

## AI Elements
Use:
- slow pulse around AI status
- subtle moving gradient
- soft orbit animation
- flowing connecting line
- tiny shimmer while generating

## Progress / Scores
Animate once when entering viewport:
- circular score fill
- progress bars
- readiness number count-up

## Charts
Animate:
- line draw
- bar rise
- node fade-in

Do NOT:
- animate everything simultaneously
- use constant bouncing icons
- use excessive particle backgrounds
- use distracting parallax inside dashboards
- animate essential text continuously

---

# 11. Application Shell

## Desktop Layout

### Left Sidebar
Minimal fixed sidebar.

Items:
- Dashboard
- Career Twin
- Mentor
- Resume
- Skills
- Interview
- Jobs

Role-dependent:
- College
- Recruiter
- Admin

Bottom:
- Help
- Settings
- Profile

Use icons + short labels.

Keep sidebar narrow and quiet.

## Top Bar

Include:
- Page context / breadcrumb
- Search when relevant
- AI status
- Notifications
- Profile avatar

Avoid duplicating sidebar navigation in top nav.

---

# 12. Student Experience

## Route: `/dashboard`

### Primary Goal
Show:
**What should I focus on today?**

### Above the Fold
1. Greeting
2. Career Readiness Score
3. Target Role
4. One AI Insight
5. One main CTA: `Continue My Plan`

### Supporting Cards
- Skill progress
- Upcoming goal
- Next interview
- Recommended opportunity
- Recent activity

Do not show more than 5 supporting cards initially.

### Suggested Hero
**Career Readiness: 78%**
"You're 3 priority skills away from AI Engineer readiness."

CTA:
`View Skill Gaps`

---

# 13. Career Twin

## Route: `/career-twin`

### Primary Goal
Visualize:
**Where am I heading?**

### Hero
Large Career Twin visualization.

Show:
- Target role
- Career readiness
- Goal alignment
- Placement probability

### Supporting
- Career trajectory
- Salary projection
- Missing capabilities
- Recommended next actions

Do not overload with too many predictive metrics.

### Core CTA
`Improve My Twin`

---

# 14. ARIA Mentor

## Route: `/mentor`

### Primary Goal
Make ARIA feel like a personal career mentor, not ChatGPT clone.

### Layout
Main chat area + compact context panel.

### Context Panel
Only show:
- Current target role
- Readiness
- Top priority goal
- Current roadmap stage

### Suggested Quick Actions
- What should I learn next?
- Review my progress
- Prepare me for an interview
- Improve my resume
- Find suitable roles

### Motion
- subtle typing indicator
- animated AI orb
- gentle response reveal

No heavy chat bubbles or excessive gradients.

---

# 15. Resume Intelligence

## Route: `/resume`

### Primary Goal
Answer:
**Is my resume helping or hurting me?**

### Empty State
Large upload zone.

### After Upload
Hero:
- ATS Score
- Overall Resume Quality
- Target Role Fit

Then:
- Strengths
- Missing keywords
- Skills detected
- Priority improvements

### CTA
`Improve Resume`

Keep suggestions grouped by:
- Critical
- Recommended
- Optional

---

# 16. Skill Gap Intelligence

## Route: `/skills`

### Primary Goal
Answer:
**What am I missing for my target role?**

### Hero
- Target Role
- Overall Readiness %
- Critical Skill Gaps count

### Main Visual
Current Skills vs Required Skills.

Prefer:
- radar chart
or
- comparative horizontal bars

### Priorities
Only show top 3–5 skill gaps.

Each:
- Skill
- Current level
- Required level
- Priority
- `Close Gap`

### AI Insight
One ARIA-generated recommendation.

### CTA
`Build My Learning Roadmap`

---

# 17. ECHO Interview

## Route: `/interview`

### Primary Goal
Create a focused interview experience.

### Start Screen
- Interview type
- Target role
- Difficulty
- Estimated duration
- Start CTA

### Live Interview
Keep interface distraction-free.

Show:
- ECHO avatar/orb
- current question
- timer
- microphone state
- voice waveform

Hide scores during active interview.

### Results
Show:
- Overall score
- Technical
- Communication
- Confidence
- Strongest area
- Improvement area
- Next action

---

# 18. Jobs

## Route: `/jobs`

### Primary Goal
Show a small number of highly relevant opportunities.

Avoid endless job-board density.

### Hero
`12 Strong Matches For You`

### Filters
Compact:
- Role
- Location
- Type
- Match %

### Job Card
Show only:
- Company
- Role
- Location
- Salary if available
- Match score
- 2–3 matching skills
- 1 missing requirement

CTA:
`View Match`

Secondary:
`Save`

### Detail Drawer
Open job detail in side panel instead of navigating away where possible.

---

# 19. College Dashboard

## Route: `/college`

### Primary Goal
Answer:
**How placement-ready are our students?**

### Above the Fold
4 metrics maximum:
- Placement Readiness
- Job-Ready Students
- At-Risk Students
- Active Recruiters

### Main Visual
Department-wise readiness / employability trend.

### Supporting
- Skill gap heatmap
- Students needing intervention
- Placement funnel
- Recruiter engagement

### Important
College UI should feel:
- analytical
- actionable
- professional

Not like student dashboard with labels changed.

### Primary CTA
`View Students Needing Action`

---

# 20. Recruiter Dashboard

## Route: `/recruiter`

### Primary Goal
Answer:
**Who should I talk to first?**

### Above the Fold
- Recommended candidates
- Active roles
- Candidate pipeline
- Average match score

### Hero Section
`Top Matches for [Role]`

Candidate cards show:
- Name
- Role fit
- Match %
- Core skills
- Readiness
- Availability

### Search
Natural-language search:
`Find Python + FastAPI students with GenAI projects`

### Supporting
- Talent pipeline
- shortlisted candidates
- skill distribution
- hiring analytics

### Primary CTA
`Discover Candidates`

---

# 21. Profile

## Route: `/profile`

Keep simple.

Sections:
- Personal Information
- Education
- Career Target
- Skills
- Resume
- Account / Security

Avoid analytics on this page.

---

# 22. Auth

## Route: `/auth`

Minimal split-screen or centered card.

Include:
- CareerOS identity
- one short value proposition
- Google sign-in
- email sign-in
- role selection where necessary

Avoid:
- too many illustrations
- testimonials
- excessive marketing on login

---

# 23. Design System Components

Create reusable Figma components for:

## Navigation
- Sidebar item
- Topbar item
- Breadcrumb
- User menu

## Buttons
- Primary
- Secondary
- Ghost
- Destructive
- Icon button

## Inputs
- Text
- Search
- Select
- Multi-select
- File upload
- Range / slider

## Cards
- Metric card
- Insight card
- Recommendation card
- Candidate card
- Job card
- AI card
- Chart container

## Feedback
- Toast
- Success
- Error
- Warning
- Empty state
- Loading skeleton

## AI Components
- AI orb
- AI status indicator
- Generating state
- Suggested action chip
- AI insight panel

---

# 24. Density Rules

## Dashboard
Maximum:
- 4 KPI cards
- 1 hero visual
- 2 supporting sections above fold

## Tables
Maximum 6–7 visible columns.
Move extra information into drawers.

## Cards
No more than 3–4 lines of content.

## Charts
Every chart must answer one question.

Do not add a chart because empty space exists.

---

# 25. Role Differentiation

Use one CareerOS design system, but slightly different emphasis.

## Student
More:
- guidance
- progress
- encouragement
- visual AI feedback

## College
More:
- analytics
- monitoring
- intervention
- cohort-level insights

## Recruiter
More:
- search
- ranking
- filtering
- pipeline
- candidate comparison

Do not create three unrelated products visually.

---

# 26. Core User Flows

## Student

Auth
→ Profile
→ Resume Upload
→ Resume Intelligence
→ Career Twin
→ Skill Gap
→ Roadmap
→ Mentor
→ Interview
→ Job Match
→ Apply
→ Progress Updates

## College

Auth
→ Overview
→ Placement Readiness
→ Department Insights
→ At-Risk Students
→ Student Detail
→ Recruiter Engagement
→ Reports

## Recruiter

Auth
→ Hiring Dashboard
→ Create / Select Role
→ Discover Candidates
→ Review Match
→ Shortlist
→ Pipeline
→ Hiring Outcome

---

# 27. Closed-Loop Ecosystem Visual

This must appear somewhere in the product and marketing design.

Student:
**Learn • Build • Practice**

↓ feeds readiness data

College:
**Monitor • Intervene • Improve**

↓ provides verified talent pool

Recruiter:
**Discover • Evaluate • Hire**

↓ provides industry demand and hiring outcomes

CareerOS AI:
**Learns from all interactions**

↓ improves

Student recommendations, college insights, recruiter matching

---

# 28. Figma Prototype Interactions

Prototype at least these flows:

## Student
1. Login
2. Dashboard
3. Upload Resume
4. View Resume Score
5. Open Career Twin
6. Open Skill Gap
7. Generate Roadmap
8. Start Interview
9. View Jobs

## College
1. College Dashboard
2. Open At-Risk Students
3. View Student Detail
4. View Department Analytics

## Recruiter
1. Recruiter Dashboard
2. Search Candidates
3. Open Candidate
4. Shortlist
5. View Pipeline

---

# 29. Figma File Structure

Use pages:

1. `00 — Foundations`
2. `01 — Components`
3. `02 — Student`
4. `03 — College`
5. `04 — Recruiter`
6. `05 — Auth`
7. `06 — Prototype Flows`
8. `07 — Archive`

Inside Foundations:
- Colors
- Typography
- Spacing
- Radius
- Shadows
- Motion notes
- Grid

---

# 30. Responsive Rules

## Desktop
Primary design target: 1440px.

Content max-width:
1200–1320px.

## Tablet
Collapse sidebar to icon rail.

## Mobile
Bottom navigation for student interface.

College and recruiter dashboards can remain optimized primarily for tablet/desktop.

Do not force complex analytics into tiny mobile cards.

---

# 31. Accessibility

Maintain:
- WCAG-friendly contrast
- 44px minimum touch targets
- visible keyboard focus
- semantic color + labels
- no information conveyed by color alone
- readable chart labels
- reduced motion support

---

# 32. DO / DON'T

## DO

- Use whitespace confidently
- Use concise copy
- Keep cards purposeful
- Use one dominant CTA
- Use gradients only for emphasis
- Animate meaningful state changes
- Keep AI presence subtle but recognizable
- Use realistic sample data
- Maintain consistent hierarchy

## DON'T

- Fill every empty area
- Add glass effects everywhere
- Use neon on every component
- Put 10 metrics on one page
- Use giant illustrations inside application screens
- Show irrelevant charts
- Create excessive floating effects
- Make the product look like a gaming dashboard
- Copy Talenlio directly

---

# 33. Sample UI Copy Tone

CareerOS should sound:
- intelligent
- supportive
- concise
- action-oriented

Good:
> "You're 3 skills away from AI Engineer readiness."

Good:
> "Kubernetes is your highest-impact skill gap."

Good:
> "8 roles strongly match your current profile."

Avoid:
> "Congratulations! Our amazing AI has analyzed your profile and generated some awesome suggestions!"

Keep product copy calm and confident.

---

# 34. Figma Master Generation Prompt

Use the following prompt when generating the application design:

---

Design a complete responsive frontend for **CareerOS**, an AI-powered Career Operating System connecting Students, Colleges, and Recruiters.

The product should be designed as a **minimal, premium, light-theme AI SaaS application**, taking high-level inspiration from the clean career-tech presentation, visual hierarchy, CTA clarity, and motion-led experience of Talenlio, while creating a completely original CareerOS visual identity.

Do not overload screens.

Every page should communicate one primary goal and use progressive disclosure for secondary information.

Use:
- soft off-white backgrounds
- clean white surfaces
- blue / cyan / violet accents
- subtle gradient emphasis
- restrained glassmorphism
- rounded 16–24px cards
- modern sans-serif typography
- generous whitespace
- premium outlined icons
- subtle AI visual cues

Motion should include:
- fade-up page entrances
- soft staggered card reveals
- subtle hover elevation
- progress animations
- flowing AI connection lines
- gentle AI pulse indicators
- smooth 180–300ms transitions

Avoid:
- dark cyberpunk styling
- excessive neon
- overfilled dashboards
- generic admin templates
- distracting particle effects
- unnecessary charts
- constant animation

Create three visually related but purpose-specific experiences:

### Student
Guidance-first.
Career readiness, Career Twin, ARIA Mentor, Resume Intelligence, Skill Gap, Learning Roadmap, ECHO Interview, Jobs.

### College
Analytics-first.
Placement readiness, student monitoring, skill gaps, department performance, at-risk students, recruiter engagement.

### Recruiter
Discovery-first.
Candidate search, AI match scores, talent ranking, shortlisting, pipelines, hiring analytics.

Primary routes:
- /
- /auth
- /dashboard
- /career-twin
- /mentor
- /resume
- /skills
- /interview
- /jobs
- /profile
- /college
- /recruiter
- /admin

Use a consistent CareerOS sidebar, top bar, card system, buttons, typography, spacing, and AI interaction components.

The student dashboard should answer:
"What should I focus on today?"

The Career Twin should answer:
"Where am I heading?"

The Skill Gap page should answer:
"What am I missing?"

The Resume page should answer:
"Is my resume helping me?"

The Interview page should answer:
"How interview-ready am I?"

The Jobs page should answer:
"Which opportunities fit me best?"

The College dashboard should answer:
"How placement-ready are our students?"

The Recruiter dashboard should answer:
"Who should I speak to first?"

The final product must feel polished enough for a funded AI SaaS startup while remaining friendly and understandable for university students.

---

# 35. Final Design Success Criteria

The frontend is successful when:

- A new student understands the dashboard in under 10 seconds.
- No screen feels visually crowded.
- Student, College, and Recruiter products feel connected.
- Each screen has one obvious next action.
- AI feels integrated rather than added as a chatbot.
- CareerOS looks original.
- Motion improves understanding rather than creating distraction.
- The interface feels production-ready, not like a hackathon mockup.

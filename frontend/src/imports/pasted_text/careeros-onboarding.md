You are refining the CareerOS role-based onboarding and profile creation flow.

GOAL:
When a user selects a role — Student, College, Recruiter, or Admin — they should complete a short guided questionnaire that automatically builds their structured CareerOS profile.

The onboarding should feel:
- minimal
- purposeful
- personalized
- fast
- visually polished
- clearly useful

Do not treat onboarding as data collection only.

The user should feel that CareerOS is already becoming intelligent during onboarding.

==================================================
CORE FLOW
==================================================

Role Selection
→ Role Authentication
→ Guided Role-Specific Questionnaire
→ Profile Auto-Creation
→ Personalized CareerOS Summary
→ Review & Confirm
→ Role Dashboard

If onboarding is incomplete:
resume from the last completed step.

If onboarding is complete:
send the user directly to the correct dashboard on future logins.

==================================================
GLOBAL ONBOARDING EXPERIENCE
==================================================

Use:
- one topic per step
- visible progress indicator
- Back button
- Continue button
- autosave
- optional Skip only where appropriate
- inline validation
- concise helper text
- searchable selects
- chips for multi-select questions
- conditional questions
- review screen

Do NOT:
- use one long form
- ask unnecessary questions
- repeat known account information
- make every field mandatory
- lose answers when going backward

==================================================
STUDENT ONBOARDING
==================================================

Route:
/onboarding/student

Use 6 steps.

--------------------------------
STEP 1 — ABOUT YOU
--------------------------------

Heading:
"Let's build your CareerOS profile"

Ask:
- Full Name
- College / University
- Degree
- Branch / Specialization
- Current Semester / Year
- Graduation Year
- City / Location

Pre-fill Full Name and Email where already known.

--------------------------------
STEP 2 — CAREER DIRECTION
--------------------------------

Heading:
"Where do you want to go?"

Ask:
- Target Role
- Preferred Industry
- Preferred Work Type
- Preferred Location
- Target Salary Range
- Career Timeline

Work Type:
- Internship
- Full-Time
- Freelance
- Exploring

Include:
"I'm not sure yet"

If selected:
ask:
- Interests
- Favorite Subjects
- Preferred Work Style

CareerOS should later use these to recommend possible career paths.

--------------------------------
STEP 3 — SKILLS
--------------------------------

Heading:
"What do you already know?"

Categories:
- Programming
- AI / ML
- Web
- Cloud
- Databases
- Tools
- Soft Skills

Allow:
- skill selection
- custom skills
- proficiency level

Levels:
Beginner
Intermediate
Advanced

Keep the interaction quick.

--------------------------------
STEP 4 — EXPERIENCE
--------------------------------

Heading:
"What have you already built?"

Ask for:
- Projects
- Internships
- Certifications
- Hackathons
- Research
- Open Source
- Work Experience

Allow multiple entries.

This step should be optional.

--------------------------------
STEP 5 — RESUME
--------------------------------

Heading:
"Let CareerOS understand you better"

Allow:
PDF Resume Upload

Resume upload must remain optional.

If uploaded:
- extract skills
- detect experience
- identify projects
- identify education
- suggest missing profile information

IMPORTANT:
Never silently overwrite manually entered values.

Show:
"We found these details in your resume"

Then allow:
Add to Profile
Ignore

--------------------------------
STEP 6 — PREFERENCES
--------------------------------

Heading:
"How should CareerOS guide you?"

Ask:
- Main Goal
- Weekly Learning Hours
- Preferred Learning Pace
- Mentor Guidance Frequency
- Notification Preference

Main Goal:
- Get an Internship
- Get Placed
- Improve Resume
- Prepare for Interviews
- Build Skills
- Explore Careers

==================================================
STUDENT PROFILE OUTPUT
==================================================

Automatically create:

Personal Information
Academic Information
Career Goal
Skills
Projects
Experience
Certifications
Resume
Learning Preferences
Placement Preferences

Do not store the questionnaire as one raw blob.

Map all answers into structured profile fields.

==================================================
STUDENT PERSONALIZED RESULT
==================================================

After the final onboarding step, do NOT immediately redirect to the dashboard.

Show a short personalized result screen.

Heading:
"Your CareerOS is Ready"

Show 4–5 concise generated insights.

Example:

Target Career
AI Engineer

Skills Detected
8

Priority Skill Gaps
3

Career Readiness Baseline
72%

Recommended First Step
Build your AI Engineer roadmap

If Resume was uploaded:
Resume ATS Baseline
78%

Then show:

"CareerOS has created your initial career profile using your goals, skills, experience, and preferences."

Primary CTA:
Enter My Dashboard

Secondary CTA:
Review My Profile

This should be one of the most satisfying moments in onboarding.

Use a short profile-generation transition before showing this result.

Generation sequence:

"Building your CareerOS profile..."
↓
"Understanding your goals"
↓
"Mapping your skills"
↓
"Identifying priorities"
↓
"Preparing your dashboard"

Keep the full transition brief.

==================================================
COLLEGE ONBOARDING
==================================================

Route:
/onboarding/college

Use 5 steps.

--------------------------------
STEP 1 — INSTITUTION
--------------------------------

Ask:
- Institution Name
- Institution Type
- University Affiliation
- Official Email
- Website
- City
- State

--------------------------------
STEP 2 — PLACEMENT TEAM
--------------------------------

Ask:
- Placement Officer Name
- Designation
- Official Contact Email
- Phone
- Number of Coordinators

--------------------------------
STEP 3 — STUDENT STRUCTURE
--------------------------------

Ask:
- Total Students
- Eligible Students
- Departments
- Graduation Batches

For each department:
- Department Name
- Student Count
- Graduation Year

--------------------------------
STEP 4 — PLACEMENT CONTEXT
--------------------------------

Ask:
- Placement Rate
- Average Package
- Highest Package
- Active Recruiters
- Placement Season
- Main Placement Challenges

Challenges:
- Skill Gaps
- Interview Readiness
- Student Tracking
- Recruiter Engagement
- Placement Reporting

--------------------------------
STEP 5 — GOALS
--------------------------------

Ask:
"What should CareerOS help improve?"

Options:
- Placement Readiness
- Employability Monitoring
- Skill Gap Tracking
- Department Performance
- At-Risk Student Detection
- Recruiter Engagement

==================================================
COLLEGE PROFILE OUTPUT
==================================================

Create:
Institution Profile
Placement Team
Departments
Student Strength
Placement Metrics
Recruiter Context
Institution Goals

==================================================
COLLEGE PERSONALIZED RESULT
==================================================

Show:

"Your College Intelligence Workspace is Ready"

Example metrics:

Departments Configured
6

Eligible Students
1,240

Primary Goal
Improve Placement Readiness

Priority Focus
Skill Gap Monitoring

Dashboard Mode
Placement Intelligence

Primary CTA:
Open College Dashboard

Secondary:
Review Institution Profile

==================================================
RECRUITER ONBOARDING
==================================================

Route:
/onboarding/recruiter

Use 5 steps.

--------------------------------
STEP 1 — ABOUT YOU
--------------------------------

Ask:
- Full Name
- Job Title
- Work Email
- Phone
- LinkedIn URL optional

--------------------------------
STEP 2 — COMPANY
--------------------------------

Ask:
- Company Name
- Industry
- Company Size
- Website
- Headquarters
- Hiring Locations

--------------------------------
STEP 3 — HIRING NEEDS
--------------------------------

Ask:
"What roles are you hiring for?"

For each:
- Role
- Employment Type
- Experience Level
- Location
- Salary Range

Allow multiple roles.

Include:
"Not hiring right now"

If selected:
skip detailed role setup and allow Talent Exploration.

--------------------------------
STEP 4 — CANDIDATE REQUIREMENTS
--------------------------------

Ask:
- Must-Have Skills
- Good-to-Have Skills
- Graduation Year
- Degree Preference
- Minimum Readiness Score
- Location Preference
- Availability

--------------------------------
STEP 5 — HIRING PREFERENCES
--------------------------------

Ask:
- Monthly Hiring Volume
- Campus Hiring Interest
- Preferred Colleges
- Internship Hiring
- Candidate Discovery Preference

==================================================
RECRUITER PROFILE OUTPUT
==================================================

Create:
Recruiter Information
Company Profile
Hiring Roles
Required Skills
Candidate Preferences
Hiring Preferences

==================================================
RECRUITER PERSONALIZED RESULT
==================================================

Show:

"Your Talent Intelligence Workspace is Ready"

Example:

Active Hiring Roles
3

Priority Role
AI Engineer

Must-Have Skills
Python • ML • FastAPI

Minimum Match Score
80%

Talent Search
Configured

Primary CTA:
Discover Candidates

Secondary:
Review Recruiter Profile

==================================================
ADMIN ONBOARDING
==================================================

Admin accounts are internally provisioned.

Route:
/onboarding/admin

Keep onboarding minimal.

Ask:
- Full Name
- Department
- Admin Role
- Contact Number optional
- Notification Preferences

Result:

"Admin Workspace Ready"

CTA:
Enter Admin Console

Do not create public admin signup.

==================================================
PROFILE REVIEW
==================================================

Before final confirmation, allow users to review the profile.

Do not force them to move backward through all onboarding steps.

Use grouped editable sections.

Student:
- Personal
- Education
- Career
- Skills
- Experience
- Preferences

College:
- Institution
- Placement
- Departments
- Goals

Recruiter:
- Personal
- Company
- Hiring
- Candidate Preferences

Allow:
Edit
Save
Cancel

==================================================
PROFILE PAGE AFTER ONBOARDING
==================================================

All onboarding information must remain editable later.

Student Profile:
/profile

College:
/college/settings/profile

Recruiter:
/recruiter/settings/profile

Admin:
/admin/settings/profile

Changes should update the stored profile immediately after Save.

Show:
"Changes saved"

==================================================
PROFILE CHANGES MUST AFFECT CAREEROS
==================================================

Profile must NOT be a static account page.

Student changes Target Role
→ Update Skill Gap
→ Update Career Twin
→ Update Roadmap
→ Refresh Job Matches

Student updates Resume
→ Re-run Resume Intelligence
→ Update Skills
→ Recalculate Readiness

Student adds Certification
→ Update Skills / Readiness

College updates Department Data
→ Refresh Department Analytics

College updates Placement Metrics
→ Refresh Readiness Dashboard

Recruiter updates Hiring Role
→ Refresh Candidate Recommendations

Recruiter updates Required Skills
→ Recalculate Match Rankings

==================================================
QUESTION UX RULES
==================================================

DO:
✓ Show only relevant questions
✓ Keep steps short
✓ Auto-save progress
✓ Pre-fill known information
✓ Use conditional branching
✓ Make optional fields obvious
✓ Allow Skip for non-critical steps
✓ Show meaningful helper text
✓ Let users edit before finishing
✓ Use profile answers immediately

DON'T:
✗ Ask questions only for data collection
✗ Ask role-irrelevant questions
✗ Force optional information
✗ Ask resume information manually if extracted
✗ overwrite manual data silently
✗ put more than one major topic on a screen
✗ hide onboarding progress
✗ restart incomplete onboarding
✗ drop users into an empty dashboard after completion

==================================================
ANIMATIONS
==================================================

Use restrained, meaningful motion.

Step Transition:
200–300ms fade + horizontal slide

Option Selection:
subtle border/color transition

Progress:
smooth progress bar fill

Resume Analysis:
short shimmer / scanning state

Profile Creation:
soft animated CareerOS AI indicator

Success:
simple checkmark + gentle scale

Do NOT:
- use long AI loading sequences
- use confetti
- bounce cards
- use neon animations
- delay access unnecessarily

==================================================
LIGHT MODE
==================================================

Do not use dark cards in light mode.

Use:
- off-white background
- white cards
- light borders
- blue/violet selection states
- soft neutral surfaces

==================================================
DARK MODE
==================================================

Use:
- charcoal layered surfaces
- restrained accent colors
- subtle borders
- off-white typography

No cyberpunk styling.

==================================================
SUCCESS CRITERIA
==================================================

The onboarding is complete when:

1. Every role has a specific questionnaire.
2. Questions are concise and relevant.
3. Progress is auto-saved.
4. Answers create structured profiles.
5. Users review the profile before confirmation.
6. Users receive a personalized result after onboarding.
7. The result demonstrates immediate CareerOS value.
8. Users can edit profile information later.
9. Profile updates influence related product features.
10. Completed onboarding leads to a personalized, non-empty dashboard.
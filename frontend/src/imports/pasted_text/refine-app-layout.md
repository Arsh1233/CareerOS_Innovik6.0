Refine the existing CareerOS authenticated application layout.

GOAL:
Remove PROFILE, HELP, and EXIT from the left sidebar and move these actions into a single profile/avatar control in the TOP-RIGHT of every authenticated page.

This should apply consistently to:

- Student
- College
- Recruiter
- Admin

Do NOT redesign the entire application.
Preserve the current sidebar style, theme system, spacing, navigation, and approved UI.

==================================================
1. SIDEBAR CLEANUP
==================================================

Remove these items from the sidebar:

PROFILE
HELP
EXIT

The sidebar should now contain ONLY primary product navigation.

For Student, keep:

HOME
TWIN
MENTOR
RESUME
SKILLS
ROADMAP
ECHO
JOBS
PROGRESS

Do not add Profile/Help/Logout back into the sidebar.

Apply the same principle to College and Recruiter:
sidebar = product navigation only.

==================================================
2. TOP-RIGHT PROFILE CONTROL
==================================================

Add a user profile/avatar button in the top-right of every authenticated page.

Place it inside the global topbar.

Desktop layout example:

Page Title / Breadcrumbs                         Notifications   Profile Avatar

The avatar can show:

- user photo if available
- otherwise initials
- otherwise a clean user icon

Example:

AC

for Arsh Chakraborty.

Avatar size:
36–42px

Use:
rounded-full

Add a subtle border or soft surface background.

Do NOT make it oversized.

==================================================
3. PROFILE MENU INTERACTION
==================================================

When the user clicks the profile avatar:

Open a compact dropdown/popover directly below the avatar.

Do NOT open a full page immediately.

The menu should feel like a premium SaaS account menu.

Recommended width:

260–300px

Position:

top-right aligned with avatar.

Use:
subtle fade + scale animation

Duration:
150–220ms

==================================================
4. PROFILE MENU STRUCTURE
==================================================

At the top of the popup show:

Avatar

User Name
User Email

Role badge

Example:

Arsh Chakraborty
arsh@email.com

STUDENT

Use a small role badge.

Then use a divider.

==================================================
5. PRIMARY MENU OPTIONS
==================================================

Include:

MY PROFILE

Icon:
User

Description optional:
View and edit your profile

Student:
→ /profile

College:
→ /college/settings/profile

Recruiter:
→ /recruiter/settings/profile

Admin:
→ /admin/settings/profile


ACCOUNT SETTINGS

Icon:
Settings

Open:
Account / preferences settings

Possible destination:

Student:
→ /profile/settings

College:
→ /college/settings

Recruiter:
→ /recruiter/settings

Admin:
→ /admin/settings


BILLING & PLAN

Icon:
Credit Card

Only show for roles that have subscriptions:

Student
College
Recruiter

Routes:

Student:
→ /profile/billing

College:
→ /college/settings/billing

Recruiter:
→ /recruiter/settings/billing

Do NOT show Billing for Admin.

==================================================
6. APPEARANCE
==================================================

Include:

APPEARANCE

Icon:
Sun / Moon / Monitor

Instead of forcing navigation, allow an inline submenu.

Options:

Light
Dark
System

Show currently selected option.

Example:

Appearance                >
System

On click:
open small nested menu:

☀ Light
☾ Dark
▣ System

Keep this consistent with the existing CareerOS theme system.

==================================================
7. HELP SECTION
==================================================

Add:

HELP & SUPPORT

Icon:
Circle Help

On click:

Either navigate to:

/help

OR open a small help center modal/panel.

Recommended help content:

- Getting Started
- Feature Guide
- FAQs
- Contact Support
- Report a Problem

Do not overload the profile popup itself.

The main dropdown should just show:

Help & Support

==================================================
8. OPTIONAL FEEDBACK ACTION
==================================================

Add:

SEND FEEDBACK

Icon:
MessageSquare / MessageCircle

On click:
open a small modal.

Fields:

Feedback Type

- Suggestion
- Bug
- UI Issue
- Other

Message

CTA:
Send Feedback

This is optional but recommended.

==================================================
9. DIVIDER
==================================================

Add a divider before account/session actions.

==================================================
10. SIGN OUT
==================================================

Final menu item:

SIGN OUT

Icon:
LogOut

Use a restrained danger color.

Do NOT make the entire item bright red by default.

Default:

neutral text
red icon or subtle red tint

Hover:

soft red background
red text

On click:

show confirmation:

"Sign out of CareerOS?"

Text:

"You'll need to sign in again to access your workspace."

Buttons:

Cancel

Sign Out

After confirmation:

- clear auth/session state
- redirect to landing/login

Do NOT immediately log out on accidental click.

==================================================
11. OPTIONAL ACCOUNT STATUS
==================================================

For premium users, optionally show a compact plan status near the top:

CareerOS Pro
Active

or:

Free Plan
Upgrade

Student Free users can see:

Upgrade to Pro

CTA:
→ /subscription?plan=student-pro

Keep it subtle.

Do not turn profile popup into a pricing card.

==================================================
12. ROLE-SPECIFIC PROFILE MENU
==================================================

STUDENT

Show:

My Profile
Account Settings
Billing & Plan
Appearance
Help & Support
Send Feedback
Sign Out


COLLEGE

Show:

Institution Profile
College Settings
Billing & Plan
Appearance
Help & Support
Send Feedback
Sign Out


RECRUITER

Show:

My Profile
Company Settings
Billing & Plan
Appearance
Help & Support
Send Feedback
Sign Out


ADMIN

Show:

Admin Profile
Admin Settings
Appearance
Help & Support
Sign Out

Do NOT show subscription/billing for Admin.

==================================================
13. HOVER EFFECTS
==================================================

Avatar:

On hover:
- slightly brighten border
- subtle scale 1.03
- soft background transition

Duration:
150–200ms

Dropdown items:

On hover:
- soft background
- icon translates right 1–2px
- text becomes slightly stronger

No aggressive movement.

Do NOT use:
- bouncing
- glowing
- large 3D tilt
- flashy gradients

==================================================
14. OPEN/CLOSE ANIMATION
==================================================

Profile popup:

Initial:

opacity: 0
scale: 0.97
translateY: -4px

Open:

opacity: 1
scale: 1
translateY: 0

Duration:
160–220ms

Use ease-out.

Closing:
slightly faster.

==================================================
15. INTERACTION RULES
==================================================

Popup should close when:

- clicking outside
- pressing Escape
- selecting a navigation item

Popup should remain open when:
- interacting with nested Appearance selector

Only one popover should be open at a time.

==================================================
16. RESPONSIVE BEHAVIOR
==================================================

Desktop:

Use dropdown anchored under avatar.

Tablet:

Same behavior if space allows.

Mobile:

Use bottom sheet instead of a tiny dropdown.

Mobile sheet should show:

Profile
Settings
Billing
Appearance
Help
Feedback
Sign Out

Keep touch targets at least 44px.

==================================================
17. NOTIFICATIONS
==================================================

Optional but recommended:

Place a notification bell immediately before the profile avatar.

Layout:

Bell   Avatar

Bell click:
opens notifications popover.

Do NOT mix notifications into profile menu unless necessary.

==================================================
18. LIGHT MODE
==================================================

CRITICAL:

Profile dropdown must remain light in Light Mode.

Use:

white surface
light neutral border
soft shadow
dark text
light hover surfaces

Do NOT use:

black popup
dark navy profile menu
charcoal cards
dark floating panels

==================================================
19. DARK MODE
==================================================

Use:

neutral charcoal surface
subtle border
off-white text
muted secondary text

Do NOT use:
neon outlines
purple glow
cyberpunk styling

==================================================
20. ACCESSIBILITY
==================================================

The profile trigger must have:

aria-label="Open profile menu"

Support:

Tab navigation
Enter
Space
Escape
Arrow navigation where appropriate

Focus should move into the menu when opened.

Focus should return to avatar after closing.

==================================================
21. DO'S
==================================================

DO:

✓ Remove Profile from sidebar.
✓ Remove Help from sidebar.
✓ Remove Exit from sidebar.
✓ Keep product navigation cleaner.
✓ Put account actions in top-right profile menu.
✓ Show user identity at top of popup.
✓ Show role clearly.
✓ Include profile editing.
✓ Include settings.
✓ Include appearance.
✓ Include help.
✓ Include billing where relevant.
✓ Include sign out.
✓ Add confirmation before sign out.
✓ Support Light/Dark/System.
✓ Use a mobile bottom sheet.
✓ Add subtle premium hover effects.
✓ Keep menu compact.

==================================================
22. DON'TS
==================================================

DON'T:

✗ Keep duplicate Profile links in sidebar and topbar.
✗ Keep Help in main navigation.
✗ Keep Exit as a large sidebar button.
✗ Make logout easy to click accidentally.
✗ Show Billing to Admin.
✗ Use dark popup cards in light mode.
✗ Make profile menu huge.
✗ Put all settings directly inside the dropdown.
✗ Add excessive animation.
✗ Add neon glow.
✗ Hide the user's role.
✗ redesign unrelated pages.

==================================================
23. SUCCESS CRITERIA
==================================================

This change is complete when:

1. PROFILE is removed from sidebar.
2. HELP is removed from sidebar.
3. EXIT is removed from sidebar.
4. A profile/avatar button exists top-right.
5. Clicking it opens a polished popup.
6. User identity and role are visible.
7. Profile navigation works.
8. Settings navigation works.
9. Billing works for Student/College/Recruiter.
10. Appearance can change Light/Dark/System.
11. Help is accessible.
12. Logout requires confirmation.
13. Popup works on desktop/tablet/mobile.
14. Light mode popup remains light.
15. Existing role navigation remains unchanged.
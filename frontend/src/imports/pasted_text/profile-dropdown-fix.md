Fix the CareerOS top-right profile dropdown.

CURRENT PROBLEM:
The profile dropdown is rendering incorrectly.

An ARIA Insight card is appearing inside / overlapping the profile popup, making the dropdown extremely large and covering the account actions.

This is WRONG.

The profile menu must be a SMALL, SELF-CONTAINED ACCOUNT POPOVER.

ARIA Insight is dashboard content and must NEVER render inside the profile dropdown.

Do not redesign the page.
Fix only the popup architecture, layering, sizing, and content.

==================================================
1. PROFILE DROPDOWN CONTENT
==================================================

The profile dropdown may contain ONLY:

HEADER:
- Avatar
- User name
- User email
- Role badge

MENU:
- My Profile
- Account Settings
- Billing & Plan
- Appearance
- Help & Support
- Send Feedback
- Sign Out

Do NOT render inside this dropdown:

- ARIA Insight
- AI recommendations
- Skill gap cards
- Dashboard widgets
- Roadmap suggestions
- Charts
- Career Twin information
- Notifications feed
- Recommended courses

ARIA Insight must remain part of the relevant dashboard/page.

==================================================
2. DROPDOWN SIZE
==================================================

Desktop profile popup:

width: 280px
min-width: 260px
max-width: 300px

height:
auto

max-height:
min(520px, calc(100vh - 80px))

If content exceeds available height:
overflow-y: auto

Do NOT allow child components to determine a huge dropdown width or height.

Do NOT use:
width: 100%
width: 100vw
large dashboard-card sizing

==================================================
3. PROFILE POPUP POSITION
==================================================

Anchor the menu directly below the profile avatar.

Placement:

bottom-end relative to avatar

Suggested gap:
8–10px

It should align to the right edge of the avatar.

Example:

                      [Bell] [Avatar]
                              ┌───────────────┐
                              │ User          │
                              │ email         │
                              ├───────────────┤
                              │ My Profile    │
                              │ Settings      │
                              │ Billing       │
                              │ Appearance    │
                              │ Help          │
                              ├───────────────┤
                              │ Sign Out      │
                              └───────────────┘

It must NOT expand toward the middle of the page.

==================================================
4. USE A REAL POPOVER / DROPDOWN
==================================================

If using ShadCN:

Prefer:

DropdownMenu

or:

Popover

Render the floating content through the component portal.

Example architecture:

ProfileMenuTrigger
    ↓
DropdownMenuPortal
    ↓
DropdownMenuContent

Do NOT render the menu as a normal child inside the dashboard layout.

This prevents:

- layout shifting
- parent overflow clipping
- dashboard widgets entering the popup
- stacking context problems

==================================================
5. Z-INDEX ARCHITECTURE
==================================================

Create predictable layering.

Suggested hierarchy:

Page content:
z-0

Sticky sidebar/topbar:
z-30

Dropdown/popover:
z-50

Modal backdrop:
z-60

Modal:
z-70

Tooltip:
z-80

Do NOT arbitrarily use:

z-[99999]

Fix the component hierarchy instead.

ARIA Insight should stay inside normal page content.

It should not compete with the profile menu's stacking context.

==================================================
6. ARIA INSIGHT FIX
==================================================

Locate where ARIA Insight is currently mounted.

It should exist only inside the intended page section, for example:

Dashboard
→ AI Insight area

or:

ARIA-specific content section

It must not be imported/rendered by:

ProfileMenu
AccountPopover
UserMenu
TopbarProfileDropdown

If ProfileMenu is receiving arbitrary children:

REMOVE that pattern.

Wrong:

<ProfileMenu>
    {children}
</ProfileMenu>

if `children` can include dashboard content.

Prefer:

<ProfileMenu user={user} />

The profile component should own its exact menu contents.

==================================================
7. POPUP VISUAL STYLE
==================================================

LIGHT MODE:

background:
white

border:
subtle neutral border

shadow:
soft professional floating shadow

text:
dark neutral

hover:
soft blue-grey / neutral background

NO dark popup in light mode.

DARK MODE:

neutral charcoal surface
subtle border
off-white text
restrained hover surface

No neon glow.

==================================================
8. PROFILE HEADER
==================================================

Keep header compact.

Example:

[ F ]   fgh
        fgh@dfb
        STUDENT

Padding:
14–16px

Do not make avatar excessively large.

Avatar:
40–44px

Then divider.

==================================================
9. MENU ITEM DESIGN
==================================================

Each menu item:

height:
40–44px

Structure:

[Icon] Label

Optional right-side content:

keyboard shortcut
chevron
current theme

Example:

👤  My Profile
⚙️  Account Settings
💳  Billing & Plan
◐   Appearance        >
?   Help & Support
✉   Send Feedback

--------------------

↪   Sign Out

Keep menu simple.

==================================================
10. SIGN OUT
==================================================

Sign Out must remain the LAST item.

Use:

neutral styling by default

On hover:
very soft red surface
red icon/text

Do NOT make the entire dropdown's bottom section excessively tall.

==================================================
11. APPEARANCE SUBMENU
==================================================

Appearance should NOT expand the primary popup into a giant card.

Use a submenu:

Appearance >
    Light
    Dark
    System

Or a compact nested popover.

Do not render full theme settings inside the main dropdown.

==================================================
12. HELP
==================================================

Help & Support should navigate to /help or open a separate help modal.

Do NOT inject help content into the profile dropdown.

==================================================
13. ARIA ACTIVE TOPBAR BADGE
==================================================

Keep the existing:

ARIA Active

badge separate from the profile avatar.

It must not share the profile dropdown container.

If clicked, it may open an ARIA-specific interaction separately.

Do not merge ARIA Active with Profile.

==================================================
14. CLICK BEHAVIOR
==================================================

Click avatar:
open menu.

Click avatar again:
close menu.

Click outside:
close menu.

Escape:
close menu.

Select navigation option:
close menu.

Only one topbar popup should be open at a time.

==================================================
15. ANIMATION
==================================================

Use:

initial:
opacity 0
scale 0.97
translateY(-4px)

open:
opacity 1
scale 1
translateY(0)

duration:
160–200ms

No giant expand animation.

No profile popup morphing into a dashboard card.

==================================================
16. RESPONSIVE
==================================================

Desktop:
compact dropdown below avatar.

Tablet:
same dropdown if enough space.

Mobile:
bottom sheet.

Do not use desktop-size floating card centered over mobile UI.

==================================================
17. DO'S
==================================================

DO:

✓ Make profile menu compact.
✓ Render through a portal.
✓ Give it its own stacking layer.
✓ Keep ARIA Insight outside.
✓ Limit width to about 280px.
✓ Keep account options concise.
✓ Keep Sign Out at bottom.
✓ Close menu on outside click.
✓ Preserve Light/Dark/System.
✓ Keep ARIA Active separate.
✓ Fix component boundaries.

==================================================
18. DON'TS
==================================================

DON'T:

✗ Render ARIA Insight inside profile menu.
✗ Render dashboard children inside UserMenu.
✗ Allow popup width to inherit dashboard width.
✗ Use giant profile cards.
✗ Put charts or recommendations inside popup.
✗ Mix notifications with profile unless intentionally designed.
✗ use arbitrary massive z-index values.
✗ use dark card styling in light mode.
✗ redesign the whole topbar.
✗ remove the existing ARIA Active badge.
✗ allow popup content to push page layout.

==================================================
19. EXPECTED FINAL RESULT
==================================================

When user clicks the top-right avatar:

a small account menu should open directly below it.

The popup should contain only account-related actions.

The ARIA Insight card must remain in the dashboard content behind/outside the popup.

The final result should resemble a polished SaaS profile dropdown, not a floating dashboard panel.

After fixing, verify:

1. Profile popup width <= 300px.
2. No ARIA card appears inside it.
3. No page layout shift occurs.
4. Outside click closes popup.
5. Light mode popup is white/light.
6. Dark mode popup uses neutral dark surface.
7. Sign Out remains visible.
8. Dropdown remains anchored to avatar.
9. Dashboard widgets remain completely independent from popup.
10. No console/layout errors are introduced.
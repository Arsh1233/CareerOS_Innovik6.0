# Supabase

PostgreSQL (Supabase) is the **source of truth**. Qdrant holds only derived
search state.

```
supabase/
  migrations/   # numbered SQL migrations, applied in filename order
  policies/     # (later) standalone policy documentation/reviews
```

## Applying migrations

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Or paste a migration file into the Supabase SQL editor.

## Migrations

| File | Contents |
|---|---|
| `migrations/20260915000001_core_identity.sql` | `profiles`, `colleges`, `recruiter_organizations`, `role_requirements`, `organization_memberships`, `student_college_memberships`; `updated_at` triggers; `handle_new_user` provisioning trigger; tenant helper functions; RLS policies and grants. |

## Design notes

* `auth.users` remains the identity source. `profiles.user_id` references it
  `on delete cascade`, and `handle_new_user` creates exactly one profile row per
  user so every authenticated user has a profile without client input.
* The platform role lives in `auth.users.raw_app_meta_data` (exposed to the API
  as the `app_metadata.role` JWT claim), not in `profiles`. Only the service
  role can write it, so a client cannot grant itself a role; `profiles` stores
  career data instead.
* Membership rows (`organization_memberships`,
  `student_college_memberships`) are readable by owners/tenant members but
  **not writable** by `authenticated` — provisioning is an operator action.
* `app.current_college_ids()` / `app.current_recruiter_organization_ids()` are
  `SECURITY DEFINER` helpers so policies on a membership table can reuse them
  without triggering recursive RLS.
* Student profile fields are **not** exposed to college staff yet. Widening
  that requires an explicit, documented visibility decision plus a scoped view;
  the current policies only allow a user to read and edit their own profile.

## Verifying RLS after applying

```sql
-- as the postgres user
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', json_build_object('sub', auth.uid())::text, true);
-- auth.uid() reads the same settings, so use a real subject instead:
```

Prefer `supabase test db` / a throwaway JWT when writing RLS regression tests;
these policies have not yet been executed against a live project.

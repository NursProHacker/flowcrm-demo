-- FlowCRM core schema: one private organization per installation.
-- Review this migration before applying it to any Supabase project.
-- Intentionally uses CREATE without IF NOT EXISTS so pre-existing objects cause a visible failure.
-- Provisioning notes:
--   1. An administrator provisions the single organization through a trusted setup process.
--   2. The first Owner membership is created through a trusted administrative process.
--   3. No untrusted authenticated user can claim the organization.
--   4. Public signup should be disabled for the production client installation.
--   5. Keep the "private" schema out of Supabase Data API exposed schemas.
-- Never put a bootstrap secret or password in this migration.

BEGIN;

-- Keep schema discovery needed by the client while preventing client-created objects.
-- PUBLIC is included so inherited CREATE grants cannot bypass per-role revokes.
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  name text NOT NULL,
  business_type text,
  description text,
  phone text,
  email text,
  website text,
  address text,
  currency text NOT NULL DEFAULT 'KZT',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT organizations_currency_kzt_check CHECK (currency = 'KZT')
);

-- A unique constant expression permits zero or one organization, never more than one.
CREATE UNIQUE INDEX organizations_singleton_idx ON public.organizations ((true));

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT organization_memberships_role_check
    CHECK (role IN ('owner', 'admin', 'manager', 'sales', 'support')),
  CONSTRAINT organization_memberships_status_check
    CHECK (status IN ('active', 'invited', 'suspended')),
  CONSTRAINT organization_memberships_organization_user_key UNIQUE (organization_id, user_id)
);
CREATE INDEX organization_memberships_user_id_idx ON public.organization_memberships (user_id);
CREATE INDEX organization_memberships_org_status_role_idx
  ON public.organization_memberships (organization_id, status, role);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  job_title text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT employees_organization_auth_user_key UNIQUE (organization_id, auth_user_id)
);
COMMENT ON TABLE public.employees IS
  'Employee directory record; it is distinct from organization_memberships and does not grant organization access.';
COMMENT ON COLUMN public.employees.auth_user_id IS
  'Optional Auth account link for an employee; this link alone never grants organization membership or authorization.';
CREATE INDEX employees_organization_active_idx ON public.employees (organization_id, is_active);
CREATE INDEX employees_auth_user_id_idx ON public.employees (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX employees_organization_email_idx ON public.employees (organization_id, email);

-- SECURITY DEFINER is required here to read memberships from policies on that same table
-- without recursive RLS evaluation. The migration owner must remain a trusted DB role.
CREATE FUNCTION private.has_active_membership(
  target_organization_id pg_catalog.uuid,
  allowed_roles pg_catalog.text[] DEFAULT NULL
)
RETURNS pg_catalog.boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships AS membership
    WHERE membership.organization_id = target_organization_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
      AND (allowed_roles IS NULL OR membership.role = ANY (allowed_roles))
  );
$$;
-- Pin the SECURITY DEFINER owner to the trusted Supabase database administrator.
-- The empty search_path and fully qualified object references above prevent object shadowing.
ALTER FUNCTION private.has_active_membership(pg_catalog.uuid, pg_catalog.text[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION private.has_active_membership(pg_catalog.uuid, pg_catalog.text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_active_membership(pg_catalog.uuid, pg_catalog.text[])
  TO authenticated;

CREATE FUNCTION private.set_updated_at()
RETURNS pg_catalog.trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER organization_memberships_set_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE TRIGGER employees_set_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Remove default/public client table access before granting narrowly scoped access.
REVOKE ALL PRIVILEGES ON TABLE
  public.organizations,
  public.profiles,
  public.organization_memberships,
  public.employees
FROM PUBLIC, anon, authenticated;

-- Organizations can be provisioned only by the trusted administrative process.
-- Authenticated members may read their organization's row; only Owner/Admin may edit it.
GRANT SELECT ON public.organizations TO authenticated;
GRANT UPDATE (name, business_type, description, phone, email, website, address, currency)
  ON public.organizations TO authenticated;
CREATE POLICY organizations_select_member
  ON public.organizations FOR SELECT TO authenticated
  USING (private.has_active_membership(id));
CREATE POLICY organizations_update_owner_admin
  ON public.organizations FOR UPDATE TO authenticated
  USING (private.has_active_membership(id, ARRAY['owner', 'admin']::text[]))
  WITH CHECK (private.has_active_membership(id, ARRAY['owner', 'admin']::text[]));

-- A user may manage only their own profile. Profiles contain no authorization role.
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, email, avatar_url) ON public.profiles TO authenticated;
CREATE POLICY profiles_select_self
  ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_insert_self
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Memberships are readable only inside the caller's active organization.
-- There are deliberately no authenticated INSERT/UPDATE/DELETE grants or policies:
-- ordinary clients cannot invite users, alter roles/status, or grant Owner/Admin.
GRANT SELECT ON public.organization_memberships TO authenticated;
CREATE POLICY organization_memberships_select_member
  ON public.organization_memberships FOR SELECT TO authenticated
  USING (private.has_active_membership(organization_id));

-- Employee directory is visible to active members; only Owner/Admin can manage it.
-- Every policy checks organization_memberships through the helper; auth_user_id is not an access path.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
CREATE POLICY employees_select_member
  ON public.employees FOR SELECT TO authenticated
  USING (private.has_active_membership(organization_id));
CREATE POLICY employees_insert_owner_admin
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (private.has_active_membership(organization_id, ARRAY['owner', 'admin']::text[]));
CREATE POLICY employees_update_owner_admin
  ON public.employees FOR UPDATE TO authenticated
  USING (private.has_active_membership(organization_id, ARRAY['owner', 'admin']::text[]))
  WITH CHECK (private.has_active_membership(organization_id, ARRAY['owner', 'admin']::text[]));
CREATE POLICY employees_delete_owner_admin
  ON public.employees FOR DELETE TO authenticated
  USING (private.has_active_membership(organization_id, ARRAY['owner', 'admin']::text[]));

-- Trusted backend/admin provisioning uses this role. Never expose its key in a client app.
GRANT ALL PRIVILEGES ON TABLE
  public.organizations,
  public.profiles,
  public.organization_memberships,
  public.employees
TO service_role;

COMMENT ON SCHEMA private IS
  'Internal authorization helpers. Do not add this schema to Supabase Data API exposed schemas.';
COMMENT ON FUNCTION private.has_active_membership(pg_catalog.uuid, pg_catalog.text[]) IS
  'Checks the authenticated user membership for RLS; execute is granted only to authenticated.';
COMMENT ON TABLE public.organizations IS
  'One organization per installation. Provision only through a trusted administrative setup process.';
COMMENT ON TABLE public.organization_memberships IS
  'Create the first Owner membership only through a trusted administrative process; no public bootstrap or claim RPC exists.';

COMMIT;

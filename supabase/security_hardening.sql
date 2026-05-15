-- Skill: Database Security & RLS
-- Staff Engineer Audit: Immediate Hardening SQL for Supabase

-- 1. Enable RLS on all tables
ALTER TABLE public.games_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Users can only see their own saved games
CREATE POLICY "Users can only access their own games"
ON public.games_history
FOR ALL
USING (auth.uid() = user_id);

-- 3. Policy: Admins can view all users, but only themselves
CREATE POLICY "Admins can manage user profiles"
ON public.profiles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR 
  auth.uid() = id
);

-- 4. Audit Log Table (Defensive Layer)
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
-- Only system can write/read logs
CREATE POLICY "System only logs" ON security_audit_logs FOR ALL USING (false);

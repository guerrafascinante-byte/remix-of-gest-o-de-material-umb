-- =============================================
-- PASSO 1: Criar enum de papéis
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- =============================================
-- PASSO 2: Criar tabela de papéis
-- =============================================
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASSO 3: Criar função de verificação (SECURITY DEFINER)
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- PASSO 4: Políticas RLS para user_roles
-- =============================================
-- Usuários podem ver seus próprios papéis
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Apenas admins podem gerenciar papéis (INSERT, UPDATE, DELETE)
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PASSO 5: Atualizar política do audit_logs
-- =============================================
DROP POLICY IF EXISTS "Audit_logs SELECT autenticado" ON public.audit_logs;

CREATE POLICY "Audit_logs SELECT restrito"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- PASSO 6: Atribuir papel admin ao primeiro usuário
-- =============================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
LIMIT 1;
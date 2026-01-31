-- Drop existing objects first to recreate them fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_materiais_updated_at ON public.materiais;
DROP TRIGGER IF EXISTS update_reservas_updated_at ON public.reservas;

-- Drop policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Empreiteiras SELECT autenticado" ON public.empreiteiras;
DROP POLICY IF EXISTS "Empreiteiras INSERT autenticado" ON public.empreiteiras;
DROP POLICY IF EXISTS "Empreiteiras UPDATE autenticado" ON public.empreiteiras;
DROP POLICY IF EXISTS "Empreiteiras DELETE autenticado" ON public.empreiteiras;
DROP POLICY IF EXISTS "Materiais SELECT autenticado" ON public.materiais;
DROP POLICY IF EXISTS "Materiais INSERT autenticado" ON public.materiais;
DROP POLICY IF EXISTS "Materiais UPDATE autenticado" ON public.materiais;
DROP POLICY IF EXISTS "Materiais DELETE autenticado" ON public.materiais;
DROP POLICY IF EXISTS "Reservas SELECT autenticado" ON public.reservas;
DROP POLICY IF EXISTS "Reservas INSERT autenticado" ON public.reservas;
DROP POLICY IF EXISTS "Reservas UPDATE autenticado" ON public.reservas;
DROP POLICY IF EXISTS "Reservas DELETE autenticado" ON public.reservas;
DROP POLICY IF EXISTS "Historico SELECT autenticado" ON public.historico_importacoes;
DROP POLICY IF EXISTS "Historico INSERT autenticado" ON public.historico_importacoes;
DROP POLICY IF EXISTS "Audit_logs SELECT restrito" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit_logs INSERT autenticado" ON public.audit_logs;

-- Drop foreign key constraint if exists
ALTER TABLE IF EXISTS public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Drop tables in correct order (respecting dependencies)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.historico_importacoes CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.materiais CASCADE;
DROP TABLE IF EXISTS public.empreiteiras CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;

-- Drop enum type
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Now recreate everything from scratch

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create empreiteiras table
CREATE TABLE public.empreiteiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materiais table
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'UN',
  tipo TEXT,
  categoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservas table
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_reserva TEXT NOT NULL,
  material_codigo TEXT NOT NULL,
  material_nome TEXT NOT NULL,
  quantidade_solicitada INTEGER NOT NULL DEFAULT 0,
  quantidade_liberada INTEGER NOT NULL DEFAULT 0,
  quantidade_utilizada INTEGER NOT NULL DEFAULT 0,
  saldo INTEGER,
  localidade TEXT NOT NULL,
  mes_referencia TEXT NOT NULL,
  ano_referencia INTEGER NOT NULL DEFAULT 2025,
  data_reserva DATE DEFAULT CURRENT_DATE,
  data_solicitacao DATE,
  data_liberacao DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  justificativa TEXT,
  empreiteira TEXT NOT NULL DEFAULT 'Consórcio Nova Bolandeira II',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create historico_importacoes table
CREATE TABLE public.historico_importacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_arquivo TEXT NOT NULL,
  tipo_importacao TEXT NOT NULL,
  localidade TEXT NOT NULL,
  mes_referencia TEXT NOT NULL,
  ano_referencia INTEGER NOT NULL DEFAULT 2025,
  quantidade_registros INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Sucesso',
  empreiteira TEXT DEFAULT 'Consórcio Nova Bolandeira II',
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'Sistema',
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key from audit_logs to profiles
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'));
  RETURN NEW;
END;
$$;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for updated_at
CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreiteiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for empreiteiras (authenticated users)
CREATE POLICY "Empreiteiras SELECT autenticado" ON public.empreiteiras
  FOR SELECT USING (true);

CREATE POLICY "Empreiteiras INSERT autenticado" ON public.empreiteiras
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Empreiteiras UPDATE autenticado" ON public.empreiteiras
  FOR UPDATE USING (true);

CREATE POLICY "Empreiteiras DELETE autenticado" ON public.empreiteiras
  FOR DELETE USING (true);

-- RLS Policies for materiais (authenticated users)
CREATE POLICY "Materiais SELECT autenticado" ON public.materiais
  FOR SELECT USING (true);

CREATE POLICY "Materiais INSERT autenticado" ON public.materiais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Materiais UPDATE autenticado" ON public.materiais
  FOR UPDATE USING (true);

CREATE POLICY "Materiais DELETE autenticado" ON public.materiais
  FOR DELETE USING (true);

-- RLS Policies for reservas (authenticated users)
CREATE POLICY "Reservas SELECT autenticado" ON public.reservas
  FOR SELECT USING (true);

CREATE POLICY "Reservas INSERT autenticado" ON public.reservas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Reservas UPDATE autenticado" ON public.reservas
  FOR UPDATE USING (true);

CREATE POLICY "Reservas DELETE autenticado" ON public.reservas
  FOR DELETE USING (true);

-- RLS Policies for historico_importacoes (authenticated users)
CREATE POLICY "Historico SELECT autenticado" ON public.historico_importacoes
  FOR SELECT USING (true);

CREATE POLICY "Historico INSERT autenticado" ON public.historico_importacoes
  FOR INSERT WITH CHECK (true);

-- RLS Policies for audit_logs
CREATE POLICY "Audit_logs SELECT restrito" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Audit_logs INSERT autenticado" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
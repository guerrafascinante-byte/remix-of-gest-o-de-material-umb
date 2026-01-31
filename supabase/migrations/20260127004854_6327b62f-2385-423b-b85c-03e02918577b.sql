-- =============================================
-- MATERIAIS: Remover politicas publicas e criar autenticadas
-- =============================================
DROP POLICY IF EXISTS "Acesso público materiais INSERT" ON public.materiais;
DROP POLICY IF EXISTS "Acesso público materiais UPDATE" ON public.materiais;
DROP POLICY IF EXISTS "Acesso público materiais DELETE" ON public.materiais;
DROP POLICY IF EXISTS "Acesso público materiais SELECT" ON public.materiais;

CREATE POLICY "Materiais SELECT autenticado" 
  ON public.materiais FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Materiais INSERT autenticado" 
  ON public.materiais FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Materiais UPDATE autenticado" 
  ON public.materiais FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Materiais DELETE autenticado" 
  ON public.materiais FOR DELETE 
  TO authenticated 
  USING (true);

-- =============================================
-- RESERVAS: Remover politicas publicas e criar autenticadas
-- =============================================
DROP POLICY IF EXISTS "Acesso público reservas INSERT" ON public.reservas;
DROP POLICY IF EXISTS "Acesso público reservas UPDATE" ON public.reservas;
DROP POLICY IF EXISTS "Acesso público reservas DELETE" ON public.reservas;
DROP POLICY IF EXISTS "Acesso público reservas SELECT" ON public.reservas;

CREATE POLICY "Reservas SELECT autenticado" 
  ON public.reservas FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Reservas INSERT autenticado" 
  ON public.reservas FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Reservas UPDATE autenticado" 
  ON public.reservas FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Reservas DELETE autenticado" 
  ON public.reservas FOR DELETE 
  TO authenticated 
  USING (true);

-- =============================================
-- EMPREITEIRAS: Remover politicas publicas e criar autenticadas
-- =============================================
DROP POLICY IF EXISTS "Acesso público empreiteiras INSERT" ON public.empreiteiras;
DROP POLICY IF EXISTS "Acesso público empreiteiras UPDATE" ON public.empreiteiras;
DROP POLICY IF EXISTS "Acesso público empreiteiras DELETE" ON public.empreiteiras;
DROP POLICY IF EXISTS "Acesso público empreiteiras SELECT" ON public.empreiteiras;

CREATE POLICY "Empreiteiras SELECT autenticado" 
  ON public.empreiteiras FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Empreiteiras INSERT autenticado" 
  ON public.empreiteiras FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Empreiteiras UPDATE autenticado" 
  ON public.empreiteiras FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Empreiteiras DELETE autenticado" 
  ON public.empreiteiras FOR DELETE 
  TO authenticated 
  USING (true);

-- =============================================
-- HISTORICO_IMPORTACOES: Remover politicas publicas e criar autenticadas
-- =============================================
DROP POLICY IF EXISTS "Acesso público historico INSERT" ON public.historico_importacoes;
DROP POLICY IF EXISTS "Acesso público historico SELECT" ON public.historico_importacoes;

CREATE POLICY "Historico SELECT autenticado" 
  ON public.historico_importacoes FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Historico INSERT autenticado" 
  ON public.historico_importacoes FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- =============================================
-- AUDIT_LOGS: Remover politicas publicas e criar autenticadas
-- =============================================
DROP POLICY IF EXISTS "Acesso publico audit_logs INSERT" ON public.audit_logs;
DROP POLICY IF EXISTS "Acesso publico audit_logs SELECT" ON public.audit_logs;

CREATE POLICY "Audit_logs SELECT autenticado" 
  ON public.audit_logs FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Audit_logs INSERT autenticado" 
  ON public.audit_logs FOR INSERT 
  TO authenticated 
  WITH CHECK (true);
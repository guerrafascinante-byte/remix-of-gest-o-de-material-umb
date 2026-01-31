-- Remover politica atual permissiva
DROP POLICY IF EXISTS "Audit_logs INSERT autenticado" ON public.audit_logs;

-- Nova politica: usuario so pode inserir logs com seu proprio user_id
CREATE POLICY "Audit_logs INSERT autenticado"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );
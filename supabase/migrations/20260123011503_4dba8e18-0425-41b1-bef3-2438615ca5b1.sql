-- Adicionar política DELETE para empreiteiras
CREATE POLICY "Acesso público empreiteiras DELETE"
ON public.empreiteiras
FOR DELETE
USING (true);
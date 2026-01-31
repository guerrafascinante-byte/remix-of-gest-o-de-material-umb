-- Tabela de Materiais (catálogo)
CREATE TABLE public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'UN',
  tipo TEXT,
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Reservas/Movimentações
CREATE TABLE public.reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_reserva TEXT NOT NULL,
  material_codigo TEXT NOT NULL,
  material_nome TEXT NOT NULL,
  quantidade_solicitada INTEGER NOT NULL DEFAULT 0,
  quantidade_liberada INTEGER NOT NULL DEFAULT 0,
  quantidade_utilizada INTEGER NOT NULL DEFAULT 0,
  saldo INTEGER GENERATED ALWAYS AS (quantidade_liberada - quantidade_utilizada) STORED,
  localidade TEXT NOT NULL CHECK (localidade IN ('Lauro', 'Salvador')),
  mes_referencia TEXT NOT NULL,
  ano_referencia INTEGER NOT NULL DEFAULT 2025,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Liberado', 'Parcial', 'Concluído')),
  justificativa TEXT,
  empreiteira TEXT NOT NULL DEFAULT 'Consórcio Nova Bolandeira II',
  data_reserva DATE DEFAULT CURRENT_DATE,
  data_solicitacao DATE,
  data_liberacao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Histórico de Importações
CREATE TABLE public.historico_importacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_arquivo TEXT NOT NULL,
  tipo_importacao TEXT NOT NULL CHECK (tipo_importacao IN ('solicitacao', 'liberacao', 'utilizacao')),
  localidade TEXT NOT NULL,
  mes_referencia TEXT NOT NULL,
  ano_referencia INTEGER NOT NULL DEFAULT 2025,
  quantidade_registros INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Sucesso' CHECK (status IN ('Sucesso', 'Parcial', 'Erro')),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Empreiteiras
CREATE TABLE public.empreiteiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir empreiteira padrão
INSERT INTO public.empreiteiras (nome, cnpj, contato)
VALUES ('Consórcio Nova Bolandeira II', '12.345.678/0001-90', 'contato@novabolandeira.com.br');

-- Habilitar RLS
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreiteiras ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para acesso total (sistema interno sem autenticação por enquanto)
CREATE POLICY "Acesso público materiais SELECT" ON public.materiais FOR SELECT USING (true);
CREATE POLICY "Acesso público materiais INSERT" ON public.materiais FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público materiais UPDATE" ON public.materiais FOR UPDATE USING (true);
CREATE POLICY "Acesso público materiais DELETE" ON public.materiais FOR DELETE USING (true);

CREATE POLICY "Acesso público reservas SELECT" ON public.reservas FOR SELECT USING (true);
CREATE POLICY "Acesso público reservas INSERT" ON public.reservas FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público reservas UPDATE" ON public.reservas FOR UPDATE USING (true);
CREATE POLICY "Acesso público reservas DELETE" ON public.reservas FOR DELETE USING (true);

CREATE POLICY "Acesso público historico SELECT" ON public.historico_importacoes FOR SELECT USING (true);
CREATE POLICY "Acesso público historico INSERT" ON public.historico_importacoes FOR INSERT WITH CHECK (true);

CREATE POLICY "Acesso público empreiteiras SELECT" ON public.empreiteiras FOR SELECT USING (true);
CREATE POLICY "Acesso público empreiteiras INSERT" ON public.empreiteiras FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso público empreiteiras UPDATE" ON public.empreiteiras FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_reservas_localidade ON public.reservas(localidade);
CREATE INDEX idx_reservas_mes ON public.reservas(mes_referencia, ano_referencia);
CREATE INDEX idx_reservas_material ON public.reservas(material_codigo);
CREATE INDEX idx_reservas_status ON public.reservas(status);
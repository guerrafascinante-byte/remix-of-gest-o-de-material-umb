# Guia de Migração para Supabase Próprio

Você desconectou este projeto do Lovable Cloud. Agora, para usar seu próprio banco de dados Supabase, siga estes passos:

## 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Aguarde a configuração do banco de dados.

## 2. Configurar Variáveis de Ambiente
1. No seu projeto Supabase, vá em **Project Settings > API**.
2. Copie a **Project URL** e cole em `VITE_SUPABASE_URL` no arquivo `.env`.
3. Copie a **anon public key** e cole em `VITE_SUPABASE_PUBLISHABLE_KEY` no arquivo `.env`.
4. Copie o **Reference ID** (não o nome) e cole em `VITE_SUPABASE_PROJECT_ID` no arquivo `.env` (opcional, mas bom ter).

## 3. Rodar Migrações (Criar as tabelas)
Como você tem arquivos de migração na pasta `supabase/migrations`, a melhor forma de criar as tabelas é usando o Supabase CLI.

### Opção A: Usando o CLI (Recomendado)
1. Instale o CLI (se não tiver):
   ```bash
   npm install -g supabase
   ```
2. Faça login no Supabase:
   ```bash
   supabase login
   ```
3. Link seu projeto (usando o Reference ID do passo 2.4):
   ```bash
   supabase link --project-ref SEU_PROJECT_ID
   ```
   *Ele vai pedir a senha do banco de dados que você criou.*
4. Envie as migrações:
   ```bash
   supabase db push
   ```

### Opção B: Manualmente (SQL Editor)
Se não quiser instalar o CLI, você pode copiar o conteúdo dos arquivos `.sql` na pasta `supabase/migrations` e colar no **SQL Editor** do dashboard do Supabase. IMPORTANTE: Cole e execute na ordem cronológica (do arquivo mais antigo para o mais novo).

---
Agora seu projeto está rodando 100% no seu controle!

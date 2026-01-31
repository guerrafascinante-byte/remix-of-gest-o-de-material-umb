

# Plano: Ajustar Tamanho do Modal de Divergencias

## Problema Identificado

O popup de edicao de divergencia esta muito grande, ultrapassando a altura visivel da tela e ocultando os botoes de confirmacao ("Cancelar" e "Salvar Ajuste") na parte inferior.

---

## Causa Raiz

O DialogContent possui altura fixa baseada no conteudo, sem:
1. Limite de altura maxima (max-height)
2. Scroll interno quando o conteudo excede a area visivel
3. Espacamento compacto entre elementos

---

## Solucao Proposta

### 1. Adicionar Scroll ao Conteudo do Modal

Encapsular o conteudo principal do modal em um container com scroll, mantendo o cabecalho e rodape (botoes) sempre visiveis.

### 2. Limitar Altura Maxima do Modal

Adicionar `max-h-[85vh]` ao DialogContent para garantir que o modal nunca ultrapasse 85% da altura da tela.

### 3. Compactar Espacamento Interno

Reduzir espacamentos e fontes para que o conteudo caiba melhor em telas menores:
- Reduzir `space-y-4` para `space-y-3`
- Reduzir padding interno dos cards de informacao
- Reduzir altura minima do Textarea de justificativa

---

## Alteracoes no Arquivo

### `src/pages/DivergenciasPage.tsx`

**Linha 370 - DialogContent:**
```text
Antes:  <DialogContent className="sm:max-w-lg">
Depois: <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
```

**Linha 382 - Container do conteudo:**
```text
Antes:  <div className="space-y-4 py-2">
Depois: <div className="space-y-3 py-2 overflow-y-auto flex-1 pr-1">
```

**Linhas 384-398 - Secao Material Info:**
Compactar espacamento:
```text
Antes:  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
Depois: <div className="p-2 bg-muted/50 rounded-lg space-y-1">
```

**Linha 529 - Textarea de Justificativa:**
```text
Antes:  className="mt-1 min-h-[60px] text-sm"
Depois: className="mt-1 min-h-[50px] text-sm"
```

---

## Estrutura Final do Modal

```text
+----------------------------------+
|  Header (titulo + descricao)     |  <- fixo no topo
+----------------------------------+
|                                  |
|  Conteudo com Scroll             |  <- overflow-y-auto
|  - Material Info                 |
|  - Valores Atuais                |
|  - Tipo de Ajuste                |
|  - Input Quantidade              |
|  - Preview                       |
|  - Justificativa                 |
|                                  |
+----------------------------------+
|  Footer (Cancelar | Salvar)      |  <- fixo no rodape
+----------------------------------+
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/DivergenciasPage.tsx` | Ajustar classes do modal para altura maxima e scroll |

---

## Resultado Esperado

1. Modal nunca ultrapassa 85% da altura da tela
2. Quando o conteudo excede o espaco disponivel, aparece scroll interno
3. Botoes "Cancelar" e "Salvar Ajuste" sempre visiveis na parte inferior
4. Layout compacto e profissional mantido


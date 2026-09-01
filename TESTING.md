# Guia de Teste — Conversor de Figma para Lua MTA

Guia passo a passo para avaliar o plugin **Conversor de Figma para Lua MTA** (Figma Community).

O plugin é autocontido: **não exige login, pagamento, servidor externo, permissões especiais nem internet** para funcionar. Toda a conversão acontece dentro do Figma e o ZIP é gerado no navegador, sem chamadas de rede.

## Pré-requisitos

- Conta gratuita no Figma.
- Acesso ao plugin pela página da Figma Community (botão *Instalar*).

## Passo a passo

### 1. Instalar o plugin

1. Abra a página do plugin **Conversor de Figma para Lua MTA** na Figma Community.
2. Clique em **Instalar**.
3. O plugin aparece em *Menu → Plugins → Conversor de Figma para Lua MTA*.

### 2. Criar um arquivo de teste

Em uma página em branco (ou qualquer arquivo de rascunho), crie:

1. Um **frame** de `1920 × 1080` chamado **"Background"**, com preenchimento de cor sólida (ex.: cinza escuro). Esse frame define a resolução do código gerado.
2. Dentro do frame, adicione:
   - 2–3 **retângulos** coloridos (um deles com cantos arredondados, ex.: 12px);
   - 1–2 **textos** ("Título" e "Botão"), de preferência com cores diferentes;
   - 1 **imagem** ou ícone (opcional, para testar a exportação de assets).

### 3. Executar o plugin

1. Clique com o botão direito na tela → **Plugins** → **Conversor de Figma para Lua MTA**.
2. Na janela do plugin, com **nada selecionado** no documento, clique em **CONVERTER E BAIXAR ZIP**.
3. O navegador baixa automaticamente o arquivo `ProjetoGerado.zip`.

### 4. Verificar o resultado

Extraia o ZIP e confira:

| Arquivo | O que validar |
| --- | --- |
| `ProjetoGerado.lua` | Contém `guiGetScreenSize`, escala adaptativa (`zoom = math.min(...)`), e chamadas `dxDrawText`, `dxDrawRectangle`, `dxDrawRoundedRectangle` (se houver cantos arredondados) e `dxDrawImage` (se houver imagem/ícone). Textos usam `tocolor(...)`. |
| `meta.xml` | `<script src="ProjetoGerado.lua" type="client" />` e um `<file src="assets/images/..." />` para cada imagem exportada. |
| `assets/images/` | Pasta presente contendo os PNGs exportados (somente se o design tiver imagens, ícones, vetores ou gradientes). |

### 5. Teste de seleção (opcional)

- Selecione **apenas o frame "Background"** e converta de novo: o código gerado continua igual, pois o Background define a resolução e não entra no código como elemento desenhado.
- Altere o campo *Nome do Background* para outro nome (ex.: "Tela") e dê esse nome a um frame: o plugin passa a tratá-lo como Background.
- Remova o nome "Background" de todos os frames e converta: o plugin usa a resolução do maior frame selecionado (fallback automático).

## O que o avaliador deve observar

- **Funciona sem configuração**: o único campo opcional é o nome do Background — o padrão `Background` já funciona.
- **Baixa o ZIP imediatamente**: em poucos segundos, sem pedir permissões ou senhas.
- **Não depende de rede**: a interface embute a biblioteca de ZIP (JSZip) — a geração funciona offline, sem CDN.
- **Código Lua válido**: a estrutura gerada usa chamadas oficiais do GTA MTA (`dxDrawText`, `dxDrawRectangle`, `dxDrawImage`, `guiGetScreenSize`, `onClientPreRender`).

## Solução de problemas

| Problema | Motivo provável |
| --- | --- |
| O plugin não aparece no menu | O botão *Instalar* não foi confirmado; verifique em *Plugins → Instalados*. |
| O ZIP não baixa | O navegador bloqueou o download automático; permita downloads do Figma e tente de novo. |
| Imagem não exportada | O elemento está oculto (`visible` desligado) ou dentro de grupo oculto — deixe visível antes de converter. |
| Texto com posição diferente do Figma | O texto pode ter tamanho de linha maior que o visualizado; é esperado em fontes com `yScale` maior que 1. |

## Créditos

- Autor: **@SrTermax** (https://x.com/SrTermax) — projeto código aberto (MIT).
- Colaboradores: **SiiLVa & Baron_Scr**
- Versão: 1.0.1
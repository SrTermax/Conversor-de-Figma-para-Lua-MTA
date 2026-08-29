# Submissão Figma Community - Conversor de Figma para Lua MTA

## Informações do Plugin

- **Nome**: Conversor de Figma para Lua MTA
- **Versão**: 1.0.1
- **Autor**: @SrTermax
- **Descrição**: Plugin que converte designs Figma em código Lua para Multi Theft Auto (MTA)

## Instruções de Teste para Avaliadores

### Método 1: Teste via Figma Community (Recomendado)

1. **Acesse a página do plugin** na Figma Community
2. **Clique em "Instalar"** para adicionar ao seu Figma
3. **Abra um arquivo Figma** com elementos visuais
4. **Execute o plugin**: Menu → Plugins → Conversor de Figma para Lua MTA
5. **Configure o Background** (opcional):
   - O campo "Nome do Background" define qual frame representa a tela
   - Se deixar em branco, usará "Background" como padrão
6. **Clique em "CONVERTER E BAIXAR ZIP"**
7. **Baixe e extraia o arquivo ZIP** gerado

### Método 2: Teste via Figma Desktop

1. **Clone este repositório** localmente
2. **Abra o Figma Desktop**
3. **Acesse**: Menu → Plugins → Development → Import plugin from manifest
4. **Selecione o arquivo `manifest.json`** deste repositório
5. **Execute o plugin** e teste conforme o Método 1

## Design de Teste

Para facilitar a avaliação, incluí um design de teste (`TEST_DESIGN.figma`) com:

- **Background**: Frame de 1920x1080 com cor escura
- **Panel**: Retângulo arredondado branco
- **Title**: Texto "MTA Plugin Test" centralizado
- **Button**: Retângulo roxo com texto "Click Me"

## Funcionalidades Testadas

1. **Conversão de elementos**:
   - Retângulos → `dxDrawRectangle`
   - Retângulos arredondados → `dxDrawRoundedRectangle`
   - Textos → `dxDrawText`
   - Imagens → `dxDrawImage`

2. **Escala adaptativa**:
   - Calcula zoom baseado na resolução da tela
   - Centraliza o design automaticamente
   - Funciona em qualquer resolução de jogador

3. **Exportação de assets**:
   - Imagens são exportadas automaticamente
   - Gera `meta.xml` para MTA
   - Cria pasta `assets/images/` no ZIP

## Arquivos Incluídos na Submissão

- `manifest.json` - Configuração do plugin
- `code.js` - Código principal compilado
- `ui.html` - Interface do plugin
- `TEST_DESIGN.figma` - Design de teste
- `TESTING.md` - Instruções detalhadas de teste
- `SUBMISSION_INSTRUCTIONS.md` - Instruções para avaliadores

## Requisitos Técnicos

- **Figma Desktop** (recomendado para testes)
- **Figma Community** (para instalação via marketplace)
- **Sem permissões especiais necessárias**
- **Sem sistemas internos ou restritos**
- **Acesso gratuito e imediato**

## Créditos

- **Autor**: @SrTermax
- **Colaboradores**: SiiLVa & Baron_Scr
- **Data de Lançamento**: 22/08/2026
- **Versão Beta Oficial**: 22/08/2026

## Contato

- **Twitter**: https://x.com/@SrTermax
- **GitHub**: Repositório atual
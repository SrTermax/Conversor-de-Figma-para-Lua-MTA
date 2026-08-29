# Instruções de Submissão - Figma Community

## Resumo do Plugin

**Conversor de Figma para Lua MTA** é um plugin Figma que converte designs em código Lua para Multi Theft Auto (MTA).

## Instruções de Teste para Avaliadores

### Passo 1: Acesso ao Plugin

1. **Via Figma Community**:
   - Acesse a página do plugin na Figma Community
   - Clique em "Instalar" para adicionar ao seu Figma

2. **Via Figma Desktop**:
   - Menu → Plugins → Development → Import plugin from manifest
   - Selecione o arquivo `manifest.json` deste repositório

### Passo 2: Preparação do Design

1. **Abra um arquivo Figma** com elementos visuais
2. **Crie um frame** chamado "Background" (ou configure no plugin)
3. **Adicione elementos**:
   - Retângulos com cores
   - Textos com diferentes fontes
   - Imagens (se necessário)

### Passo 3: Execução do Plugin

1. **Acesse o plugin**: Menu → Plugins → Conversor de Figma para Lua MTA
2. **Configure o Background**:
   - O campo "Nome do Background" define qual frame representa a tela
   - Se deixar em branco, usará "Background" como padrão
3. **Selecione elementos** (opcional):
   - Se nenhum elemento estiver selecionado, todo o projeto será convertido
   - Selecione um frame específico para converter apenas ele
4. **Clique em "CONVERTER E BAIXAR ZIP"**

### Passo 4: Verificação do Resultado

1. **Baixe o arquivo ZIP** gerado automaticamente
2. **Extraia o conteúdo**:
   - `ProjetoGerado.lua` - Código Lua para MTA
   - `meta.xml` - Arquivo de metadados do MTA
   - `assets/images/` - Imagens exportadas (se houver)
3. **Verifique o código Lua**:
   - Deve conter chamadas para `dxDrawRectangle`, `dxDrawText`, etc.
   - Deve ter escala adaptativa para qualquer resolução
   - Deve incluir a função `dxDrawRoundedRectangle` se houver retângulos arredondados

## Funcionalidades Testadas

- ✅ Conversão de retângulos para `dxDrawRectangle`
- ✅ Conversão de textos para `dxDrawText`
- ✅ Exportação de imagens para `dxDrawImage`
- ✅ Suporte a retângulos arredondados com `dxDrawRoundedRectangle`
- ✅ Escala adaptativa para qualquer resolução de tela
- ✅ Geração de `meta.xml` para MTA
- ✅ Interface intuitiva com configurações opcionais

## Arquivos Incluídos

- `manifest.json` - Configuração do plugin Figma
- `code.js` - Código principal do plugin (compilado)
- `ui.html` - Interface do plugin
- `src/` - Código fonte TypeScript
- `TEST_DESIGN.figma` - Design de teste para avaliadores

## Créditos

- **Autor**: @SrTermax
- **Versão**: 1.0.1
- **Data de Lançamento**: 22/08/2026
- **Colaboradores**: SiiLVa & Baron_Scr

## Solução de Problemas

### O plugin não aparece no menu
- Reinicie o Figma Desktop
- Verifique se o plugin foi instalado corretamente

### Erro de permissão
- Verifique as configurações de segurança do Figma
- Use o Figma Desktop (não o navegador)

### Imagens não são exportadas
- Verifique se as imagens estão visíveis no Figma
- Certifique-se de que as imagens não estão em grupos ocultos

### Código Lua não funciona no MTA
- Verifique se o `meta.xml` está na pasta correta do resource
- Certifique-se de que as imagens estão na pasta `assets/images/`
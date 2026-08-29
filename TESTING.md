# Conversor de Figma para Lua MTA

Plugin Figma que converte designs em código Lua para Multi Theft Auto (MTA).

## Instruções de Teste

### Pré-requisitos
- Conta gratuita no Figma
- Acesso ao plugin (via Figma Community ou instalação local)

### Como Testar

1. **Abra um arquivo Figma** existente ou crie um novo projeto
2. **Acesse o plugin** de uma destas formas:
   - Via Figma Community: Busque "Conversor de Figma para Lua MTA" e clique em "Instalar"
   - Via Figma Desktop: Menu → Plugins → Development → Import plugin from manifest
3. **Execute o plugin**: Menu → Plugins → Conversor de Figma para Lua MTA
4. **Na interface do plugin**:
   - O campo "Nome do Background" define qual frame representa a tela (padrão: "Background")
   - Se nenhum elemento estiver selecionado, todo o projeto será convertido automaticamente
   - Selecione um frame específico para converter apenas ele
5. **Clique em "CONVERTER E BAIXAR ZIP"**
6. **O arquivo ZIP será baixado automaticamente** contendo:
   - `ProjetoGerado.lua` - Código Lua para MTA
   - `meta.xml` - Arquivo de metadados do MTA
   - `assets/images/` - Imagens exportadas (se houver)

### Funcionalidades Testadas

- Conversão automática de elementos Figma para código Lua
- Suporte a retângulos, textos, imagens e formas vetoriais
- Escala adaptativa para qualquer resolução de tela
- Exportação de imagens para assets
- Geração de meta.xml para MTA

### Arquivos Incluídos

- `manifest.json` - Configuração do plugin Figma
- `code.js` - Código principal do plugin (compilado)
- `ui.html` - Interface do plugin
- `src/` - Código fonte TypeScript
- `dist/` - Arquivos compilados

### Créditos

- Autor: @SrTermax
- Versão: 1.0.1
- Data de lançamento: 22/08/2026

### Solução de Problemas

- Se o plugin não aparecer no menu, reinicie o Figma
- Se houver erros de permissão, verifique as configurações de segurança do Figma
- Para testes locais, use o Figma Desktop (não o navegador)
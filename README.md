# Conversor de Figma para Lua MTA

Plugin Figma que converte designs em código Lua para Multi Theft Auto (MTA).

## Instruções de Teste (Figma Community)

### Passo a passo para testar o plugin:

1. **Acesse o plugin** na Figma Community ou instale via Figma Desktop
2. **Abra um arquivo Figma** com elementos (retângulos, textos, imagens)
3. **Execute o plugin**: Menu → Plugins → Conversor de Figma para Lua MTA
4. **Configure o Background** (opcional):
   - O campo "Nome do Background" define qual frame representa a tela padrão
   - Se nenhum elemento estiver selecionado, todo o projeto será convertido
5. **Clique em "CONVERTER E BAIXAR ZIP"**
6. **Baixe o arquivo ZIP** contendo:
   - `ProjetoGerado.lua` - Código Lua para MTA
   - `meta.xml` - Arquivo de metadados do MTA
   - `assets/images/` - Imagens exportadas (se houver)

### Funcionalidades:

- Conversão automática de elementos Figma para código Lua
- Suporte a retângulos, textos, imagens e formas vetoriais
- Escala adaptativa para qualquer resolução de tela
- Exportação de imagens para assets
- Geração de meta.xml para MTA

### Arquivos do Plugin:

- `manifest.json` - Configuração do plugin Figma
- `code.js` - Código principal do plugin
- `ui.html` - Interface do plugin
- `src/` - Código fonte TypeScript

### Créditos:

- Autor: @SrTermax
- Versão: 1.0.1
- Lançamento: 22/08/2026
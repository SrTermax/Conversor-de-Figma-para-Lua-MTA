# Conversor de Figma para Lua MTA

Plugin do Figma que converte designs em código Lua para **Multi Theft Auto (MTA)**. Gera `ProjetoGerado.lua`, `meta.xml` e exporta as imagens em `assets/images/` — o ZIP resultante é um resource pronto para o MTA.

Projeto **código aberto** (MIT). Feito para a comunidade MTA.

## Como usar (tutorial)

1. **Instale o plugin** na [Figma Community](https://www.figma.com/community) — busque "Conversor de Figma para Lua MTA" e clique em *Instalar*.
2. **Abra o seu design** no Figma (ou crie um frame novo).
3. **Execute o plugin**: clique com o botão direito na tela → *Plugins* → *Conversor de Figma para Lua MTA*.
4. **Configure o Background** (opcional): o campo *Nome do Background* define qual frame representa a tela/resolução (padrão: `Background`). O frame com esse nome define a resolução base e não entra no código gerado. Se vários nós tiverem o mesmo nome, o maior é o Background real.
5. **Selecione o que converter** (opcional):
   - Nada selecionado → converte o projeto inteiro.
   - Frame selecionado → converte somente ele.
6. **Clique em "CONVERTER E BAIXAR ZIP"** — o navegador baixa o arquivo `ProjetoGerado.zip` com:
   - `ProjetoGerado.lua` — código Lua para MTA;
   - `meta.xml` — metadados do resource;
   - `assets/images/` — imagens exportadas (quando houver).
7. **Use no MTA**: extraia o ZIP na pasta `resources/` do seu servidor e use `/start ProjetoGerado`.

### Tipos de elemento suportados

| Elemento Figma | Geração no Lua |
| --- | --- |
| Retângulo | `dxDrawRectangle` |
| Retângulo arredondado | `dxDrawRoundedRectangle` |
| Texto | `dxDrawText` |
| Imagem / ícone / vetor / elipse / gradiente | `dxDrawImage` (PNG exportado) |

### Recursos do código gerado

- **Escala adaptativa**: `zoom = math.min(sW/resW, sH/resH)` centraliza o design em qualquer resolução do jogador.
- **Cores fiéis**: fills semi-transparentes são compostos sobre a cor do Background, como no Figma.
- **Famílias de fonte** mapeadas para fontes MTA equivalentes (Inter → default, Arial → arial, Bebas Neue → pricedown, etc.).
- **Textos com cores diferentes** dentro do mesmo nó viram códigos `#RRGGBB` (colorCoded do `dxDrawText`).
- **Limpeza automática**: containers vazios não geram código; chamadas duplicadas são removidas.

## Testando o plugin (para avaliadores Figma)

Veja [TESTING.md](TESTING.md) com o passo a passo completo para avaliação.

## Desenvolvimento

```bash
npm install        # instala as dependências
npm run build      # compila src/ → code.js
npm run watch      # recompila automaticamente ao salvar
```

Para testar em desenvolvimento no Figma Desktop: *Menu → Plugins → Development → Import plugin from manifest* e selecione o `manifest.json`.

### Estrutura

```
manifest.json        Configuração do plugin Figma
src/main.ts          Lógica principal (UI + conversão + exportação)
src/lua-generator.ts Geração do código Lua, meta.xml e fontes
src/types.ts         Tipos compartilhados
ui.html              Interface do plugin (JSZip embutido, funciona offline)
code.js              Build gerado (não editar à mão)
```

## Licença

MIT — veja [LICENSE](LICENSE). Uso livre, inclusive comercial.

## Créditos

- Autor: **@SrTermax** (https://x.com/SrTermax)
- Agradecimento especial: **SiiLVa & Baron_Scr**
- Versão: 1.0.1
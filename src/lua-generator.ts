// Gerador de código Lua MTA a partir de nós Figma
import { NodeInfo, FillInfo, ColorInfo, ConversionConfig, ConversionResult } from './types';

// Função auxiliar para converter para inteiro
function toInt(n: number): number {
  return Math.round(n);
}

// Função auxiliar para converter cor
function toColor(color: ColorInfo | undefined, opacity: number = 1): string {
  if (!color) {
    return '255, 255, 255, 255';
  }
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round((color.a || 1) * opacity * 255);
  return `${r}, ${g}, ${b}, ${a}`;
}

// Função para sanitizar nome de arquivo
function sanitizeFileName(name: string): string {
  // Substituir espaços por underscores
  let sanitized = name.replace(/\s/g, '_');
  // Remover caracteres não alfanuméricos exceto underscore, hífen e ponto
  sanitized = sanitized.replace(/[^\w\-.]/g, '');
  return sanitized;
}

// Função para extrair informações de um nó Figma
export function extractNodeInfo(node: SceneNode): NodeInfo | null {
  if (!node.visible) {
    return null;
  }

  const info: NodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    visible: node.visible,
    fills: [],
    cornerRadius: 0,
    opacity: 1,
  };

  // Extrair fills
  if ('fills' in node && Array.isArray(node.fills)) {
    const fills = node.fills as Paint[];
    for (const fill of fills) {
      if (fill.type === 'SOLID' && 'color' in fill) {
        const solidPaint = fill as SolidPaint;
        info.fills.push({
          type: 'SOLID',
          color: {
            r: solidPaint.color.r,
            g: solidPaint.color.g,
            b: solidPaint.color.b,
            a: solidPaint.opacity || 1,
          },
          opacity: solidPaint.opacity || 1,
          visible: solidPaint.visible !== false,
        });
      } else if (fill.type === 'IMAGE') {
        info.fills.push({
          type: 'IMAGE',
          opacity: fill.opacity || 1,
          visible: fill.visible !== false,
        });
      }
    }
  }

  // Extrair corner radius
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    info.cornerRadius = node.cornerRadius;
  }

  // Extrair opacidade
  if ('opacity' in node && typeof node.opacity === 'number') {
    info.opacity = node.opacity;
  }

  // Extrair propriedades de texto
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    info.characters = textNode.characters;
    info.fontSize = textNode.fontSize as number;
    info.fontName = (textNode.fontName as FontName).family;
    info.textAlignHorizontal = textNode.textAlignHorizontal;
    info.textAlignVertical = textNode.textAlignVertical;
  }

  return info;
}

// Função para gerar código Lua completo
export function generateLuaCode(
  nodes: NodeInfo[],
  config: ConversionConfig,
  imageNames: string[]
): string {
  const drawCalls: string[] = [];
  const addedCalls = new Set<string>();
  let requiresRounded = false;

  // Processar cada nó
  for (const node of nodes) {
    // Pular Background
    if (
      node.name.toLowerCase() === config.backgroundName.toLowerCase() ||
      node.name.toLowerCase() === 'background' ||
      node.name.toLowerCase() === 'background_image'
    ) {
      continue;
    }

    // Processar texto
    if (node.type === 'TEXT') {
      const text = node.characters || node.name;
      let color = '255, 255, 255, 255';

      if (node.fills.length > 0 && node.fills[0].color) {
        color = toColor(node.fills[0].color, node.fills[0].opacity);
      }

      // Escapar aspas e normalizar espaços
      const escapedText = text
        .replace(/"/g, '\\"')
        .replace(/\s+/g, ' ')
        .trim();

      const call = `dxDrawText("${escapedText}", x*${toInt(node.x)}, y*${toInt(node.y)}, x*${toInt(node.width)}, y*${toInt(node.height)}, tocolor(${color}), x*2.0, "default", "left", "top", false, false, false, true, false)`;

      if (!addedCalls.has(call)) {
        drawCalls.push(call);
        addedCalls.add(call);
      }
      continue;
    }

    // Processar imagens
    const imageFill = node.fills.find((f) => f.type === 'IMAGE');
    if (imageFill) {
      const safeName = sanitizeFileName(node.name);
      const imagePath = `assets/images/${safeName}.png`;
      const call = `dxDrawImage(x*${toInt(node.x)}, y*${toInt(node.y)}, x*${toInt(node.width)}, y*${toInt(node.height)}, "${imagePath}", 0, 0, 0, tocolor(255, 255, 255, 255), false)`;

      if (!addedCalls.has(call)) {
        drawCalls.push(call);
        addedCalls.add(call);
      }
      continue;
    }

    // Processar formas (retângulos, etc)
    if (node.fills.length === 0) {
      continue;
    }

    const fill = node.fills[0];
    if (!fill.visible || fill.type === 'NONE') {
      continue;
    }

    if (!fill.color) {
      continue;
    }

    const color = toColor(fill.color, fill.opacity);
    const radius = toInt(node.cornerRadius);

    if (radius > 0) {
      requiresRounded = true;
      const call = `dxDrawRoundedRectangle(x*${toInt(node.x)}, y*${toInt(node.y)}, x*${toInt(node.width)}, y*${toInt(node.height)}, tocolor(${color}), ${radius})`;

      if (!addedCalls.has(call)) {
        drawCalls.push(call);
        addedCalls.add(call);
      }
    } else {
      const call = `dxDrawRectangle(x*${toInt(node.x)}, y*${toInt(node.y)}, x*${toInt(node.width)}, y*${toInt(node.height)}, tocolor(${color}))`;

      if (!addedCalls.has(call)) {
        drawCalls.push(call);
        addedCalls.add(call);
      }
    }
  }

  // Construir código Lua
  const luaLines: string[] = [];

  // Cabeçalho com informações
  luaLines.push(
    '-- Conversor de Figma para Lua MTA',
    '-- Gerado automaticamente pelo plugin Figma Convert Lua',
    '-- Se o seu projeto tiver imagens, certifique-se de que elas estão baixadas na pasta assets e exportadas no meta.xml!',
    '-- ECLIPSE não está disponivel nessa versão então evite usar, Vectory pode vim todo preto, ajuste conforme necessário!',
    '',
    '-- Agradecimento especial aos lendários: SiiLVa & Baron_Scr - Vocês são brabos demais!',
    '-- Versão 2025 - Gerado automaticamente pelo Figma Convert Lua. | Versão BETA Pode ocorrer bugs em alguns projetos!',
    '',
    ''
  );

  // Variáveis principais
  luaLines.push(
    'local sW, sH = guiGetScreenSize()',
    'local isOpen = true',
    `local resW, resH = ${config.resW}, ${config.resH}`,
    'local x, y = sW/resW, sH/resH',
    ''
  );

  // Função de renderização
  luaLines.push('function onClientRender_FigmaConvertMTA()');
  for (const call of drawCalls) {
    luaLines.push('\t' + call);
  }
  luaLines.push('end', '');

  // Event handler
  luaLines.push(
    'if isOpen then',
    '\taddEventHandler("onClientPreRender", root, onClientRender_FigmaConvertMTA)',
    'end'
  );

  // Adicionar função de retângulo arredondado se necessário
  if (requiresRounded) {
    luaLines.push(
      '',
      'function dxDrawRoundedRectangle(x, y, w, h, color, radius)',
      '\tw = w - radius * 2',
      '\th = h - radius * 2',
      '\tx = x + radius',
      '\ty = y + radius',
      '\tif (w >= 0) and (h >= 0) then',
      '\t\tdxDrawRectangle(x, y, w, h, color)',
      '\t\tdxDrawRectangle(x, y - radius, w, radius, color)',
      '\t\tdxDrawRectangle(x, y + h, w, radius, color)',
      '\t\tdxDrawRectangle(x - radius, y, radius, h, color)',
      '\t\tdxDrawRectangle(x + w, y, radius, h, color)',
      '\t\tdxDrawCircle(x, y, radius, 180, 270, color, color, 7)',
      '\t\tdxDrawCircle(x + w, y, radius, 270, 360, color, color, 7)',
      '\t\tdxDrawCircle(x + w, y + h, radius, 0, 90, color, color, 7)',
      '\t\tdxDrawCircle(x, y + h, radius, 90, 180, color, color, 7)',
      '\tend',
      'end'
    );
  }

  return luaLines.join('\n');
}

// Função para gerar meta.xml
export function generateMetaXML(imageNames: string[]): string {
  const fileEntries = imageNames.map(
    (name) => `  <file src="assets/images/${name}" />`
  );

  const files = fileEntries.length > 0 ? '\n' + fileEntries.join('\n') : '';

  return `<meta>
  <info name="ProjetoGerado" author="Figma Convert To Lua - SrTermax" version="1.0" type="script" />
  <script src="ProjetoGerado.lua" type="client" />${files}
</meta>`;
}

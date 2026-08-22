// Gerador de código Lua MTA a partir de nós Figma
import { NodeInfo, FillInfo, ColorInfo, ConversionConfig, ConversionResult } from './types';

// Mapeamento de fonts Figma → MTA nativas
// MTA possui: default, default-bold, clear, arial, sans, pricedown, bankgothic, diploma, beckett
const FONT_MAP: Record<string, string> = {
  'inter': 'default',
  'roboto': 'default',
  'open sans': 'default',
  'lato': 'default',
  'montserrat': 'default',
  'poppins': 'default',
  'nunito': 'default',
  'raleway': 'default',
  'work sans': 'default',
  'dm sans': 'default',
  'source sans': 'default',
  'noto sans': 'default',
  'ubuntu': 'default',
  'helvetica': 'default',
  'arial': 'arial',
  'sans-serif': 'default',
  'times': 'diploma',
  'georgia': 'diploma',
  'playfair': 'diploma',
  'merriweather': 'diploma',
  'serif': 'diploma',
  'fira code': 'default',
  'source code': 'default',
  'consolas': 'default',
  'monospace': 'default',
  'bebas neue': 'pricedown',
  'oswald': 'bankgothic',
  'condensed': 'bankgothic',
  'impact': 'bankgothic',
};

function mapFontToMTA(fontName: string): string {
  const lower = fontName.toLowerCase();
  if (FONT_MAP[lower]) return FONT_MAP[lower];
  for (const [key, value] of Object.entries(FONT_MAP)) {
    if (lower.includes(key)) return value;
  }
  if (lower.includes('bold') || lower.includes('black') || lower.includes('heavy')) return 'bankgothic';
  if (lower.includes('light') || lower.includes('thin')) return 'clear';
  return 'default';
}

function toInt(n: number): number { return Math.round(n); }

function toColor(color: ColorInfo | undefined, opacity: number = 1): string {
  if (!color) return '255, 255, 255, 255';
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round((color.a || 1) * opacity * 255);
  return `${r}, ${g}, ${b}, ${a}`;
}

function sanitizeFileName(name: string): string {
  let sanitized = name.replace(/\s/g, '_');
  sanitized = sanitized.replace(/[^\w\-.]/g, '');
  return sanitized;
}

function mapAlignH(align: string | undefined): string {
  switch (align) {
    case 'LEFT': return 'left';
    case 'CENTER': return 'center';
    case 'RIGHT': return 'right';
    default: return 'left';
  }
}

function mapAlignV(align: string | undefined): string {
  switch (align) {
    case 'TOP': return 'top';
    case 'CENTER': return 'center';
    case 'BOTTOM': return 'bottom';
    default: return 'top';
  }
}

export function extractNodeInfo(node: SceneNode): NodeInfo | null {
  if (!node.visible) return null;
  // Usar absoluteTransform quando disponível (posição absoluta no canvas, mais preciso para grupos)
  let absX = node.x;
  let absY = node.y;
  if ('absoluteTransform' in node && node.absoluteTransform) {
    absX = node.absoluteTransform[0][2];
    absY = node.absoluteTransform[1][2];
  }
  const info: NodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: absX,
    y: absY,
    width: node.width,
    height: node.height,
    visible: node.visible,
    fills: [],
    cornerRadius: 0,
    opacity: 1,
  };
  if ('fills' in node && Array.isArray(node.fills)) {
    const fills = node.fills as Paint[];
    for (const fill of fills) {
      if (fill.type === 'SOLID' && 'color' in fill) {
        const solidPaint = fill as SolidPaint;
        info.fills.push({
          type: 'SOLID',
          color: { r: solidPaint.color.r, g: solidPaint.color.g, b: solidPaint.color.b, a: solidPaint.opacity || 1 },
          opacity: solidPaint.opacity || 1,
          visible: solidPaint.visible !== false,
        });
      } else if (fill.type === 'IMAGE') {
        info.fills.push({ type: 'IMAGE', opacity: fill.opacity || 1, visible: fill.visible !== false });
      }
    }
  }
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') info.cornerRadius = node.cornerRadius;
  if ('opacity' in node && typeof node.opacity === 'number') info.opacity = node.opacity;
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

// Gera código Lua completo — adaptativo (centrado + escala proporcional)
export function generateLuaCode(
  nodes: NodeInfo[],
  config: ConversionConfig,
  imageNames: string[]
): string {
  const drawCalls: string[] = [];
  const addedCalls = new Set<string>();
  let requiresRounded = false;

  for (const node of nodes) {
    if (
      node.name.toLowerCase() === config.backgroundName.toLowerCase() ||
      node.name.toLowerCase() === 'background' ||
      node.name.toLowerCase() === 'background_image'
    ) continue;

    // TEXT
    if (node.type === 'TEXT') {
      const text = node.characters || node.name;
      let color = '255, 255, 255, 255';
      if (node.fills.length > 0 && node.fills[0].color) color = toColor(node.fills[0].color, node.fills[0].opacity);
      const fontMTA = node.fontName ? mapFontToMTA(node.fontName) : 'default';
      const alignH = mapAlignH(node.textAlignHorizontal);
      const alignV = mapAlignV(node.textAlignVertical);
      const escapedText = text.replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();
      const fontSize = node.fontSize ? Math.round(node.fontSize) : 12;
      const scale = fontSize / 24;
      const call = `dxDrawText("${escapedText}", ox + zoom*${toInt(node.x)}, oy + zoom*${toInt(node.y)}, ox + zoom*${toInt(node.x + node.width)}, oy + zoom*${toInt(node.y + node.height)}, tocolor(${color}), zoom*${scale.toFixed(2)}, "${fontMTA}", "${alignH}", "${alignV}", false, false, false, true, false)`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
      continue;
    }

    // IMAGE
    const imageFill = node.fills.find((f) => f.type === 'IMAGE');
    if (imageFill) {
      const safeName = sanitizeFileName(node.name);
      const call = `dxDrawImage(ox + zoom*${toInt(node.x)}, oy + zoom*${toInt(node.y)}, zoom*${toInt(node.width)}, zoom*${toInt(node.height)}, "assets/images/${safeName}.png", 0, 0, 0, tocolor(255, 255, 255, 255), false)`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
      continue;
    }

    // SHAPES (retângulos)
    if (node.fills.length === 0) continue;
    const fill = node.fills[0];
    if (!fill.visible || fill.type === 'NONE' || !fill.color) continue;
    const color = toColor(fill.color, fill.opacity);
    const radius = toInt(node.cornerRadius);
    if (radius > 0) {
      requiresRounded = true;
      const call = `dxDrawRoundedRectangle(ox + zoom*${toInt(node.x)}, oy + zoom*${toInt(node.y)}, zoom*${toInt(node.width)}, zoom*${toInt(node.height)}, tocolor(${color}), zoom*${radius})`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
    } else {
      const call = `dxDrawRectangle(ox + zoom*${toInt(node.x)}, oy + zoom*${toInt(node.y)}, zoom*${toInt(node.width)}, zoom*${toInt(node.height)}, tocolor(${color}))`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
    }
  }

  const luaLines: string[] = [];
  luaLines.push(
    '-- ========================================',
    '-- Conversor de Figma para Lua MTA',
    '-- Versão Beta Oficial - 22/08/2026',
    '-- Gerado automaticamente pelo plugin Figma Convert Lua',
    '-- ========================================',
    '',
    '-- Créditos: https://x.com/@SrTermax',
    '-- Agradecimento especial: SiiLVa & Baron_Scr',
    '',
    '-- NOTA: Eclipse não está disponível nessa versão.',
    '-- Vectory pode vir todo preto, ajuste conforme necessário.',
    '-- Se o seu projeto tiver imagens, certifique-se de que',
    '-- elas estão na pasta assets e exportadas no meta.xml.',
    '',
    '-- ========================================',
    '-- SISTEMA DE ESCALA ADAPTATIVA:',
    '-- Design: ' + config.resW + 'x' + config.resH,
    '-- zoom  = math.min(sW/resW, sH/resH)  (mantém proporções)',
    '-- ox,oy = offset para centralizar na tela',
    '-- Compatível com qualquer resolução do jogador.',
    '-- ========================================',
    '',
    ''
  );

  // Variáveis principais — adaptativa (aspect ratio preservado, centralizado)
  luaLines.push(
    'local sW, sH = guiGetScreenSize()',
    'local isOpen = true',
    `local resW, resH = ${config.resW}, ${config.resH}`,
    'local zoom = math.min(sW/resW, sH/resH)',
    'local ox = (sW - resW*zoom) / 2',
    'local oy = (sH - resH*zoom) / 2',
    ''
  );

  luaLines.push('function onClientRender_FigmaConvertMTA()');
  for (const call of drawCalls) luaLines.push('\t' + call);
  luaLines.push('end', '');

  luaLines.push(
    'if isOpen then',
    '\taddEventHandler("onClientPreRender", root, onClientRender_FigmaConvertMTA)',
    'end'
  );

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

export function extractUniqueFonts(nodes: NodeInfo[]): string[] {
  const uniqueFonts = new Set<string>();
  for (const node of nodes) if (node.type === 'TEXT' && node.fontName) uniqueFonts.add(node.fontName);
  return Array.from(uniqueFonts);
}

export function generateMetaXML(imageNames: string[], fontNames: string[] = []): string {
  const fileEntries: string[] = [];
  for (const name of imageNames) fileEntries.push(`  <file src="assets/images/${name}" />`);
  // Fonts: NÃO incluir TTFs inválidos; usuário adiciona manualmente se quiser dxCreateFont
  // Apenas documentar no meta.xml se quiser
  const files = fileEntries.length > 0 ? '\n' + fileEntries.join('\n') : '';
  return `<meta>
  <info name="ProjetoGerado" author="Figma Convert To Lua - SrTermax" version="1.0" type="script" />
  <script src="ProjetoGerado.lua" type="client" />${files}
</meta>`;
}

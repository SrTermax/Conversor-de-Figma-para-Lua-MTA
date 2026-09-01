import { NodeInfo, ColorInfo, ConversionConfig } from './types';

const FONT_CONFIG: Record<string, { mta: string; yScale: number }> = {
  'inter': { mta: 'default', yScale: 1.15 },
  'roboto': { mta: 'default', yScale: 1.15 },
  'open sans': { mta: 'default', yScale: 1.15 },
  'lato': { mta: 'default', yScale: 1.15 },
  'montserrat': { mta: 'default', yScale: 1.10 },
  'poppins': { mta: 'default', yScale: 1.10 },
  'nunito': { mta: 'default', yScale: 1.15 },
  'raleway': { mta: 'default', yScale: 1.10 },
  'work sans': { mta: 'default', yScale: 1.15 },
  'dm sans': { mta: 'default', yScale: 1.10 },
  'source sans': { mta: 'default', yScale: 1.15 },
  'noto sans': { mta: 'default', yScale: 1.15 },
  'ubuntu': { mta: 'default', yScale: 1.15 },
  'helvetica': { mta: 'default', yScale: 1.15 },
  'arial': { mta: 'arial', yScale: 1.20 },
  'sans-serif': { mta: 'default', yScale: 1.15 },
  'times': { mta: 'diploma', yScale: 1.05 },
  'georgia': { mta: 'diploma', yScale: 1.05 },
  'playfair': { mta: 'diploma', yScale: 1.05 },
  'merriweather': { mta: 'diploma', yScale: 1.05 },
  'serif': { mta: 'diploma', yScale: 1.05 },
  'fira code': { mta: 'default', yScale: 1.15 },
  'source code': { mta: 'default', yScale: 1.15 },
  'consolas': { mta: 'default', yScale: 1.15 },
  'monospace': { mta: 'default', yScale: 1.15 },
  'bebas neue': { mta: 'pricedown', yScale: 1.30 },
  'oswald': { mta: 'bankgothic', yScale: 1.25 },
  'condensed': { mta: 'bankgothic', yScale: 1.25 },
  'impact': { mta: 'bankgothic', yScale: 1.30 },
};

function getFontConfig(fontName: string): { mta: string; yScale: number } {
  const lower = fontName.toLowerCase();
  if (FONT_CONFIG[lower]) return FONT_CONFIG[lower];
  for (const [key, value] of Object.entries(FONT_CONFIG)) {
    if (lower.includes(key)) return value;
  }
  if (lower.includes('bold') || lower.includes('black') || lower.includes('heavy')) return { mta: 'bankgothic', yScale: 1.25 };
  if (lower.includes('light') || lower.includes('thin')) return { mta: 'clear', yScale: 1.15 };
  return { mta: 'default', yScale: 1.15 };
}

function toInt(n: number): number { return Math.round(n); }

function toHexByte(n: number): string {
  return Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0');
}

function bakeColor(color: ColorInfo, bg: ColorInfo): ColorInfo {
  const a = typeof color.a === 'number' ? color.a : 1;
  return {
    r: color.r * a + bg.r * (1 - a),
    g: color.g * a + bg.g * (1 - a),
    b: color.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function toColor(color: ColorInfo | undefined, opacity: number = 1): string {
  if (!color) return '255, 255, 255, 255';
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round((typeof color.a === 'number' ? color.a : 1) * (typeof opacity === 'number' ? opacity : 1) * 255);
  return `${r}, ${g}, ${b}, ${a}`;
}

export function sanitizeFileName(name: string): string {
  let sanitized = name.replace(/\s/g, '_');
  sanitized = sanitized.replace(/[^\w\-.]/g, '');
  return sanitized;
}

export function isShapeNode(node: NodeInfo): boolean {
  return (
    node.type === 'VECTOR' ||
    node.type === 'ELLIPSE' ||
    node.type === 'POLYGON' ||
    node.type === 'STAR' ||
    node.type === 'LINE'
  );
}

export function needsImageExport(node: NodeInfo): boolean {
  return !!(
    node.fills.some((f) => f.type === 'IMAGE') ||
    (node.hasGradient && !node.hasChildren && node.type !== 'TEXT') ||
    (isShapeNode(node) && (node.hasFill || node.hasStroke)) ||
    (node.type === 'RECTANGLE' && node.hasStroke && node.fills.length === 0)
  );
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

function computeDrawRect(
  node: SceneNode,
  fallbackX: number,
  fallbackY: number
): { x: number; y: number; w: number; h: number } {
  const w = node.width;
  const h = node.height;
  if ('absoluteTransform' in node && node.absoluteTransform) {
    const m = node.absoluteTransform;
    const a = m[0][0], c = m[0][1], e = m[0][2];
    const b = m[1][0], d = m[1][1], f = m[1][2];
    const xs = [e, e + a * w, e + c * h, e + a * w + c * h];
    const ys = [f, f + b * w, f + d * h, f + b * w + d * h];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  return { x: fallbackX, y: fallbackY, w, h };
}

export function extractNodeInfo(node: SceneNode): NodeInfo | null {
  if (!node.visible) return null;
  let absX = node.x;
  let absY = node.y;
  let transformScale = 1;
  if ('absoluteTransform' in node && node.absoluteTransform) {
    absX = node.absoluteTransform[0][2];
    absY = node.absoluteTransform[1][2];
    transformScale = Math.hypot(node.absoluteTransform[0][0], node.absoluteTransform[1][0]);
  }
  const drawRect = computeDrawRect(node, absX, absY);
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
    imgX: drawRect.x,
    imgY: drawRect.y,
    imgW: drawRect.w,
    imgH: drawRect.h,
    transformScale,
  };
  if ('children' in node) {
    info.hasChildren = (node as ChildrenMixin).children.length > 0;
  }
  if ('fills' in node && Array.isArray(node.fills)) {
    const fills = node.fills as Paint[];
    info.hasFill = fills.some((f) => f.visible !== false && (f as { type: string }).type !== 'NONE');
    for (const fill of fills) {
      if (fill.type === 'SOLID' && 'color' in fill) {
        const solidPaint = fill as SolidPaint;
        const fillOpacity = typeof solidPaint.opacity === 'number' ? solidPaint.opacity : 1;
        info.fills.push({
          type: 'SOLID',
          color: { r: solidPaint.color.r, g: solidPaint.color.g, b: solidPaint.color.b, a: fillOpacity },
          opacity: fillOpacity,
          visible: solidPaint.visible !== false,
        });
      } else if (fill.type === 'IMAGE') {
        info.fills.push({
          type: 'IMAGE',
          opacity: typeof fill.opacity === 'number' ? fill.opacity : 1,
          visible: fill.visible !== false,
        });
      } else if (fill.visible !== false && (fill as { type: string }).type !== 'NONE') {
        info.hasGradient = true;
        if (
          info.hasChildren &&
          'gradientStops' in fill &&
          Array.isArray((fill as GradientPaint).gradientStops) &&
          (fill as GradientPaint).gradientStops.length > 0
        ) {
          const stop = (fill as GradientPaint).gradientStops[0].color;
          const fillOpacity = typeof fill.opacity === 'number' ? fill.opacity : 1;
          info.fills.push({
            type: 'SOLID',
            color: { r: stop.r, g: stop.g, b: stop.b, a: fillOpacity },
            opacity: fillOpacity,
            visible: true,
          });
        }
      }
    }
  }
  if ('strokes' in node && Array.isArray(node.strokes)) {
    const strokes = node.strokes as Paint[];
    info.hasStroke = strokes.some((s) => s.visible !== false && (s as { type: string }).type !== 'NONE');
  }
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') info.cornerRadius = node.cornerRadius;
  if ('opacity' in node && typeof node.opacity === 'number') info.opacity = node.opacity;
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    info.characters = textNode.characters;
    if (typeof textNode.fontSize === 'number') {
      info.fontSize = textNode.fontSize;
    } else {
      const lineCount = info.characters ? info.characters.split('\n').length : 1;
      info.fontSize = Math.max(1, Math.round(info.height / lineCount / 1.2));
    }
    if (typeof textNode.fontName === 'object' && textNode.fontName !== null) {
      info.fontName = textNode.fontName.family;
    }
    if (typeof textNode.textAlignHorizontal === 'string') info.textAlignHorizontal = textNode.textAlignHorizontal;
    if (typeof textNode.textAlignVertical === 'string') info.textAlignVertical = textNode.textAlignVertical;
    if (typeof textNode.getStyledTextSegments === 'function') {
      try {
        const segments = textNode.getStyledTextSegments(['fills']);
        if (segments.length > 1) {
          let coded = '';
          for (const seg of segments) {
            const fill = seg.fills.find((f) => f.type === 'SOLID' && f.visible !== false && 'color' in f);
            if (fill && 'color' in fill) {
              const solidFill = fill as SolidPaint;
              coded += `#${toHexByte(solidFill.color.r)}${toHexByte(solidFill.color.g)}${toHexByte(solidFill.color.b)}${seg.characters}`;
            } else {
              coded += seg.characters;
            }
          }
          if (coded) info.characters = coded;
        }
      } catch (_e) {
        return info;
      }
    }
  }
  return info;
}

export function generateLuaCode(
  nodes: NodeInfo[],
  config: ConversionConfig,
  imageFiles: Map<string, string>
): string {
  const drawCalls: string[] = [];
  const addedCalls = new Set<string>();
  let requiresRounded = false;

  for (const node of nodes) {
    if (config.backgroundId && node.id === config.backgroundId) continue;

    if (node.type === 'TEXT') {
      const text = node.characters || node.name;
      let color = '255, 255, 255, 255';
      if (node.fills.length > 0 && node.fills[0].color) color = toColor(node.fills[0].color, node.opacity);
      const fontConfig = node.fontName ? getFontConfig(node.fontName) : { mta: 'default', yScale: 1.15 };
      const alignH = mapAlignH(node.textAlignHorizontal);
      const alignV = mapAlignV(node.textAlignVertical);
      const escapedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
        .replace(/\n/g, '\\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/"/g, '\\"');
      const textScale = node.transformScale || 1;
      const fontSize = Math.round((typeof node.fontSize === 'number' ? node.fontSize : 12) * textScale);
      const scale = (fontSize / 16) * fontConfig.yScale;
      const yOffset = Math.round((fontSize * (fontConfig.yScale - 1)) / 2);
      const tx = node.imgX !== undefined ? node.imgX : node.x;
      const ty = node.imgY !== undefined ? node.imgY : node.y;
      const tw = node.imgW !== undefined ? node.imgW : node.width;
      const th = node.imgH !== undefined ? node.imgH : node.height;
      const call = `dxDrawText("${escapedText}", ox + zoom*${toInt(tx)}, oy + zoom*${toInt(ty - yOffset)}, ox + zoom*${toInt(tx + tw)}, oy + zoom*${toInt(ty + th - yOffset)}, tocolor(${color}), zoom*${scale.toFixed(2)}, "${fontConfig.mta}", "${alignH}", "${alignV}", false, false, true, true, false)`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
      continue;
    }

    if (needsImageExport(node)) {
      const fileName = imageFiles.get(node.id) || (sanitizeFileName(node.name) + '.png');
      const ix = node.imgX !== undefined ? node.imgX : node.x;
      const iy = node.imgY !== undefined ? node.imgY : node.y;
      const iw = node.imgW !== undefined ? node.imgW : node.width;
      const ih = node.imgH !== undefined ? node.imgH : node.height;
      const call = `dxDrawImage(ox + zoom*${toInt(ix)}, oy + zoom*${toInt(iy)}, zoom*${toInt(iw)}, zoom*${toInt(ih)}, "assets/images/${fileName}", 0, 0, 0, tocolor(255, 255, 255, 255), true)`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
      continue;
    }

    if (node.fills.length === 0) continue;
    const fill = node.fills[0];
    if (!fill.visible || fill.type === 'NONE' || !fill.color) continue;
    let fillColor = fill.color;
    if (config.backgroundColor && typeof fillColor.a === 'number' && fillColor.a > 0 && fillColor.a < 1) {
      fillColor = bakeColor(fillColor, config.backgroundColor);
    }
    const color = toColor(fillColor, node.opacity);
    const rx = node.imgX !== undefined ? node.imgX : node.x;
    const ry = node.imgY !== undefined ? node.imgY : node.y;
    const rw = node.imgW !== undefined ? node.imgW : node.width;
    const rh = node.imgH !== undefined ? node.imgH : node.height;
    const radius = Math.round((node.cornerRadius || 0) * (node.transformScale || 1));
    if (radius > 0) {
      requiresRounded = true;
      const call = `dxDrawRoundedRectangle(ox + zoom*${toInt(rx)}, oy + zoom*${toInt(ry)}, zoom*${toInt(rw)}, zoom*${toInt(rh)}, tocolor(${color}), zoom*${radius})`;
      if (!addedCalls.has(call)) { drawCalls.push(call); addedCalls.add(call); }
    } else {
      const call = `dxDrawRectangle(ox + zoom*${toInt(rx)}, oy + zoom*${toInt(ry)}, zoom*${toInt(rw)}, zoom*${toInt(rh)}, tocolor(${color}), true)`;
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
      '\t\tdxDrawRectangle(x, y, w, h, color, true)',
      '\t\tdxDrawRectangle(x, y - radius, w, radius, color, true)',
      '\t\tdxDrawRectangle(x, y + h, w, radius, color, true)',
      '\t\tdxDrawRectangle(x - radius, y, radius, h, color, true)',
      '\t\tdxDrawRectangle(x + w, y, radius, h, color, true)',
      '\t\tdxDrawCircle(x, y, radius, 180, 270, color, color, 7, 1, true)',
      '\t\tdxDrawCircle(x + w, y, radius, 270, 360, color, color, 7, 1, true)',
      '\t\tdxDrawCircle(x + w, y + h, radius, 0, 90, color, color, 7, 1, true)',
      '\t\tdxDrawCircle(x, y + h, radius, 90, 180, color, color, 7, 1, true)',
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

export function generateMetaXML(imageNames: string[], _fontNames: string[] = []): string {
  const fileEntries: string[] = [];
  for (const name of imageNames) fileEntries.push(`  <file src="assets/images/${name}" />`);
  const files = fileEntries.length > 0 ? '\n' + fileEntries.join('\n') : '';
  return `<meta>
  <info name="ProjetoGerado" author="Figma Convert To Lua - SrTermax" version="1.0" type="script" />
  <script src="ProjetoGerado.lua" type="client" />${files}
</meta>`;
}
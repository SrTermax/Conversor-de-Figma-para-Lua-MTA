import { extractNodeInfo, generateLuaCode, generateMetaXML, extractUniqueFonts, needsImageExport, sanitizeFileName } from './lua-generator';
import { NodeInfo, ConversionConfig, ColorInfo } from './types';

figma.showUI(__html__, { width: 400, height: 600, themeColors: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'convert') {
    await convertSelection(msg.backgroundName || 'Background');
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

async function convertSelection(backgroundName: string) {
  let selection = figma.currentPage.selection;

  if (selection.length === 0) {
    const allNodes: SceneNode[] = [];
    for (const child of figma.currentPage.children) {
      allNodes.push(child);
    }
    selection = allNodes;
  }

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Nenhum nó encontrado na página.',
    });
    return;
  }

  try {
    const background = findRealBackground(selection, backgroundName);

    let resW = 1920;
    let resH = 1080;
    if (background && 'width' in background && 'height' in background) {
      resW = Math.round(background.width);
      resH = Math.round(background.height);
    } else {
      const largest = findLargestNode(selection);
      if (largest) {
        resW = Math.round(largest.width);
        resH = Math.round(largest.height);
      }
    }

    const allNodes: NodeInfo[] = [];
    const visited = new Set<string>();
    for (const node of selection) {
      collectNodes(node, background, allNodes, visited);
    }

    const config: ConversionConfig = {
      backgroundName,
      backgroundId: background ? background.id : undefined,
      backgroundColor: extractBackgroundColor(background),
      resW,
      resH,
    };

    const imageNodes = allNodes.filter((n) => needsImageExport(n));

    const imageFileMap = new Map<string, string>();
    const usedNames = new Set<string>();
    for (const n of imageNodes) {
      const base = sanitizeFileName(n.name) || 'imagem';
      let fileName = base;
      let counter = 2;
      while (usedNames.has(fileName)) {
        fileName = `${base}_${counter}`;
        counter++;
      }
      usedNames.add(fileName);
      imageFileMap.set(n.id, `${fileName}.png`);
    }
    const imageNames = imageNodes.map((n) => imageFileMap.get(n.id)!);

    const fontNames = extractUniqueFonts(allNodes);

    const luaCode = generateLuaCode(allNodes, config, imageFileMap);
    const metaXML = generateMetaXML(imageNames, fontNames);

    if (imageNodes.length > 0) {
      const images: { name: string; data: Uint8Array }[] = [];

      for (const nodeInfo of imageNodes) {
        const figmaNode = await figma.getNodeByIdAsync(nodeInfo.id);
        const fileName = imageFileMap.get(nodeInfo.id);
        if (figmaNode && fileName && 'exportAsync' in figmaNode) {
          const exporter = figmaNode as unknown as {
            exportAsync(settings: ExportSettingsImage): Promise<Uint8Array>;
          };
          const maxDim = Math.max(nodeInfo.imgW ?? nodeInfo.width, nodeInfo.imgH ?? nodeInfo.height);
          const exportScale = nodeInfo.width < 256 && nodeInfo.height < 256 && maxDim <= 2048 ? 2 : 1;
          let imageData: Uint8Array | undefined;
          try {
            const exportSettings: ExportSettingsImage = { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: exportScale } };
            imageData = await exporter.exportAsync(exportSettings);
          } catch (e) {
            console.error(`Erro ao exportar ${nodeInfo.name} em ${exportScale}x:`, e);
          }
          if (!imageData && exportScale > 1) {
            try {
              const retrySettings: ExportSettingsImage = { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } };
              imageData = await exporter.exportAsync(retrySettings);
            } catch (e2) {
              console.error(`Erro ao exportar ${nodeInfo.name} em 1x:`, e2);
            }
          }
          if (imageData) {
            images.push({
              name: fileName,
              data: imageData,
            });
          } else {
            console.error(`Não foi possível exportar a imagem ${nodeInfo.name}`);
          }
        }
      }

      if (images.length > 0) {
        figma.ui.postMessage({
          type: 'images',
          images: images.map((img) => ({
            name: img.name,
            data: Array.from(img.data),
          })),
        });
      }
    }

    figma.ui.postMessage({
      type: 'result',
      luaCode,
      metaXML,
      imageCount: imageNodes.length,
      nodeCount: allNodes.length,
      resolution: `${resW}x${resH}`,
      fonts: fontNames,
    });

    figma.notify(`Conversão concluída! ${allNodes.length} nós processados.`, {
      timeout: 3000,
    });
  } catch (e) {
    figma.ui.postMessage({
      type: 'error',
      message: `Erro na conversão: ${(e as Error).message}`,
    });
  }
}

function isBackgroundName(name: string, backgroundName: string): boolean {
  const lower = name.toLowerCase().trim();
  const target = backgroundName.toLowerCase().trim();
  return lower === target || lower === 'background';
}

function findRealBackground(selection: readonly SceneNode[], backgroundName: string): SceneNode | null {
  const candidates: SceneNode[] = [];
  const visited = new Set<string>();

  function walk(node: SceneNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    if (isBackgroundName(node.name, backgroundName)) {
      candidates.push(node);
    }
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) {
        walk(child as SceneNode);
      }
    }
  }

  for (const node of selection) walk(node);

  let realBackground: SceneNode | null = null;
  for (const cand of candidates) {
    if (!cand.visible) continue;
    if (!('width' in cand) || !('height' in cand)) continue;
    if (cand.width <= 0 || cand.height <= 0) continue;
    if (!realBackground || cand.width * cand.height > realBackground.width * realBackground.height) {
      realBackground = cand;
    }
  }
  return realBackground;
}

function extractBackgroundColor(node: SceneNode | null): ColorInfo | undefined {
  if (!node || !('fills' in node) || !Array.isArray(node.fills)) return undefined;
  const fills = node.fills as Paint[];
  for (const fill of fills) {
    if (fill.visible !== false && fill.type === 'SOLID' && 'color' in fill) {
      return { r: fill.color.r, g: fill.color.g, b: fill.color.b, a: 1 };
    }
  }
  return undefined;
}

function findLargestNode(selection: readonly SceneNode[]): SceneNode | null {
  let largest: SceneNode | null = null;
  for (const node of selection) {
    if (!node.visible) continue;
    if (!('width' in node) || !('height' in node)) continue;
    if (node.width <= 0 || node.height <= 0) continue;
    if (!largest || node.width * node.height > largest.width * largest.height) {
      largest = node;
    }
  }
  return largest;
}

function collectNodes(
  node: SceneNode,
  background: SceneNode | null,
  allNodes: NodeInfo[],
  visited: Set<string>
): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  if (background && node.id === background.id) {
    if ('children' in node) {
      for (const child of (node as ChildrenMixin).children) {
        collectNodes(child as SceneNode, background, allNodes, visited);
      }
    }
    return;
  }

  const info = extractNodeInfo(node);
  if (info) {
    const isContainer = ('children' in node) && info.fills.length === 0 && !info.hasGradient && info.type !== 'TEXT';
    if (!isContainer) {
      allNodes.push(info);
    }
  }

  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      collectNodes(child as SceneNode, background, allNodes, visited);
    }
  }
}
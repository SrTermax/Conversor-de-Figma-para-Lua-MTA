// Entry point do plugin Conversor de Figma para Lua MTA
import { extractNodeInfo, generateLuaCode, generateMetaXML, extractUniqueFonts } from './lua-generator';
import { NodeInfo, ConversionConfig, ConversionResult } from './types';

// Mostrar UI do plugin
figma.showUI(__html__, { width: 400, height: 600, themeColors: true });

// Escutar mensagens da UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'convert') {
    await convertSelection(msg.backgroundName || 'Background');
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Função principal de conversão
async function convertSelection(backgroundName: string) {
  let selection = figma.currentPage.selection;

  // Se nada selecionado, selecionar tudo automaticamente
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
    // Coletar todos os nós
    const allNodes: NodeInfo[] = [];
    let resW = 1920;
    let resH = 1080;
    let backgroundFound = false;

    // Percorrer seleção recursivamente
    for (const node of selection) {
      processNode(node, allNodes, backgroundName, (w, h) => {
        resW = w;
        resH = h;
        backgroundFound = true;
      });
    }

    if (!backgroundFound) {
      // Usar dimensões do primeiro frame selecionado
      const firstFrame = selection[0];
      if ('width' in firstFrame && 'height' in firstFrame) {
        resW = Math.round(firstFrame.width);
        resH = Math.round(firstFrame.height);
      }
    }

    // Configuração de conversão
    const config: ConversionConfig = {
      backgroundName,
      resW,
      resH,
    };

    // Coletar imagens para exportar
    const imageNodes = allNodes.filter((n) =>
      n.fills.some((f) => f.type === 'IMAGE')
    );

    // Gerar código Lua
    const imageNames = imageNodes.map((n) => {
      const safeName = n.name.replace(/\s/g, '_').replace(/[^\w\-.]/g, '');
      return `${safeName}.png`;
    });

    const fontNames = extractUniqueFonts(allNodes);

    const luaCode = generateLuaCode(allNodes, config, imageNames);
    const metaXML = generateMetaXML(imageNames, fontNames);

    // Exportar imagens PRIMEIRO (antes de enviar resultado)
    if (imageNodes.length > 0) {
      const images: { name: string; data: Uint8Array }[] = [];

      for (const nodeInfo of imageNodes) {
        const figmaNode = await figma.getNodeByIdAsync(nodeInfo.id);
        if (figmaNode && 'exportAsync' in figmaNode) {
          try {
            const exportSettings: ExportSettingsImage = { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } };
            const imageData = await (figmaNode as any).exportAsync(exportSettings);
            const safeName = nodeInfo.name.replace(/\s/g, '_').replace(/[^\w\-.]/g, '');
            images.push({
              name: `${safeName}.png`,
              data: imageData,
            });
          } catch (e) {
            console.error(`Erro ao exportar imagem ${nodeInfo.name}:`, e);
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

    // Enviar resultado para UI (depois das imagens)
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

// Função recursiva para processar nós
function processNode(
  node: SceneNode,
  allNodes: NodeInfo[],
  backgroundName: string,
  onBackground: (w: number, h: number) => void
): void {
  // Verificar se é o Background
  if (
    node.name.toLowerCase() === backgroundName.toLowerCase() ||
    node.name.toLowerCase() === 'background'
  ) {
    if ('width' in node && 'height' in node) {
      onBackground(Math.round(node.width), Math.round(node.height));
    }
    return; // Não adicionar Background à lista
  }

  // Processar filhos primeiro (profundidade)
  if ('children' in node) {
    const container = node as ChildrenMixin;
    for (const child of container.children) {
      processNode(child as SceneNode, allNodes, backgroundName, onBackground);
    }
  }

  // Extrair informações do nó após processar filhos
  const info = extractNodeInfo(node);
  if (info) {
    // Não adicionar containers vazios (frames/groups sem fill)
    const isContainer = ('children' in node) && info.fills.length === 0 && info.type !== 'TEXT';
    if (!isContainer) {
      allNodes.push(info);
    }
  }
}

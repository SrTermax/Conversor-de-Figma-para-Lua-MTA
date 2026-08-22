// Entry point do plugin Conversor de Figma para Lua MTA
import { extractNodeInfo, generateLuaCode, generateMetaXML } from './lua-generator';
// Mostrar UI do plugin
figma.showUI(__html__, { width: 400, height: 600, themeColors: true });
// Escutar mensagens da UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'convert') {
        await convertSelection(msg.backgroundName || 'Background');
    }
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
// Função principal de conversão
async function convertSelection(backgroundName) {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({
            type: 'error',
            message: 'Nenhum nó selecionado. Selecione um ou mais frames para converter.',
        });
        return;
    }
    try {
        // Coletar todos os nós
        const allNodes = [];
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
        const config = {
            backgroundName,
            resW,
            resH,
        };
        // Coletar imagens para exportar
        const imageNodes = allNodes.filter((n) => n.fills.some((f) => f.type === 'IMAGE'));
        // Gerar código Lua
        const imageNames = imageNodes.map((n) => {
            const safeName = n.name.replace(/\s/g, '_').replace(/[^\w\-.]/g, '');
            return `${safeName}.png`;
        });
        const luaCode = generateLuaCode(allNodes, config, imageNames);
        const metaXML = generateMetaXML(imageNames);
        // Enviar resultado para UI
        figma.ui.postMessage({
            type: 'result',
            luaCode,
            metaXML,
            imageCount: imageNodes.length,
            nodeCount: allNodes.length,
            resolution: `${resW}x${resH}`,
        });
        // Exportar imagens se houver
        if (imageNodes.length > 0) {
            const images = [];
            for (const nodeInfo of imageNodes) {
                const figmaNode = figma.getNodeById(nodeInfo.id);
                if (figmaNode && 'exportAsync' in figmaNode) {
                    try {
                        const exportSettings = { format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } };
                        const imageData = await figmaNode.exportAsync(exportSettings);
                        const safeName = nodeInfo.name.replace(/\s/g, '_').replace(/[^\w\-.]/g, '');
                        images.push({
                            name: `${safeName}.png`,
                            data: imageData,
                        });
                    }
                    catch (e) {
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
        figma.notify(`Conversão concluída! ${allNodes.length} nós processados.`, {
            timeout: 3000,
        });
    }
    catch (e) {
        figma.ui.postMessage({
            type: 'error',
            message: `Erro na conversão: ${e.message}`,
        });
    }
}
// Função recursiva para processar nós
function processNode(node, allNodes, backgroundName, onBackground) {
    // Verificar se é o Background
    if (node.name.toLowerCase() === backgroundName.toLowerCase() ||
        node.name.toLowerCase() === 'background') {
        if ('width' in node && 'height' in node) {
            onBackground(Math.round(node.width), Math.round(node.height));
        }
        return; // Não adicionar Background à lista
    }
    // Extrair informações do nó
    const info = extractNodeInfo(node);
    if (info) {
        allNodes.push(info);
    }
    // Processar filhos se for um container
    if ('children' in node) {
        const container = node;
        for (const child of container.children) {
            if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'COMPONENT' || child.type === 'INSTANCE') {
                processNode(child, allNodes, backgroundName, onBackground);
            }
            else {
                const childInfo = extractNodeInfo(child);
                if (childInfo) {
                    allNodes.push(childInfo);
                }
            }
        }
    }
}

// Interfaces para o Conversor de Figma para Lua MTA

export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  fills: FillInfo[];
  cornerRadius: number;
  characters?: string;
  fontSize?: number;
  fontName?: string;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  opacity: number;
  hasFill?: boolean;
  hasStroke?: boolean;
  hasGradient?: boolean;
  hasChildren?: boolean;
  imgX?: number;
  imgY?: number;
  imgW?: number;
  imgH?: number;
  transformScale?: number;
  effects?: EffectInfo[];
}

export interface FillInfo {
  type: string;
  color?: ColorInfo;
  opacity: number;
  visible: boolean;
  imageRef?: string;
}

export interface ColorInfo {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface EffectInfo {
  type: string;
  radius: number;
  visible: boolean;
}

export interface ConversionConfig {
  backgroundName: string;
  backgroundId?: string;
  backgroundColor?: ColorInfo;
  resW: number;
  resH: number;
}

export interface ConversionResult {
  luaCode: string;
  metaXML: string;
  imageNodes: NodeInfo[];
}

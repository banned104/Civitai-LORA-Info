import axios from "axios";
import type { LoraModel } from './lora_api_types';

const CIVITAI_API_BASE = "https://civitai.com/api/v1/models";

/**
 * 给定一个 civitai 链接，提取模型 ID
 */
function extractModelId(modelUrl: string): number | null {
  try {
    const url = new URL(modelUrl);
    const pathParts = url.pathname.split('/');
    // 寻找路径中 'models' 后面的部分
    const modelsIndex = pathParts.findIndex(part => part === 'models');
    if (modelsIndex !== -1 && pathParts.length > modelsIndex + 1) {
      const id = parseInt(pathParts[modelsIndex + 1], 10);
      return isNaN(id) ? null : id;
    }
    return null;
  } catch (err) {
    console.error("❌ URL 解析失败:", err);
    return null;
  }
}

/**
 * 获取模型详情和示例图片
 */
export async function getLoraModelInfo(modelUrl: string): Promise<LoraModel | null> {
    const modelId = extractModelId(modelUrl);
    if (!modelId) {
        console.error("❌ 无法提取模型 ID");
        return null;
    }

    console.log(`🔍 获取模型 ID: ${modelId}`);

    try {
        const modelResp = await axios.get<LoraModel>(`${CIVITAI_API_BASE}/${modelId}`);
        return modelResp.data;
    } catch (err: any) {
        console.error("❌ 获取模型信息失败:", err?.response?.data || err.message);
        return null;
    }
}

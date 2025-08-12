import axios from "axios";
import type { LoraModel } from './lora_api_types';

const CIVITAI_API_BASE = "https://civitai.com/api/v1/models";

// 配置 axios 默认设置
axios.defaults.timeout = 30000; // 30秒超时
axios.defaults.headers.common['Accept'] = 'application/json';

// 添加请求拦截器以便调试
axios.interceptors.request.use(
  (config) => {
    console.log(`🌐 发送请求到: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    console.log(`✅ 收到响应从: ${response.config.url}, 状态: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('响应拦截器错误:', error);
    return Promise.reject(error);
  }
);

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
    console.log(`🔍 开始处理模型URL: ${modelUrl}`);
    
    const modelId = extractModelId(modelUrl);
    if (!modelId) {
        console.error("❌ 无法提取模型 ID from URL:", modelUrl);
        return null;
    }

    console.log(`🔍 获取模型 ID: ${modelId}`);

    try {
        const apiUrl = `${CIVITAI_API_BASE}/${modelId}`;
        console.log(`🌐 请求API: ${apiUrl}`);
        
        const modelResp = await axios.get<LoraModel>(apiUrl);
        
        console.log(`✅ 成功获取模型数据:`, modelResp.data);
        return modelResp.data;
    } catch (err: any) {
        console.error("❌ 获取模型信息失败:");
        console.error("URL:", modelUrl);
        console.error("API URL:", `${CIVITAI_API_BASE}/${modelId}`);
        
        if (err.response) {
            console.error("响应状态:", err.response.status);
            console.error("响应数据:", err.response.data);
        } else if (err.request) {
            console.error("网络请求失败:", err.request);
        } else {
            console.error("请求配置错误:", err.message);
        }
        
        return null;
    }
}

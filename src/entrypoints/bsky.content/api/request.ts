import axios, { AxiosError, AxiosPromise, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { sendMessage } from "@/utils/messaging";

// 自定义适配器：通过后台脚本发起请求，绕过跨域限制
const adapter = async (config: InternalAxiosRequestConfig): AxiosPromise => {
    // 1. 构建标准 Headers 对象，避免 AxiosHeaders 实例序列化问题
    const headers: Record<string, string> = {};
    if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
                headers[key] = value;
            }
        });
    }

    // 2. 构建请求参数
    const requestData = {
        method: (config.method ?? "GET").toUpperCase(),
        headers: headers,
        body: config.data,
        url: axios.getUri(config), // 获取包含查询参数的完整 URL
    };

    try {
        // 3. 发送消息给 background
        const responseData = await sendMessage("fetch", requestData);
        
        // 4. 检查返回数据
        if (!responseData) {
            throw new Error("网络请求返回为空，请检查网络连接");
        }

        // Bluesky API 错误通常包含 error 字段
        if (responseData.error) {
            throw new Error(responseData.message || responseData.error);
        }

        return {
            data: responseData,
            status: 200,
            statusText: "OK",
            headers: {},
            config
        };
    } catch (e: any) {
        console.error("Bluesky API Request Error:", e);
        throw new AxiosError(e.message || "请求失败", "ERR_NETWORK", config, null, null);
    }
};

const request = axios.create({
    baseURL: "https://public.api.bsky.app/xrpc",
    timeout: 20000, // 增加超时时间
    adapter 
});

request.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error) => {
        // 提取更详细的错误信息
        const msg = error.response?.data?.message || error.message || "未知错误";
        console.error("API Error Detail:", msg);
        return Promise.reject(new Error(msg));
    }
);

export default request;
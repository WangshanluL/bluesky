import axios, { AxiosError, AxiosHeaders, AxiosPromise, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { sendMessage } from "@/utils/messaging";

// 1. 复用项目中其他模块的适配器逻辑，通过 background/content script 通讯发起请求
const adapter = async (config: InternalAxiosRequestConfig): AxiosPromise => {
    const init: RequestInit = {
        method: (config.method ?? "GET").toUpperCase(),
        headers: AxiosHeaders.from(config.headers).normalize(true),
        body: config.data
    };
    // 调用后台的 fetch 能力
    const data = await sendMessage("fetch", {
        ...init,
        url: axios.getUri(config),
    });
    if (!data) {
        throw new AxiosError('请求失败')
    }
    return { data, status: 200, statusText: "OK", headers: {}, config };
};

// 2. 配置 Bluesky 公共 API
const request = axios.create({
    baseURL: "https://public.api.bsky.app/xrpc",
    timeout: 10000,
    adapter // 使用自定义适配器
});

request.interceptors.response.use((response: AxiosResponse) => response.data);

export default request;
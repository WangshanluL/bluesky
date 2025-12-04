import { split } from "lodash";

export type ParseAuthorUrlResult = {
    handle: string;
    href: string;
}

export async function parseAuthorUrl(url: URL): Promise<ParseAuthorUrlResult> {
    // 兼容格式: 
    // https://bsky.app/profile/{handle}
    // https://bsky.app/profile/{handle}/
    // https://bsky.app/profile/{handle}/likes (即使在子页面也能识别)
    
    const parts = split(url.pathname, "/").filter(p => !!p);
    
    // parts[0] 应该是 'profile'
    // parts[1] 是 handle
    if (parts.length >= 2 && parts[0] === 'profile') {
        return {
            handle: parts[1],
            href: url.href
        };
    }
    
    // 如果不在 profile 路径下，尝试解析是否是 staging 环境或其他，暂时只支持标准路径
    throw new Error(`无效的 Bluesky 用户链接: ${url.href}。请确保链接包含 /profile/用户名`);
}
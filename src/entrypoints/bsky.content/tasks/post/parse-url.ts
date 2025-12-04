import { split } from "lodash";

export type ParseUrlResult = {
    handle: string;
    rkey: string;
    href: string;
}

export async function parseUrl(url: URL): Promise<ParseUrlResult> {
    // 匹配格式: https://bsky.app/profile/{handle}/post/{rkey}
    const parts = split(url.pathname, "/").filter(p => !!p);
    if (parts.length >= 3 && parts[0] === 'profile' && parts[2] === 'post') {
        return {
            handle: parts[1],
            rkey: parts[3],
            href: url.href
        };
    }
    throw new Error(`无效的 Bluesky 链接: ${url.href}`);
}
import request from "./request";

// 获取帖子详情
export function getPostThread(uri: string) {
    return request.get("app.bsky.feed.getPostThread", {
        params: {
            uri: uri,
            depth: 0
        }
    });
}

// 解析 Handle
export function resolveHandle(handle: string) {
    return request.get("com.atproto.identity.resolveHandle", {
        params: { handle }
    });
}

// 获取用户发帖列表
export function getAuthorFeed(params: { actor: string; limit?: number; cursor?: string }) {
    return request.get("app.bsky.feed.getAuthorFeed", {
        params: {
            limit: 100,
            filter: 'posts_with_replies', // 包含回复
            ...params
        }
    });
}
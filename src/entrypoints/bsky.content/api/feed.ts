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

// 解析 Handle (用户名) 为 DID
export function resolveHandle(handle: string) {
    return request.get("com.atproto.identity.resolveHandle", {
        params: { handle }
    });
}
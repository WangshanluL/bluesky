import request from "./request";

// 务必确保这里有 depth 和 parentHeight 参数
export function getPostThread(uri: string, depth: number = 100, parentHeight: number = 0) {
    return request.get("app.bsky.feed.getPostThread", {
        params: {
            uri: uri,
            depth: depth, 
            parentHeight: parentHeight
        }
    });
}

export function resolveHandle(handle: string) {
    return request.get("com.atproto.identity.resolveHandle", {
        params: { handle }
    });
}

export function getAuthorFeed(params: { actor: string; limit?: number; cursor?: string }) {
    return request.get("app.bsky.feed.getAuthorFeed", {
        params: {
            limit: 100,
            filter: 'posts_with_replies',
            ...params
        }
    });
}
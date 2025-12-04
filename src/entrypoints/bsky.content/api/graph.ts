import request from "./request";

// 获取粉丝列表
export function getFollowers(params: { actor: string; limit?: number; cursor?: string }) {
    return request.get("app.bsky.graph.getFollowers", {
        params: {
            limit: 100,
            ...params
        }
    });
}

// 获取关注列表
export function getFollows(params: { actor: string; limit?: number; cursor?: string }) {
    return request.get("app.bsky.graph.getFollows", {
        params: {
            limit: 100,
            ...params
        }
    });
}
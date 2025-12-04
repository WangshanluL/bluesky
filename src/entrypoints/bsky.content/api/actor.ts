import request from "./request";

export function getProfile(params: { actor: string }) {
    return request.get("app.bsky.actor.getProfile", {
        params
    });
}
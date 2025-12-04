import { Button } from "@/components/ui/button";
import { defineSocialMediaCopilotUi } from "@/utils/ui";
import { sendMessage } from "@/utils/messaging";
import { Logo } from "@/components/logo";
import { parseAuthorUrl } from "../tasks/author/parse-url";
import { toast } from "sonner"; // 引入 toast

const Component = () => {
    
    const getHandle = async () => {
        try {
            const info = await parseAuthorUrl(new URL(location.href));
            return info;
        } catch (e: any) {
            toast.error(e.message || "无法解析当前用户链接");
            throw e;
        }
    }

    const handleExportPosts = async () => {
        try {
            const info = await getHandle();
            sendMessage('openTaskDialog', {
                name: 'author-post',
                author: {
                    handle: info.handle,
                    url: location.href
                }
            });
        } catch (e) { console.error(e); }
    }

    const handleExportFollowers = async () => {
        try {
            const info = await getHandle();
            sendMessage('openTaskDialog', {
                name: 'author-followers',
                type: 'followers',
                author: { handle: info.handle, url: location.href }
            });
        } catch (e) { console.error(e); }
    }

    const handleExportFollowing = async () => {
        try {
            const info = await getHandle();
            sendMessage('openTaskDialog', {
                name: 'author-followers',
                type: 'following',
                author: { handle: info.handle, url: location.href }
            });
        } catch (e) { console.error(e); }
    }

    return (
        <div className="flex gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-md">
                <Logo />
            </div>
            <Button size="sm" variant="secondary" onClick={handleExportPosts} className="h-8 text-xs px-2">
                导出帖子
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportFollowers} className="h-8 text-xs px-2">
                导出粉丝
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportFollowing} className="h-8 text-xs px-2">
                导出关注
            </Button>
        </div>
    );
};

export default defineSocialMediaCopilotUi({
    name: 'social-media-copilot-bsky-profile',
    position: "inline",
    matches: ["*://bsky.app/profile/*"],
    // 修正锚点：Bluesky 页面结构变动频繁，尝试定位到 profile 信息的容器
    // 通常 profileHeaderDisplayName 是用户名的 data-testid
    anchor: "div[data-testid='profileHeaderDisplayName']", 
    append: "after", 
    render: ({ root }) => {
        // 简单判断：如果 URL 包含 /post/ 说明是帖子详情页，不渲染
        if (location.pathname.includes('/post/')) {
            root.unmount();
            return;
        }
        root.render(<Component />);
    }
});
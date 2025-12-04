import { Button } from "@/components/ui/button";
import { defineSocialMediaCopilotUi } from "@/utils/ui";
import { sendMessage } from "@/utils/messaging";
import { parseUrl } from "../tasks/post/parse-url";
import { Logo } from "@/components/logo";
import { toast } from "sonner"; // 引入 toast 提示

const Component = () => {
    // 获取当前页面 URL 信息
    const getPostInfo = async () => {
        try {
            const url = new URL(location.href);
            return await parseUrl(url); 
        } catch (e) {
            toast.error("无效的 Bluesky 帖子链接");
            throw e;
        }
    }

    const handleOpenDialog = async () => {
        try {
            const postInfo = await getPostInfo();
            // 打开帖子数据导出弹窗
            sendMessage('openTaskDialog', {
                name: 'post',
                urls: [postInfo.href] 
            });
        } catch (e) {
            console.error(e);
        }
    }

    // 新增：导出评论的处理函数
    const handleExportComments = async () => {
        try {
            const postInfo = await getPostInfo();
            // 打开评论导出弹窗，并传递当前帖子信息
            sendMessage('openTaskDialog', {
                name: 'post-comment',
                post: {
                    handle: postInfo.handle,
                    rkey: postInfo.rkey,
                    href: postInfo.href
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="flex items-center gap-2 ml-2">
            <Logo />
            <Button size="sm" variant="secondary" onClick={handleOpenDialog} className="h-8">
                导出数据
            </Button>
            {/* 新增按钮 */}
            <Button size="sm" variant="secondary" onClick={handleExportComments} className="h-8">
                导出评论
            </Button>
        </div>
    );
};

export default defineSocialMediaCopilotUi({
    name: 'social-media-copilot-bsky-post',
    position: "inline",
    matches: ["*://bsky.app/profile/*/post/*"],
    anchor: "div[data-testid='post-action-bar']", 
    append: "after",
    render: ({ root }) => {
        root.render(<Component />);
    }
});
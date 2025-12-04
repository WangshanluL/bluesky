import { Button } from "@/components/ui/button";
import { defineSocialMediaCopilotUi } from "@/utils/ui";
import { sendMessage } from "@/utils/messaging";
import { parseUrl } from "../tasks/post/parse-url";
import { Logo } from "@/components/logo";

const Component = () => {
    const handleOpenDialog = async () => {
        try {
            // 简单的验证当前 URL 是否为有效的帖子 URL
            const url = new URL(location.href);
            await parseUrl(url); 
            
            // 打开弹窗并预填当前链接
            sendMessage('openTaskDialog', {
                name: 'post',
                urls: [location.href] // 注意这里需要传给 UrlArrayFormField 的默认值可能需要适配
                // 根据 components/form-field/url-array.tsx 的逻辑，它可能不接受默认值回填
                // 如果需要回填，需要在 tasks/post/index.tsx 的 defaultValues 里处理
            });
        } catch (e) {
            console.error("当前页面不是有效的 Bluesky 帖子");
        }
    }

    return (
        <div className="flex items-center gap-2 ml-2">
            <Logo />
            <Button size="sm" variant="secondary" onClick={handleOpenDialog} className="h-8">
                导出数据
            </Button>
        </div>
    );
};

export default defineSocialMediaCopilotUi({
    name: 'social-media-copilot-bsky-post',
    position: "inline",
    // 匹配帖子详情页
    matches: ["*://bsky.app/profile/*/post/*"],
    // Bluesky 页面元素很多没有固定 class，但 data-testid 很稳定
    // "post-action-bar" 是帖子底部的点赞/转发栏
    anchor: "div[data-testid='post-action-bar']", 
    append: "after",
    render: ({ root }) => {
        root.render(<Component />);
    }
});
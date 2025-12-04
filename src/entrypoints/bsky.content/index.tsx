import { loadCommon } from "@/components/common";
import { TaskDialogOptions } from "@/utils/task";
import type { SocialMediaCopilotUiOptions } from "@/utils/ui";

export default defineContentScript({
    // 这里定义了脚本运行的网站
    matches: ["*://bsky.app/*"],
    cssInjectionMode: "ui",
    async main(ctx) {
        // 动态加载 tasks 和 ui 目录下的模块
        const tasks: TaskDialogOptions[] = Object.values(import.meta.glob('./tasks/*/index.tsx', { eager: true, import: 'default' }));
        const ui: SocialMediaCopilotUiOptions[] = Object.values(import.meta.glob('./ui/*.tsx', { eager: true, import: 'default' }));
        
        // 加载通用组件 (弹窗容器、Toast通知等)
        await loadCommon(ctx, tasks, ui);
    }
});
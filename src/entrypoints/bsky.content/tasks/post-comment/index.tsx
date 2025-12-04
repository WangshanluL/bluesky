import { RequestIntervalFormField } from "@/components/form-field/request-interval";
import { UrlArrayFormField, urlArrayTransform } from "@/components/form-field/url-array";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { defineTaskDialog, TaskDialogProps } from "@/utils/task";
// 复用 post 任务中的 url 解析逻辑，确保统一
import { parseUrl } from "../post/parse-url";
import { Processor } from "./processor";

const formSchema = z.object({
    urls: z.array(z.string().trim()).nonempty().transform((arg, ctx) => urlArrayTransform(arg, ctx, parseUrl)),
    requestInterval: z.coerce.number().min(0, "请求间隔必须大于0秒")
});

export type FormSchema = z.infer<typeof formSchema>;

const Component = (props: TaskDialogProps & { post?: any }) => {
    const { post, setProcessor, ...restProps } = props;

    const form = useForm<any, any, FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            // 如果是从帖子页面点进来的，自动填入当前帖子链接
            urls: post ? [post.href] : [],
            requestInterval: 0
        }
    });

    const handleSubmit = (values: FormSchema) => {
        setProcessor(new Processor(values));
    }

    return (
        <Dialog {...restProps}>
            {/* 关键修改：添加 aria-describedby={undefined} 并移除 DialogDescription，与 post 模块保持一致 */}
            <DialogContent className="max-w-[600px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>批量导出 Bluesky 帖子评论</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-6 py-4">
                        {!post && (
                            <UrlArrayFormField
                                control={form.control}
                                name="urls" 
                                label="帖子链接"
                                description="请输入Bluesky帖子链接，例如 https://bsky.app/profile/xxx/post/xxx"
                            />
                        )}
                        <RequestIntervalFormField control={form.control} name="requestInterval"/>
                    </form>
                </Form>
                <DialogFooter>
                    <Button onClick={form.handleSubmit(handleSubmit)} className="w-full">开始</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default defineTaskDialog({
    name: "post-comment",
    children: Component,
    processor: Processor
});
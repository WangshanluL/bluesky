import { RequestIntervalFormField } from "@/components/form-field/request-interval";
import { UrlArrayFormField, urlArrayTransform } from "@/components/form-field/url-array";
import { Button } from "@/components/ui/button";
// 引入必要的 Dialog 组件
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { defineTaskDialog, TaskDialogProps } from "@/utils/task";
import { split } from "lodash";
import { Processor } from "./processor";

// 本地定义 URL 解析逻辑，避免外部依赖问题
async function parseUrl(url: URL) {
    const parts = split(url.pathname, "/").filter(p => !!p);
    // 格式: /profile/{handle}/post/{rkey}
    if (parts.length >= 3 && parts[0] === 'profile' && parts[2] === 'post') {
        return {
            handle: parts[1],
            rkey: parts[3],
            href: url.href
        };
    }
    throw new Error(`无效的 Bluesky 帖子链接: ${url.href}`);
}

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
            urls: post ? [post.href] : [],
            requestInterval: 0
        }
    });

    const handleSubmit = (values: FormSchema) => {
        setProcessor(new Processor(values));
    }

    return (
        <Dialog {...restProps}>
            <DialogContent className="max-w-[600px]">
                <DialogHeader>
                    {/* 必须包含 Title */}
                    <DialogTitle>批量导出 Bluesky 帖子评论</DialogTitle>
                    {/* 建议包含 Description */}
                    <DialogDescription>
                        请输入帖子链接，将导出该帖子下的所有评论数据。
                    </DialogDescription>
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
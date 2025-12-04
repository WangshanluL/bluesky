import { LimitPerIdFormField } from "@/components/form-field/limit-per-id";
import { RequestIntervalFormField } from "@/components/form-field/request-interval";
import { UrlArrayFormField, urlArrayTransform } from "@/components/form-field/url-array";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { defineTaskDialog, TaskDialogProps } from "@/utils/task";
import { parseAuthorUrl } from "../author/parse-url";
import { Processor } from "./processor";

const formSchema = z.object({
    limitPerId: z.coerce.number().min(1, "请输入数量"),
    urls: z.array(z.string().trim()).nonempty().transform((arg, ctx) => urlArrayTransform(arg, ctx, parseAuthorUrl)),
    requestInterval: z.coerce.number().min(0)
});

export type FormSchema = z.infer<typeof formSchema>;

export type ExtendedProps = {
    author?: {
        handle: string
        url: string
    }
    type?: 'followers' | 'following' // 用于区分 UI 标题
}

const Component = (props: TaskDialogProps & ExtendedProps) => {
    const { author, type, setProcessor, ...restProps } = props;
    const titleType = type === 'following' ? '关注' : '粉丝';

    const form = useForm<any, any, FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            urls: author ? [author.url] : [],
            limitPerId: 1000,
            requestInterval: 0
        }
    });

    const handleSubmit = (values: FormSchema) => {
        // 传递 type 给 processor 以决定调用哪个 API
        setProcessor(new Processor({ ...values, type: type || 'followers' }));
    }

    return (<Dialog {...restProps}>
        <DialogContent className="max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{author ? <>导出 <span className="text-red-400">{author.handle}</span> 的{titleType}</> : <>批量导出用户{titleType}</>}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form className="space-y-6 py-4">
                    {!author && <UrlArrayFormField control={form.control} name="urls" label="用户主页链接" />}
                    <LimitPerIdFormField control={form.control} name="limitPerId" description={`导出数量限制`} />
                    <RequestIntervalFormField control={form.control} name="requestInterval"/>
                </form>
            </Form>
            <DialogFooter>
                <Button onClick={form.handleSubmit(handleSubmit)} className="w-full">开始</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>);
}

export default defineTaskDialog({
    name: "author-followers", // 注意：可以在 popup 里用同一个名字调起，或者注册两个
    children: Component,
    processor: Processor
});
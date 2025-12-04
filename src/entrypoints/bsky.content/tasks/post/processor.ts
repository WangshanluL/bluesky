import { TaskProcessor, TaskDownloadOption } from "@/utils/task";
import { generateExcelDownloadOption, getSafeFilename } from "@/utils/fileinfo";
import { FormSchema } from ".";
import { resolveHandle, getPostThread } from "../../api/feed";

export class Processor extends TaskProcessor<FormSchema> {
    // 定义支持下载的媒体类型
    public mediaOptions = [{
        value: "image",
        label: "图片"
    }];

    async execute() {
        const { urls } = this.condition;
        this.actions.setTotal(urls.length);
        
        for (const urlItem of urls) {
            // 1. 首先需要将用户名 (handle) 解析为 DID
            // 如果 urlItem.handle 已经是 did:plc: 开头则不需要解析，但通常 URL 里是 handle
            let did = urlItem.handle;
            if (!did.startsWith("did:")) {
                const resolveRes = await this.next({
                    key: `resolve:${urlItem.handle}`,
                    func: resolveHandle,
                    args: [urlItem.handle]
                });
                did = resolveRes.did;
            }

            // 2. 构建 AT Protocol URI: at://{did}/app.bsky.feed.post/{rkey}
            const atUri = `at://${did}/app.bsky.feed.post/${urlItem.rkey}`;

            // 3. 获取帖子内容
            await this.next({
                key: atUri,
                func: getPostThread,
                args: [atUri]
            });

            this.actions.setCompleted(prev => prev + 1);
        }
    }

    getDataDownloadOption(): TaskDownloadOption {
        const dataList: any[][] = [[
            '帖子链接',
            '作者Handle',
            '作者昵称',
            '发布时间',
            '帖子内容',
            '点赞数',
            '转发数',
            '回复数',
            '图片链接'
        ]];

        // 从缓存中提取数据
        for (const urlItem of this.condition.urls) {
            // 这里我们遍历缓存找到对应的数据
            // 在 execute 中我们用 atUri 作为 key，但这里为了简单，我们通过 rkey 匹配缓存值
            const cachedValues = Array.from(this.dataCache.values());
            const data: any = cachedValues.find((v: any) => 
                v?.thread?.post?.uri?.endsWith(urlItem.rkey)
            );

            if (!data || !data.thread || !data.thread.post) continue;

            const post = data.thread.post;
            const record = post.record; // 帖子的元数据
            const author = post.author;

            const row = [];
            row.push(urlItem.href);
            row.push(author.handle);
            row.push(author.displayName || author.handle);
            row.push(new Date(record.createdAt));
            row.push(record.text);
            row.push(post.likeCount);
            row.push(post.repostCount);
            row.push(post.replyCount);

            // 提取图片链接
            const images = post.embed?.images?.map((img: any) => img.fullsize) || [];
            row.push(images.join('\n'));

            dataList.push(row);
        }

        return generateExcelDownloadOption(dataList, "Bluesky-帖子数据导出");
    }

    getMediaDownloadOptions(mediaTypes: string[]) {
        const list: TaskDownloadOption[] = [];
        if (!mediaTypes.includes('image')) return list;

        // 遍历缓存提取图片
        for (const data of this.dataCache.values()) {
            const post = (data as any)?.thread?.post;
            if (!post || !post.embed?.images) continue;

            const author = post.author.handle;
            // 截取部分内容作为文件名
            const shortText = getSafeFilename(post.record.text || "无标题").substring(0, 20);
            
            post.embed.images.forEach((img: any, index: number) => {
                list.push({
                    filename: `${author}/${shortText}_${index + 1}.jpg`,
                    url: img.fullsize
                });
            });
        }
        return list;
    }
}
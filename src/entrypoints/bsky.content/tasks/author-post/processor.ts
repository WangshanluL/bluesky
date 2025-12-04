import { TaskProcessor, TaskDownloadOption } from "@/utils/task";
import { generateExcelDownloadOption, getSafeFilename } from "@/utils/fileinfo";
import { FormSchema } from ".";
import { getAuthorFeed } from "../../api/feed";
import { getProfile } from "../../api/actor";

export class Processor extends TaskProcessor<FormSchema> {
    public mediaOptions = [{
        value: "image",
        label: "帖子图片"
    }];

    async execute() {
        const { urls, limitPerId } = this.condition;
        this.actions.setTotal(urls.length * limitPerId);
        
        let globalCompleted = 0;

        for (const urlItem of urls) {
            let cursor: string | undefined = undefined;
            let collectedCount = 0;

            // 尝试获取一下用户信息，确认 handle 有效
            try {
                await this.next({ key: `profile:${urlItem.handle}`, func: getProfile, args: [{ actor: urlItem.handle }] });
            } catch (e) {
                console.warn(`获取用户信息失败: ${urlItem.handle}`, e);
                // 继续尝试爬取，不中断
            }

            while (collectedCount < limitPerId) {
                // 调用 API
                const response = await this.next({
                    key: `feed:${urlItem.handle}:${cursor || 'start'}`,
                    func: getAuthorFeed,
                    args: [{ 
                        actor: urlItem.handle, 
                        limit: 100, 
                        cursor 
                    }]
                });

                if (!response || !response.feed || response.feed.length === 0) {
                    break;
                }

                const items = response.feed;
                collectedCount += items.length;
                globalCompleted += items.length;
                
                // 缓存数据
                items.forEach((item: any) => {
                    // 使用帖子 URI 作为唯一键
                    if (item.post && item.post.uri) {
                        this.dataCache.set(item.post.uri, item);
                    }
                });

                this.actions.setCompleted(globalCompleted);

                cursor = response.cursor;
                if (!cursor) break;
            }
        }
    }

    getDataDownloadOption(): TaskDownloadOption {
        const dataList: any[][] = [[
            '帖子URI',
            '作者Handle',
            '作者昵称',
            '发布时间',
            '内容',
            '回复数',
            '转发数',
            '点赞数',
            '引用数',
            '图片链接'
        ]];

        const posts = Array.from(this.dataCache.values()).filter((v: any) => v.post && v.post.record);

        for (const item of posts) {
            const post = item.post;
            const record = post.record;
            
            const row = [];
            row.push(post.uri);
            row.push(post.author.handle);
            row.push(post.author.displayName || '');
            row.push(record.createdAt ? new Date(record.createdAt) : '-');
            row.push(record.text || '');
            row.push(post.replyCount || 0);
            row.push(post.repostCount || 0);
            row.push(post.likeCount || 0);
            row.push(post.quoteCount || 0);
            
            const images = post.embed?.images?.map((img: any) => img.fullsize).join('\n') || '';
            row.push(images);

            dataList.push(row);
        }

        return generateExcelDownloadOption(dataList, "Bluesky-用户发帖数据");
    }

    getMediaDownloadOptions(mediaTypes: string[]) {
        const list: TaskDownloadOption[] = [];
        if (!mediaTypes.includes('image')) return list;

        const posts = Array.from(this.dataCache.values()).filter((v: any) => v.post && v.post.embed?.images);
        
        for (const item of posts) {
            const post = item.post;
            const author = post.author.handle;
            const shortText = getSafeFilename(post.record.text || "no_content").substring(0, 20);
            
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
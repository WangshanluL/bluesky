import { TaskProcessor, TaskDownloadOption } from "@/utils/task";
import { generateExcelDownloadOption } from "@/utils/fileinfo";
import { resolveHandle, getPostThread } from "../../api/feed";

// 1. 在这里定义类型，不依赖外部文件，确保编译通过
type PostUrlInfo = {
    handle: string;
    rkey: string;
    href: string;
}

// 2. 定义任务所需的条件
type CommentTaskCondition = {
    urls: PostUrlInfo[];
    requestInterval?: number;
}

export class Processor extends TaskProcessor<CommentTaskCondition> {
    mediaOptions = [];

    async execute() {
        const { urls } = this.condition;
        this.actions.setTotal(urls.length);
        
        let completed = 0;

        for (const urlItem of urls) {
            let did = urlItem.handle;
            // 解析 Handle 为 DID
            if (!did.startsWith("did:")) {
                try {
                    const resolveRes = await this.next({
                        key: `resolve:${urlItem.handle}`,
                        func: resolveHandle,
                        args: [urlItem.handle]
                    });
                    did = resolveRes.did;
                } catch (e) {
                    console.error(`用户解析失败: ${urlItem.handle}`, e);
                    continue; 
                }
            }

            // 构建 AT URI
            const atUri = `at://${did}/app.bsky.feed.post/${urlItem.rkey}`;

            // 获取帖子详情及评论
            const res = await this.next({
                key: `thread:${atUri}`,
                func: getPostThread,
                args: [atUri, 100] // 深度100
            });

            // 提取数据
            if (res && res.thread) {
                const flatComments: any[] = [];
                this.extractComments(res.thread, flatComments, urlItem.href);
                this.dataCache.set(urlItem.rkey, flatComments);
            }

            completed++;
            this.actions.setCompleted(completed);
        }
    }

    private extractComments(node: any, list: any[], rootUrl: string) {
        if (!node) return;
        if (node.$type === 'app.bsky.feed.defs#threadViewPost') {
            list.push({
                post: node.post,
                rootUrl: rootUrl
            });

            if (node.replies && Array.isArray(node.replies)) {
                for (const reply of node.replies) {
                    this.extractComments(reply, list, rootUrl);
                }
            }
        }
    }

    getDataDownloadOption(): TaskDownloadOption {
        const dataList: any[][] = [[
            '来源链接',
            '帖子URI',
            '内容',
            '时间',
            '点赞',
            '回复',
            '转发',
            '用户Handle',
            '昵称',
            '简介',
            'DID',
            '头像'
        ]];

        this.dataCache.forEach((comments: any[]) => {
            comments.forEach((item) => {
                const post = item.post;
                const author = post.author;
                const record = post.record;

                const row = [];
                row.push(item.rootUrl);
                row.push(post.uri);
                row.push(record.text || '');
                row.push(record.createdAt ? new Date(record.createdAt) : '-');
                row.push(post.likeCount || 0);
                row.push(post.replyCount || 0);
                row.push(post.repostCount || 0);
                
                row.push(author.handle);
                row.push(author.displayName || '');
                row.push(author.description || '');
                row.push(author.did);
                row.push(author.avatar || '');

                dataList.push(row);
            });
        });

        return generateExcelDownloadOption(dataList, "Bluesky-评论数据");
    }

    getMediaDownloadOptions() { return [] }
}
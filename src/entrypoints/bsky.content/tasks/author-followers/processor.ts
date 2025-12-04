import { TaskProcessor, TaskDownloadOption } from "@/utils/task";
import { generateExcelDownloadOption } from "@/utils/fileinfo";
import { FormSchema } from ".";
import { getFollowers, getFollows } from "../../api/graph";

export class Processor extends TaskProcessor<FormSchema & { type: 'followers' | 'following' }> {
    mediaOptions = [];

    async execute() {
        const { urls, limitPerId, type } = this.condition;
        const apiFunc = type === 'following' ? getFollows : getFollowers;
        // 关键：确认返回数据的字段名。getFollows 返回 { follows: [] }, getFollowers 返回 { followers: [] }
        const dataKey = type === 'following' ? 'follows' : 'followers';

        this.actions.setTotal(urls.length * limitPerId);
        let globalCompleted = 0;

        for (const urlItem of urls) {
            let cursor: string | undefined = undefined;
            let count = 0;

            while (count < limitPerId) {
                const res = await this.next({
                    key: `${type}:${urlItem.handle}:${cursor || 'start'}`,
                    func: apiFunc,
                    args: [{ actor: urlItem.handle, limit: 100, cursor }]
                });

                const list = res[dataKey];
                
                // 如果列表为空，说明爬取完毕
                if (!list || list.length === 0) break;

                count += list.length;
                globalCompleted += list.length;
                this.actions.setCompleted(globalCompleted);

                // 缓存数据
                list.forEach((user: any) => {
                    // key format: "source_handle:target_did"
                    this.dataCache.set(`${urlItem.handle}:${user.did}`, { ...user, _source: urlItem.handle });
                });

                cursor = res.cursor;
                // 如果没有 cursor，说明没有更多数据了
                if (!cursor) break;
            }
        }
    }

    getDataDownloadOption(): TaskDownloadOption {
        const { type } = this.condition;
        const titleType = type === 'following' ? '关注列表' : '粉丝列表';
        
        const dataList: any[][] = [[
            '源用户Handle',
            'DID',
            'Handle',
            '昵称',
            '简介',
            '头像URL',
            '创建时间'
        ]];

        this.dataCache.forEach((user: any) => {
            const row = [];
            row.push(user._source);
            row.push(user.did);
            row.push(user.handle);
            row.push(user.displayName || '');
            row.push(user.description || '');
            row.push(user.avatar || '');
            row.push(user.indexedAt ? new Date(user.indexedAt) : '-');
            dataList.push(row);
        });

        return generateExcelDownloadOption(dataList, `Bluesky-${titleType}`);
    }

    getMediaDownloadOptions() { return [] }
}
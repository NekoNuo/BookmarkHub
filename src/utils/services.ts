import { Setting } from './setting'
import { http } from './http'
import { BrowserType, SyncDataInfo } from './models'

// 文件信息接口
export interface FileInfo {
    fileName: string;
    bookmarkCount: number;
    browserType?: string;
    createDate?: number;
    version?: string;
}

class BookmarkService {
    async get(fileName?: string) {
        let setting = await Setting.build();
        const targetFileName = fileName || setting.gistFileName;
        let resp = await http.get(`gists/${setting.gistID}`).json() as any
        if (resp?.files) {
            let filenames = Object.keys(resp.files);
            if (filenames.indexOf(targetFileName) !== -1) {
                let gistFile = resp.files[targetFileName]
                if (gistFile.truncated) {
                    const txt = http.get(gistFile.raw_url, {prefixUrl: ''}).text();
                    return txt;
                } else {
                    return gistFile.content
                }
            }
        }
        return null;
    }

    // 获取所有浏览器的书签文件（返回原始内容）
    async getAllBrowserBookmarks() {
        let setting = await Setting.build();
        let resp = await http.get(`gists/${setting.gistID}`).json() as any
        const result: Record<string, string> = {};

        if (resp?.files) {
            const filenames = Object.keys(resp.files);
            // 查找所有书签文件
            for (const filename of filenames) {
                if (filename.startsWith('bookmarks-') || filename === 'bookmarks.json' || filename === 'BookmarkHub') {
                    const gistFile = resp.files[filename];
                    if (gistFile.truncated) {
                        result[filename] = await http.get(gistFile.raw_url, {prefixUrl: ''}).text();
                    } else {
                        result[filename] = gistFile.content;
                    }
                }
            }
        }
        return result;
    }

    // 获取所有书签文件的详细信息
    async getAllBookmarkFilesInfo(): Promise<FileInfo[]> {
        const filesContent = await this.getAllBrowserBookmarks();
        const result: FileInfo[] = [];

        for (const [fileName, content] of Object.entries(filesContent)) {
            try {
                const syncData: SyncDataInfo = JSON.parse(content);
                const bookmarkCount = this.countBookmarks(syncData.bookmarks || []);

                result.push({
                    fileName,
                    bookmarkCount,
                    browserType: syncData.browserType,
                    createDate: syncData.createDate,
                    version: syncData.version
                });
            } catch (err) {
                console.error(`解析文件 ${fileName} 失败:`, err);
                // 即使解析失败也添加基本信息
                result.push({
                    fileName,
                    bookmarkCount: 0
                });
            }
        }

        return result;
    }

    // 递归计算书签数量
    private countBookmarks(bookmarks: any[]): number {
        let count = 0;
        for (const bookmark of bookmarks) {
            if (bookmark.url) {
                count++;
            } else if (bookmark.children) {
                count += this.countBookmarks(bookmark.children);
            }
        }
        return count;
    }

    async getAllGist() {
        return http.get('gists').json();
    }
    async update(data: any) {
        let setting = await Setting.build();
        return http.patch(`gists/${setting.gistID}`, { json: data }).json();
    }
}

export default new BookmarkService()
import { Setting } from './setting'
import { http } from './http'
import { BrowserType } from './models'

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

    // 获取所有浏览器的书签文件
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

    async getAllGist() {
        return http.get('gists').json();
    }
    async update(data: any) {
        let setting = await Setting.build();
        return http.patch(`gists/${setting.gistID}`, { json: data }).json();
    }
}

export default new BookmarkService()
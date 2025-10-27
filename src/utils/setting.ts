import { Options } from 'webext-options-sync';
import optionsStorage from './optionsStorage'
import { BrowserType, BROWSER_FILE_NAMES } from './models'

export class SettingBase implements Options {
    constructor() { }
    [key: string]: string | number | boolean;
    githubToken: string = '';
    gistID: string = '';
    gistFileName: string = 'BookmarkHub';
    enableNotify: boolean = true;
    githubURL: string = 'https://api.github.com';
    enableMultiBrowser: boolean = false; // 是否启用多浏览器模式
}

export class Setting extends SettingBase {
    browserType: BrowserType = BrowserType.UNKNOWN;

    private constructor() { super() }

    static async build() {
        let options = await optionsStorage.getAll();
        let setting = new Setting();
        setting.gistID = options.gistID;
        setting.gistFileName = options.gistFileName;
        setting.githubToken = options.githubToken;
        setting.enableNotify = options.enableNotify;
        setting.enableMultiBrowser = options.enableMultiBrowser ?? false;

        // 检测当前浏览器类型
        setting.browserType = await Setting.detectBrowserType();

        // 如果启用多浏览器模式，使用对应的文件名
        if (setting.enableMultiBrowser) {
            setting.gistFileName = BROWSER_FILE_NAMES[setting.browserType];
        }

        return setting;
    }

    // 检测浏览器类型
    static async detectBrowserType(): Promise<BrowserType> {
        const userAgent = navigator.userAgent.toLowerCase();

        // 检查书签树根节点ID（Firefox特有）
        try {
            const bookmarkTree = await browser.bookmarks.getTree();
            if (bookmarkTree && bookmarkTree[0].id === "root________") {
                return BrowserType.FIREFOX;
            }
        } catch (e) {
            console.error('Failed to get bookmark tree:', e);
        }

        // 通过 userAgent 检测
        if (userAgent.includes('edg/')) {
            return BrowserType.EDGE;
        } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            return BrowserType.CHROME;
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            return BrowserType.SAFARI;
        }

        return BrowserType.UNKNOWN;
    }

    // 获取指定浏览器类型的文件名
    getFileNameForBrowser(browserType: BrowserType): string {
        return BROWSER_FILE_NAMES[browserType];
    }
}




// export class SettingBase {
//     constructor() { }
//     [key: string]: string | number | boolean;
//     githubToken: string = '';
//     gistID: string = '';
//     gistFileName: string = 'BookmarkHub';
//     enableNotify: boolean = true;
//     githubURL: string = 'https://api.github.com';
// }
// export class Setting extends SettingBase {
//     private constructor() { super() }
//     static async build() {
//         let options =new Setting();
//         let setting = new Setting();
//         setting.gistID = options.gistID;
//         setting.gistFileName = options.gistFileName;
//         setting.githubToken = options.githubToken;
//         setting.enableNotify = options.enableNotify;
//         return setting;
//     }
// }

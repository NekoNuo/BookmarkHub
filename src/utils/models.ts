export class BookmarkInfo {
    id?: string | undefined = "";
    parentId?: string | undefined;
    index?: number | undefined;
    url?: string | undefined;
    title: string = "";
    dateAdded?: number | undefined;
    dateGroupModified?: number | undefined;
    unmodifiable?: "managed" | undefined;
    type?: "bookmark" | "folder" | "separator" | undefined;
    children?: BookmarkInfo[] | undefined;
    public constructor(title: string, url?: string, children?: BookmarkInfo[]) {
        this.title = title;
        this.url = url;
        this.children = children;
    }
}
export class SyncDataInfo {
    browser: string = "chrome";
    browserType?: BrowserType; // 浏览器类型标记
    version: string = "1.0.0";
    createDate: number = Date.now();
    bookmarks: BookmarkInfo[] | undefined = [];
}

export enum BrowserType {
    FIREFOX = "firefox",
    CHROME = "chrome",
    EDGE = "edge",
    SAFARI = "safari",
    UNKNOWN = "unknown"
}

export enum OperType { NONE, SYNC, CHANGE, CREATE, MOVE, REMOVE }
export enum RootBookmarksType { MenuFolder = "MenuFolder", ToolbarFolder = "ToolbarFolder", UnfiledFolder = "UnfiledFolder", MobileFolder = "MobileFolder" }

// 浏览器文件名映射
export const BROWSER_FILE_NAMES: Record<BrowserType, string> = {
    [BrowserType.CHROME]: 'bookmarks-chrome.json',
    [BrowserType.FIREFOX]: 'bookmarks-firefox.json',
    [BrowserType.EDGE]: 'bookmarks-edge.json',
    [BrowserType.SAFARI]: 'bookmarks-safari.json',
    [BrowserType.UNKNOWN]: 'bookmarks.json'
};
export const rootBookmarks: BookmarkInfo[] = [
    {
        "id": "menu________",//书签菜单
        "parentId": "0",
        "title": RootBookmarksType.MenuFolder,
        children: []
    }, {
        "id": "toolbar_____",//书签工具栏
        "parentId": "0",
        "title": RootBookmarksType.ToolbarFolder,
        children: []
    }, {
        "id": "unfiled_____",//其它书签
        "parentId": "0",
        "title": RootBookmarksType.UnfiledFolder,
        children: []
    }, {
        "id": "mobile______",//移动设备书签
        "parentId": "0",
        "title": RootBookmarksType.MobileFolder,
        children: []
    }];




import BookmarkService from '../utils/services'
import { Setting } from '../utils/setting'
import iconLogo from '../assets/icon.png'
import { OperType, BookmarkInfo, SyncDataInfo, RootBookmarksType, BrowserType } from '../utils/models'
import { Bookmarks } from 'wxt/browser'
export default defineBackground(() => {

  const AUTO_SYNC_ALARM_NAME = 'autoSyncBookmarks';

  browser.runtime.onInstalled.addListener(async (c) => {
    // 初始化时保存浏览器类型和配置
    const setting = await Setting.build();
    await browser.storage.local.set({
      currentBrowser: setting.browserType,
      enableMultiBrowser: setting.enableMultiBrowser
    });

    // 初始化定时器
    await setupAutoSync();
  });

  let curOperType = OperType.NONE;
  let curBrowserType = BrowserType.CHROME;
  let isOperating = false; // 防止重复操作的锁

  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.name === 'upload') {
      if (isOperating) {
        console.warn('[upload] 操作正在进行中，忽略重复请求');
        sendResponse(false);
        return true;
      }
      isOperating = true;
      curOperType = OperType.SYNC;
      const deduplicate = msg.deduplicate || false; // 是否去重
      console.log('[upload] 开始上传操作, deduplicate:', deduplicate);
      uploadBookmarks(deduplicate).then(() => {
        curOperType = OperType.NONE;
        isOperating = false;
        browser.action.setBadgeText({ text: "" });
        refreshLocalCount();
        console.log('[upload] 上传操作完成');
        sendResponse(true);
      }).catch(err => {
        curOperType = OperType.NONE;
        isOperating = false;
        console.error('[upload] 上传操作失败:', err);
        sendResponse(false);
      });
    }
    if (msg.name === 'download') {
      if (isOperating) {
        console.warn('[download] 操作正在进行中，忽略重复请求');
        sendResponse(false);
        return true;
      }
      isOperating = true;
      curOperType = OperType.SYNC;
      const fileName = msg.fileName; // 可选的文件名参数
      const clearBeforeDownload = msg.clearBeforeDownload || false; // 是否清空现有书签
      const deduplicate = msg.deduplicate || false; // 是否去重
      console.log('[download] 开始下载操作, fileName:', fileName, 'clearBeforeDownload:', clearBeforeDownload, 'deduplicate:', deduplicate);
      downloadBookmarks(fileName, clearBeforeDownload, deduplicate).then(() => {
        curOperType = OperType.NONE;
        isOperating = false;
        browser.action.setBadgeText({ text: "" });
        refreshLocalCount();
        console.log('[download] 下载操作完成');
        sendResponse(true);
      }).catch(err => {
        curOperType = OperType.NONE;
        isOperating = false;
        console.error('[download] 下载操作失败:', err);
        sendResponse(false);
      });

    }
    if (msg.name === 'getAvailableFiles') {
      // 获取 Gist 中所有可用的书签文件信息
      console.log('[getAvailableFiles] 获取可用文件列表');
      BookmarkService.getAllBookmarkFilesInfo().then(files => {
        console.log('[getAvailableFiles] 文件列表:', files);
        sendResponse(files);
      }).catch(err => {
        console.error('[getAvailableFiles] 获取失败:', err);
        sendResponse([]);
      });
    }
    if (msg.name === 'removeAll') {
      if (isOperating) {
        console.warn('[removeAll] 操作正在进行中，忽略重复请求');
        sendResponse(false);
        return true;
      }
      isOperating = true;
      curOperType = OperType.REMOVE;
      console.log('[removeAll] 开始清空操作');
      clearBookmarkTree().then(() => {
        curOperType = OperType.NONE;
        isOperating = false;
        browser.action.setBadgeText({ text: "" });
        refreshLocalCount();
        console.log('[removeAll] 清空操作完成');
        sendResponse(true);
      }).catch(err => {
        curOperType = OperType.NONE;
        isOperating = false;
        console.error('[removeAll] 清空操作失败:', err);
        sendResponse(false);
      });

    }
    if (msg.name === 'setting') {
      browser.runtime.openOptionsPage().then(() => {
        sendResponse(true);
      });
    }
    return true;
  });
  browser.bookmarks.onCreated.addListener((id, info) => {
    if (curOperType === OperType.NONE) {
      // console.log("onCreated", id, info)
      browser.action.setBadgeText({ text: "!" });
      browser.action.setBadgeBackgroundColor({ color: "#F00" });
      refreshLocalCount();
    }
  });
  browser.bookmarks.onChanged.addListener((id, info) => {
    if (curOperType === OperType.NONE) {
      // console.log("onChanged", id, info)
      browser.action.setBadgeText({ text: "!" });
      browser.action.setBadgeBackgroundColor({ color: "#F00" });
    }
  })
  browser.bookmarks.onMoved.addListener((id, info) => {
    if (curOperType === OperType.NONE) {
      // console.log("onMoved", id, info)
      browser.action.setBadgeText({ text: "!" });
      browser.action.setBadgeBackgroundColor({ color: "#F00" });
    }
  })
  browser.bookmarks.onRemoved.addListener((id, info) => {
    if (curOperType === OperType.NONE) {
      // console.log("onRemoved", id, info)
      browser.action.setBadgeText({ text: "!" });
      browser.action.setBadgeBackgroundColor({ color: "#F00" });
      refreshLocalCount();
    }
  })

  // 去重函数：根据 URL 去重，保留第一个出现的书签
  function deduplicateBookmarks(bookmarks: any[]): any[] {
    const seenUrls = new Set<string>();
    const result: any[] = [];

    function processBookmark(bookmark: any): any | null {
      if (bookmark.url) {
        // 如果是书签（有 URL）
        if (seenUrls.has(bookmark.url)) {
          console.log(`[deduplicate] 跳过重复书签: "${bookmark.title}" (${bookmark.url})`);
          return null; // 重复，跳过
        }
        seenUrls.add(bookmark.url);
        return bookmark;
      } else if (bookmark.children) {
        // 如果是文件夹
        const deduplicatedChildren = bookmark.children
          .map((child: any) => processBookmark(child))
          .filter((child: any) => child !== null);

        return {
          ...bookmark,
          children: deduplicatedChildren
        };
      }
      return bookmark;
    }

    for (const bookmark of bookmarks) {
      const processed = processBookmark(bookmark);
      if (processed !== null) {
        result.push(processed);
      }
    }

    return result;
  }

  async function uploadBookmarks(deduplicate: boolean = false) {
    try {
      let setting = await Setting.build()
      if (setting.githubToken == '') {
        throw new Error("Gist Token Not Found");
      }
      if (setting.gistID == '') {
        throw new Error("Gist ID Not Found");
      }
      if (setting.gistFileName == '') {
        throw new Error("Gist File Not Found");
      }
      let bookmarks = await getBookmarks();
      console.log('[uploadBookmarks] 原始书签树:', JSON.stringify(bookmarks, null, 2));

      let syncdata = new SyncDataInfo();
      syncdata.version = browser.runtime.getManifest().version;
      syncdata.createDate = Date.now();
      syncdata.bookmarks = formatBookmarks(bookmarks);
      console.log('[uploadBookmarks] 格式化后的书签:', JSON.stringify(syncdata.bookmarks, null, 2));

      // 如果需要去重
      if (deduplicate && syncdata.bookmarks) {
        console.log('[uploadBookmarks] 开始去重...');
        const beforeCount = getBookmarkCount(syncdata.bookmarks);
        syncdata.bookmarks = deduplicateBookmarks(syncdata.bookmarks);
        const afterCount = getBookmarkCount(syncdata.bookmarks);
        console.log(`[uploadBookmarks] 去重完成: ${beforeCount} -> ${afterCount} (删除 ${beforeCount - afterCount} 个重复)`);
      }

      syncdata.browser = navigator.userAgent;
      syncdata.browserType = setting.browserType; // 添加浏览器类型标记

      await BookmarkService.update({
        files: {
          [setting.gistFileName]: {
            content: JSON.stringify(syncdata)
          }
        },
        description: `${setting.gistFileName} - ${setting.browserType}`
      });

      const count = getBookmarkCount(syncdata.bookmarks);
      console.log('[uploadBookmarks] 计算的书签数量:', count);
      console.log('[uploadBookmarks] syncdata.bookmarks 内容:', syncdata.bookmarks);

      // 如果启用多浏览器模式，分别存储不同浏览器的书签数量
      if (setting.enableMultiBrowser) {
        await browser.storage.local.set({
          [`remoteCount_${setting.browserType}`]: count,
          remoteCount: count // 保持向后兼容
        });
      } else {
        await browser.storage.local.set({ remoteCount: count });
      }

      if (setting.enableNotify) {
        await browser.notifications.create({
          type: "basic",
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('uploadBookmarks'),
          message: `${browser.i18n.getMessage('success')} (${setting.browserType})`
        });
      }

    }
    catch (error: any) {
      console.error(error);
      await browser.notifications.create({
        type: "basic",
        iconUrl: iconLogo,
        title: browser.i18n.getMessage('uploadBookmarks'),
        message: `${browser.i18n.getMessage('error')}：${error.message}`
      });
    }
  }
  async function downloadBookmarks(fileNameOrBrowserType?: string | BrowserType, clearBeforeDownload: boolean = false, deduplicate: boolean = false) {
    try {
      let setting = await Setting.build()
      let gist: string | null = null;
      let targetFileName: string | undefined;

      // 判断参数类型
      if (fileNameOrBrowserType) {
        // 如果是浏览器类型枚举值，转换为文件名
        if (Object.values(BrowserType).includes(fileNameOrBrowserType as BrowserType)) {
          targetFileName = setting.getFileNameForBrowser(fileNameOrBrowserType as BrowserType);
        } else {
          // 否则直接作为文件名使用
          targetFileName = fileNameOrBrowserType as string;
        }
        console.log('[downloadBookmarks] 下载指定文件:', targetFileName);
        gist = await BookmarkService.get(targetFileName);
      } else {
        // 否则下载当前浏览器的文件
        console.log('[downloadBookmarks] 下载当前浏览器文件:', setting.gistFileName);
        gist = await BookmarkService.get();
      }

      if (gist) {
        console.log('[downloadBookmarks] 获取到Gist数据:', gist);
        let syncdata: SyncDataInfo = JSON.parse(gist);
        console.log('[downloadBookmarks] 解析后的书签数据:', syncdata);
        if (syncdata.bookmarks == undefined || syncdata.bookmarks.length == 0) {
          if (setting.enableNotify) {
            await browser.notifications.create({
              type: "basic",
              iconUrl: iconLogo,
              title: browser.i18n.getMessage('downloadBookmarks'),
              message: `${browser.i18n.getMessage('error')}：Gist File ${setting.gistFileName} is NULL`
            });
          }
          return;
        }
        // 如果需要去重
        if (deduplicate && syncdata.bookmarks) {
          console.log('[downloadBookmarks] 开始去重...');
          const beforeCount = getBookmarkCount(syncdata.bookmarks);
          syncdata.bookmarks = deduplicateBookmarks(syncdata.bookmarks);
          const afterCount = getBookmarkCount(syncdata.bookmarks);
          console.log(`[downloadBookmarks] 去重完成: ${beforeCount} -> ${afterCount} (删除 ${beforeCount - afterCount} 个重复)`);
        }

        // 根据选项决定是否清空现有书签
        if (clearBeforeDownload) {
          console.log('[downloadBookmarks] 开始清空本地书签...');
          await clearBookmarkTree();
          console.log('[downloadBookmarks] 清空完成，开始创建书签...');
        } else {
          console.log('[downloadBookmarks] 合并模式，不清空现有书签，直接创建...');
        }

        await createBookmarkTree(syncdata.bookmarks);
        console.log('[downloadBookmarks] 书签创建完成');
        const count = getBookmarkCount(syncdata.bookmarks);

        // 使用 syncdata 中的 browserType 或当前浏览器类型
        const browserType = syncdata.browserType || setting.browserType;

        // 如果启用多浏览器模式，分别存储不同浏览器的书签数量
        if (setting.enableMultiBrowser) {
          await browser.storage.local.set({
            [`remoteCount_${browserType}`]: count,
            remoteCount: count // 保持向后兼容
          });
        } else {
          await browser.storage.local.set({ remoteCount: count });
        }

        if (setting.enableNotify) {
          const fileInfo = targetFileName ? ` (${targetFileName})` : ` (${browserType})`;
          await browser.notifications.create({
            type: "basic",
            iconUrl: iconLogo,
            title: browser.i18n.getMessage('downloadBookmarks'),
            message: `${browser.i18n.getMessage('success')}${fileInfo}`
          });
        }
      }
      else {
        await browser.notifications.create({
          type: "basic",
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('downloadBookmarks'),
          message: `${browser.i18n.getMessage('error')}：Gist File ${setting.gistFileName} Not Found`
        });
      }
    }
    catch (error: any) {
      console.error(error);
      await browser.notifications.create({
        type: "basic",
        iconUrl: iconLogo,
        title: browser.i18n.getMessage('downloadBookmarks'),
        message: `${browser.i18n.getMessage('error')}：${error.message}`
      });
    }
  }

  async function getBookmarks() {
    let bookmarkTree: BookmarkInfo[] = await browser.bookmarks.getTree();
    if (bookmarkTree && bookmarkTree[0].id === "root________") {
      curBrowserType = BrowserType.FIREFOX;
    }
    else {
      curBrowserType = BrowserType.CHROME;
    }
    return bookmarkTree;
  }

  async function clearBookmarkTree() {
    try {
      let setting = await Setting.build()
      if (setting.githubToken == '') {
        throw new Error("Gist Token Not Found");
      }
      if (setting.gistID == '') {
        throw new Error("Gist ID Not Found");
      }
      if (setting.gistFileName == '') {
        throw new Error("Gist File Not Found");
      }
      let bookmarks = await getBookmarks();
      let tempNodes: BookmarkInfo[] = [];
      // 收集所有标准文件夹（toolbar/menu/unfiled/mobile）下的用户书签
      bookmarks[0].children?.forEach(c => {
        c.children?.forEach(d => {
          tempNodes.push(d)
        })
      });

      if (tempNodes.length > 0) {
        for (let node of tempNodes) {
          if (node.id) {
            await browser.bookmarks.removeTree(node.id)
          }
        }
      }
      if (curOperType === OperType.REMOVE && setting.enableNotify) {
        await browser.notifications.create({
          type: "basic",
          iconUrl: iconLogo,
          title: browser.i18n.getMessage('removeAllBookmarks'),
          message: browser.i18n.getMessage('success')
        });
      }
    }
    catch (error: any) {
      console.error(error);
      await browser.notifications.create({
        type: "basic",
        iconUrl: iconLogo,
        title: browser.i18n.getMessage('removeAllBookmarks'),
        message: `${browser.i18n.getMessage('error')}：${error.message}`
      });
    }
  }

  async function createBookmarkTree(bookmarkList: BookmarkInfo[] | undefined) {
    if (bookmarkList == null) {
      return;
    }
    console.log('[createBookmarkTree] 处理书签列表，数量:', bookmarkList.length);
    for (let i = 0; i < bookmarkList.length; i++) {
      let node = bookmarkList[i];
      console.log('[createBookmarkTree] 处理节点:', node.title, '是否有URL:', !!node.url, '子节点数:', node.children?.length || 0);

      if (node.title == RootBookmarksType.MenuFolder
        || node.title == RootBookmarksType.MobileFolder
        || node.title == RootBookmarksType.ToolbarFolder
        || node.title == RootBookmarksType.UnfiledFolder) {
        console.log('[createBookmarkTree] 这是根文件夹:', node.title);
        if (curBrowserType == BrowserType.FIREFOX) {
          switch (node.title) {
            case RootBookmarksType.MenuFolder:
              node.children?.forEach(c => c.parentId = "menu________");
              break;
            case RootBookmarksType.MobileFolder:
              node.children?.forEach(c => c.parentId = "mobile______");
              break;
            case RootBookmarksType.ToolbarFolder:
              node.children?.forEach(c => c.parentId = "toolbar_____");
              break;
            case RootBookmarksType.UnfiledFolder:
              node.children?.forEach(c => c.parentId = "unfiled_____");
              break;
            default:
              node.children?.forEach(c => c.parentId = "unfiled_____");
              break;
          }
        } else {
          switch (node.title) {
            case RootBookmarksType.MobileFolder:
              node.children?.forEach(c => c.parentId = "3");
              break;
            case RootBookmarksType.ToolbarFolder:
              node.children?.forEach(c => c.parentId = "1");
              break;
            case RootBookmarksType.UnfiledFolder:
            case RootBookmarksType.MenuFolder:
              node.children?.forEach(c => c.parentId = "2");
              break;
            default:
              node.children?.forEach(c => c.parentId = "2");
              break;
          }
        }
        await createBookmarkTree(node.children);
        continue;
      }

      let res: Bookmarks.BookmarkTreeNode = { id: '', title: '' };
      try {
        /* 处理firefox中创建 chrome://chrome-urls/ 格式的书签会报错的问题 */
        console.log('[createBookmarkTree] 创建书签/文件夹:', node.title, 'parentId:', node.parentId, 'url:', node.url);
        res = await browser.bookmarks.create({
          parentId: node.parentId,
          title: node.title,
          url: node.url
        });
        console.log('[createBookmarkTree] 创建成功，新ID:', res.id);
      } catch (err) {
        console.error('[createBookmarkTree] 创建失败:', res, err);
      }
      if (res.id && node.children && node.children.length > 0) {
        console.log('[createBookmarkTree] 递归创建子节点，数量:', node.children.length);
        node.children.forEach(c => c.parentId = res.id);
        await createBookmarkTree(node.children);
      }
    }
  }

  function getBookmarkCount(bookmarkList: BookmarkInfo[] | undefined, depth: number = 0) {
    let count = 0;
    if (bookmarkList) {
      bookmarkList.forEach(c => {
        console.log(`[getBookmarkCount] depth=${depth}, title="${c.title}", hasUrl=${!!c.url}, childrenCount=${c.children?.length || 0}`);
        if (c.url) {
          count = count + 1;
          console.log(`[getBookmarkCount] 找到书签: "${c.title}", 当前总数: ${count}`);
        }
        else {
          const childCount = getBookmarkCount(c.children, depth + 1);
          console.log(`[getBookmarkCount] 文件夹 "${c.title}" 的子书签数: ${childCount}`);
          count = count + childCount;
        }
      });
    }
    console.log(`[getBookmarkCount] depth=${depth} 返回总数: ${count}`);
    return count;
  }

  async function refreshLocalCount() {
    let bookmarkList = await getBookmarks();
    const count = getBookmarkCount(bookmarkList);
    await browser.storage.local.set({ localCount: count });
  }


  function formatBookmarks(bookmarks: BookmarkInfo[]): BookmarkInfo[] | undefined {
    if (bookmarks[0].children) {
      for (let a of bookmarks[0].children) {
        switch (a.id) {
          case "1":
          case "toolbar_____":
            a.title = RootBookmarksType.ToolbarFolder;
            break;
          case "menu________":
            a.title = RootBookmarksType.MenuFolder;
            break;
          case "2":
          case "unfiled_____":
            a.title = RootBookmarksType.UnfiledFolder;
            break;
          case "3":
          case "mobile______":
            a.title = RootBookmarksType.MobileFolder;
            break;
        }
      }
    }

    let a = format(bookmarks[0]);
    return a.children;
  }

  function format(b: BookmarkInfo): BookmarkInfo {
    b.dateAdded = undefined;
    b.dateGroupModified = undefined;
    b.id = undefined;
    b.index = undefined;
    b.parentId = undefined;
    b.type = undefined;
    b.unmodifiable = undefined;
    if (b.children && b.children.length > 0) {
      b.children?.map(c => format(c))
    }
    return b;
  }
  ///暂时不启用自动备份
  /*
  async function backupToLocalStorage(bookmarks: BookmarkInfo[]) {
      try {
          let syncdata = new SyncDataInfo();
          syncdata.version = browser.runtime.getManifest().version;
          syncdata.createDate = Date.now();
          syncdata.bookmarks = formatBookmarks(bookmarks);
          syncdata.browser = navigator.userAgent;
          const keyname = 'BookmarkHub_backup_' + Date.now().toString();
          await browser.storage.local.set({ [keyname]: JSON.stringify(syncdata) });
      }
      catch (error:any) {
          console.error(error)
      }
  }
  */

  // ========== 定时同步功能 ==========

  // 设置定时器
  async function setupAutoSync() {
    const setting = await Setting.build();
    console.log('[setupAutoSync] enableAutoSync:', setting.enableAutoSync, 'interval:', setting.autoSyncInterval);

    // 清除现有的定时器
    await browser.alarms.clear(AUTO_SYNC_ALARM_NAME);

    if (setting.enableAutoSync) {
      // 创建新的定时器
      const intervalInMinutes = Number(setting.autoSyncInterval) || 60;
      await browser.alarms.create(AUTO_SYNC_ALARM_NAME, {
        periodInMinutes: intervalInMinutes
      });
      console.log(`[setupAutoSync] 定时上传已启用，间隔: ${intervalInMinutes} 分钟`);
    } else {
      console.log('[setupAutoSync] 定时上传已禁用');
    }
  }

  // 监听定时器触发
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === AUTO_SYNC_ALARM_NAME) {
      console.log('[alarms.onAlarm] 定时上传触发');

      // 检查是否有操作正在进行
      if (isOperating) {
        console.warn('[alarms.onAlarm] 操作正在进行中，跳过本次定时上传');
        return;
      }

      try {
        isOperating = true;
        curOperType = OperType.SYNC;
        await uploadBookmarks(false); // 定时上传不去重
        console.log('[alarms.onAlarm] 定时上传完成');
      } catch (err) {
        console.error('[alarms.onAlarm] 定时上传失败:', err);
      } finally {
        curOperType = OperType.NONE;
        isOperating = false;
      }
    }
  });

  // 监听配置变化
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync') {
      // 检查是否是定时同步相关的配置变化
      if (changes.enableAutoSync || changes.autoSyncInterval) {
        console.log('[storage.onChanged] 定时同步配置已更改，重新设置定时器');
        await setupAutoSync();
      }
    }
  });

});
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client';
import { IconContext } from 'react-icons'
import {
    AiOutlineCloudUpload, AiOutlineCloudDownload,
    AiOutlineSetting, AiOutlineClear,
    AiOutlineInfoCircle, AiOutlineGithub, AiOutlineReload
} from 'react-icons/ai'
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/theme.css';
import './popup.css'

// 文件信息接口
interface FileInfo {
    fileName: string;
    bookmarkCount: number;
    browserType?: string;
    createDate?: number;
    version?: string;
}

const ToggleRow: React.FC<{
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}> = ({ id, label, description, checked, onChange }) => (
    <label htmlFor={id} className="toggle-row">
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-row__indicator" />
        <span className="toggle-row__content">
            <span className="toggle-row__label">{label}</span>
            {description && <span className="toggle-row__description">{description}</span>}
        </span>
    </label>
);

const Popup: React.FC = () => {
    const [count, setCount] = useState({ local: "0", remote: "0" })
    const [enableMultiBrowser, setEnableMultiBrowser] = useState(false)
    const [currentBrowser, setCurrentBrowser] = useState("unknown")
    const [browserCounts, setBrowserCounts] = useState<Record<string, string>>({})
    const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([])
    const [selectedFile, setSelectedFile] = useState<string>("")
    const [showFileSelector, setShowFileSelector] = useState(false)
    const [clearBeforeDownload, setClearBeforeDownload] = useState(false) // 下载前是否清空
    const [deduplicateOnUpload, setDeduplicateOnUpload] = useState(false) // 上传时是否去重
    const [deduplicateOnDownload, setDeduplicateOnDownload] = useState(false) // 下载时是否去重
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' })

    // 处理操作按钮点击
    const handleOperation = async (operationName: string, displayName: string) => {
        const message: any = { name: operationName };

        // 清空之前的状态消息
        setStatusMessage({ text: '', type: '' });

        // 如果是上传操作
        if (operationName === 'upload') {
            message.deduplicate = deduplicateOnUpload;
            console.log('[handleOperation] 上传时去重:', deduplicateOnUpload);
        }

        // 如果是下载操作
        if (operationName === 'download') {
            // 传递选中的文件名
            if (selectedFile) {
                message.fileName = selectedFile;
                console.log('[handleOperation] 下载文件:', selectedFile);
            }
            // 传递是否清空的选项
            message.clearBeforeDownload = clearBeforeDownload;
            console.log('[handleOperation] 下载前清空:', clearBeforeDownload);
            // 传递是否去重的选项
            message.deduplicate = deduplicateOnDownload;
            console.log('[handleOperation] 下载时去重:', deduplicateOnDownload);
        }

        try {
            const res = await browser.runtime.sendMessage(message);
            console.log("msg", Date.now(), res)

            // 显示成功消息
            if (res) {
                setStatusMessage({
                    text: `${displayName}成功！`,
                    type: 'success'
                });
            } else {
                setStatusMessage({
                    text: `${displayName}失败，请重试`,
                    type: 'error'
                });
            }

            // 3秒后清空消息
            setTimeout(() => {
                setStatusMessage({ text: '', type: '' });
            }, 3000);

            // 刷新数据
            loadCounts();
        } catch (c: any) {
            console.log("error", c)
            setStatusMessage({
                text: `${displayName}失败: ${c.message || '未知错误'}`,
                type: 'error'
            });

            // 5秒后清空错误消息
            setTimeout(() => {
                setStatusMessage({ text: '', type: '' });
            }, 5000);
        }
    }

    const openOptions = async () => {
        try {
            await browser.runtime.sendMessage({ name: 'setting' });
        } catch (err) {
            console.error('openOptions error', err);
        }
    }

    const loadCounts = async () => {
        let data = await browser.storage.local.get([
            "localCount",
            "remoteCount",
            "enableMultiBrowser",
            "currentBrowser",
            "remoteCount_chrome",
            "remoteCount_firefox",
            "remoteCount_edge",
            "remoteCount_safari"
        ]);
        setCount({ local: data["localCount"] || "0", remote: data["remoteCount"] || "0" });
        setEnableMultiBrowser(data["enableMultiBrowser"] || false);
        setCurrentBrowser(data["currentBrowser"] || "unknown");

        // 加载各浏览器的书签数量
        const counts: Record<string, string> = {
            chrome: data["remoteCount_chrome"] || "0",
            firefox: data["remoteCount_firefox"] || "0",
            edge: data["remoteCount_edge"] || "0",
            safari: data["remoteCount_safari"] || "0"
        };
        setBrowserCounts(counts);
    }

    const loadAvailableFiles = async () => {
        try {
            const files = await browser.runtime.sendMessage({ name: 'getAvailableFiles' });
            console.log('可用文件列表:', files);
            setAvailableFiles(files || []);
            setShowFileSelector(files && files.length > 1); // 只有多个文件时才显示选择器
        } catch (err) {
            console.error('获取文件列表失败:', err);
            setAvailableFiles([]);
            setShowFileSelector(false);
        }
    }

    useEffect(() => {
        loadCounts();
        loadAvailableFiles();
    }, [])
    return (
        <IconContext.Provider value={{ className: 'icon-default', size: '1.1rem' }}>
            <div className="popup-wrapper">
                <div className="popup-card surface-card">
                    <header className="popup-header">
                        <div>
                            <span className="pill pill--accent">BookmarkHub</span>
                            <h1>书签同步中心</h1>
                            <p className="popup-header__subtitle">
                                快速同步、备份并保持浏览器书签整洁。
                            </p>
                        </div>
                        <div className="count-stack">
                            <div className="count-chip">
                                <span>Local</span>
                                <strong>{count["local"]}</strong>
                            </div>
                            <div className="count-chip count-chip--remote">
                                <span>Remote</span>
                                <strong>{count["remote"]}</strong>
                            </div>
                        </div>
                    </header>

                    {statusMessage.text && (
                        <div className={`status-banner status-banner--${statusMessage.type}`}>
                            {statusMessage.text}
                        </div>
                    )}

                    <section className="popup-section">
                        <div className="section-heading">
                            <h2>上传配置</h2>
                            <p>将当前浏览器书签推送到 Gist，可选择去重清理重复链接。</p>
                        </div>
                        <ToggleRow
                            id="toggle-upload-dedupe"
                            label="上传时去除重复书签"
                            description="仅保留每个网址的第一条记录"
                            checked={deduplicateOnUpload}
                            onChange={setDeduplicateOnUpload}
                        />
                        <button
                            className="action-button"
                            title={browser.i18n.getMessage('uploadBookmarksDesc')}
                            onClick={() => handleOperation('upload', '上传')}
                        >
                            <AiOutlineCloudUpload />
                            <div>
                                <span>{browser.i18n.getMessage('uploadBookmarks')}</span>
                                {enableMultiBrowser && (
                                    <small>当前浏览器：{currentBrowser}</small>
                                )}
                            </div>
                        </button>
                    </section>

                    <section className="popup-section">
                        <div className="section-heading">
                            <h2>下载配置</h2>
                            <p>从云端拉取书签，可选择目标配置文件与同步策略。</p>
                        </div>

                        {showFileSelector && (
                            <div className="file-selector">
                                <label htmlFor="fileSelect">选择配置文件</label>
                                <div className="file-selector__controls">
                                    <select
                                        id="fileSelect"
                                        value={selectedFile}
                                        onChange={(e) => setSelectedFile(e.target.value)}
                                    >
                                        <option value="">当前浏览器配置</option>
                                        {availableFiles.map(file => (
                                            <option key={file.fileName} value={file.fileName}>
                                                {file.fileName}
                                                {file.bookmarkCount > 0 ? ` · ${file.bookmarkCount} 条` : ' · 空文件'}
                                                {file.browserType ? ` · ${file.browserType}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="ghost-button"
                                        type="button"
                                        title="刷新配置列表"
                                        onClick={loadAvailableFiles}
                                    >
                                        <AiOutlineReload /> 刷新
                                    </button>
                                </div>
                            </div>
                        )}

                        <ToggleRow
                            id="toggle-clear-before-download"
                            label="下载前清空本地书签"
                            description="适合替换整套书签，慎用"
                            checked={clearBeforeDownload}
                            onChange={setClearBeforeDownload}
                        />
                        <ToggleRow
                            id="toggle-download-dedupe"
                            label="下载后去除重复书签"
                            description="避免重复书签混入本地"
                            checked={deduplicateOnDownload}
                            onChange={setDeduplicateOnDownload}
                        />

                        <button
                            className="action-button"
                            title={browser.i18n.getMessage('downloadBookmarksDesc')}
                            onClick={() => handleOperation('download', '下载')}
                        >
                            <AiOutlineCloudDownload />
                            <div>
                                <span>{browser.i18n.getMessage('downloadBookmarks')}</span>
                                {selectedFile && <small>目标文件：{selectedFile}</small>}
                            </div>
                        </button>
                    </section>

                    <section className="popup-section popup-section--compact">
                        <div className="section-heading">
                            <h2>其他操作</h2>
                        </div>
                        <div className="secondary-actions">
                            <button
                                className="danger-button"
                                title={browser.i18n.getMessage('removeAllBookmarksDesc')}
                                onClick={() => handleOperation('removeAll', '清空')}
                            >
                                <AiOutlineClear />
                                <span>{browser.i18n.getMessage('removeAllBookmarks')}</span>
                            </button>
                            <button className="ghost-button" onClick={openOptions}>
                                <AiOutlineSetting />
                                <span>{browser.i18n.getMessage('settings')}</span>
                            </button>
                        </div>
                    </section>

                    {enableMultiBrowser && (
                        <section className="popup-section popup-section--compact">
                            <div className="section-heading">
                                <h2>多浏览器统计</h2>
                                <p>查看不同浏览器的书签数量分布。</p>
                            </div>
                            <div className="browser-counts">
                                <div className="count-chip count-chip--chromium">Chrome <strong>{browserCounts.chrome}</strong></div>
                                <div className="count-chip count-chip--firefox">Firefox <strong>{browserCounts.firefox}</strong></div>
                                <div className="count-chip count-chip--edge">Edge <strong>{browserCounts.edge}</strong></div>
                                <div className="count-chip count-chip--safari">Safari <strong>{browserCounts.safari}</strong></div>
                            </div>
                        </section>
                    )}

                    <footer className="popup-footer">
                        <div className="footer-links">
                            <AiOutlineInfoCircle />
                            <a href="https://github.com/dudor/BookmarkHub" target="_blank" rel="noreferrer">
                                {browser.i18n.getMessage('help')}
                            </a>
                            <span className="dot-separator">•</span>
                            <a href="https://github.com/dudor" target="_blank" rel="noreferrer">
                                <AiOutlineGithub />
                            </a>
                        </div>
                        <div className="footer-hint">保持网络畅通即可完成同步</div>
                    </footer>
                </div>
            </div>
        </IconContext.Provider>
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
);

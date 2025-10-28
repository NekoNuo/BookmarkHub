import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client';
import { Dropdown, Badge, Form } from 'react-bootstrap';
import { IconContext } from 'react-icons'
import {
    AiOutlineCloudUpload, AiOutlineCloudDownload,
    AiOutlineCloudSync, AiOutlineSetting, AiOutlineClear,
    AiOutlineInfoCircle, AiOutlineGithub
} from 'react-icons/ai'
import 'bootstrap/dist/css/bootstrap.min.css';
import './popup.css'

// 文件信息接口
interface FileInfo {
    fileName: string;
    bookmarkCount: number;
    browserType?: string;
    createDate?: number;
    version?: string;
}

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

    useEffect(() => {
        // 保留设置按钮的原有处理方式
        const handleClick = (e: MouseEvent) => {
            let elem = e.target as HTMLInputElement;
            if (elem != null && elem.className === 'dropdown-item' && elem.name === 'setting') {
                browser.runtime.sendMessage({ name: 'setting' });
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [])

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
        <IconContext.Provider value={{ className: 'dropdown-item-icon' }}>
            <Dropdown.Menu show>
                {statusMessage.text && (
                    <>
                        <Dropdown.ItemText>
                            <div style={{
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: statusMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                                color: statusMessage.type === 'success' ? '#155724' : '#721c24',
                                border: `1px solid ${statusMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                                fontSize: '0.9em',
                                textAlign: 'center'
                            }}>
                                {statusMessage.text}
                            </div>
                        </Dropdown.ItemText>
                        <Dropdown.Divider />
                    </>
                )}

                <Dropdown.ItemText style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    marginBottom: '0.5rem'
                }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9em', color: '#495057' }}>
                            📤 上传配置
                        </strong>
                    </div>
                    <Form.Check
                        type="checkbox"
                        id="deduplicateOnUpload"
                        label="去重（删除重复书签）"
                        checked={deduplicateOnUpload}
                        onChange={(e) => setDeduplicateOnUpload(e.target.checked)}
                        style={{ fontSize: '0.85em' }}
                    />
                </Dropdown.ItemText>

                <Dropdown.Item
                    as="button"
                    title={browser.i18n.getMessage('uploadBookmarksDesc')}
                    onClick={() => handleOperation('upload', '上传')}
                >
                    <AiOutlineCloudUpload />{browser.i18n.getMessage('uploadBookmarks')}
                    {enableMultiBrowser && <Badge variant="info" className="ml-2">{currentBrowser}</Badge>}
                    {deduplicateOnUpload && <Badge variant="warning" className="ml-2" style={{ fontSize: '0.7em' }}>去重</Badge>}
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.ItemText style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    marginBottom: '0.5rem'
                }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9em', color: '#495057' }}>
                            📥 下载配置
                        </strong>
                    </div>

                    {showFileSelector && (
                        <Form.Group style={{ marginBottom: '0.5rem' }}>
                            <Form.Label style={{ fontSize: '0.85em', marginBottom: '0.25rem', color: '#6c757d' }}>
                                选择配置文件:
                            </Form.Label>
                            <Form.Control
                                as="select"
                                size="sm"
                                value={selectedFile}
                                onChange={(e) => setSelectedFile(e.target.value)}
                            >
                                <option value="">📱 当前浏览器配置</option>
                                {availableFiles.map(file => (
                                    <option key={file.fileName} value={file.fileName}>
                                        📄 {file.fileName}
                                        {file.bookmarkCount > 0 ? ` (${file.bookmarkCount} 个书签)` : ' (空文件或无效格式)'}
                                        {file.browserType && ` - ${file.browserType}`}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    )}

                    <div style={{
                        borderTop: showFileSelector ? '1px solid #dee2e6' : 'none',
                        paddingTop: showFileSelector ? '0.5rem' : '0'
                    }}>
                        <Form.Check
                            type="checkbox"
                            id="clearBeforeDownload"
                            label="清空现有书签（替换模式）"
                            checked={clearBeforeDownload}
                            onChange={(e) => setClearBeforeDownload(e.target.checked)}
                            style={{ fontSize: '0.85em', marginBottom: '0.25rem' }}
                        />
                        <Form.Check
                            type="checkbox"
                            id="deduplicateOnDownload"
                            label="去重（删除重复书签）"
                            checked={deduplicateOnDownload}
                            onChange={(e) => setDeduplicateOnDownload(e.target.checked)}
                            style={{ fontSize: '0.85em' }}
                        />
                    </div>
                </Dropdown.ItemText>

                <Dropdown.Item
                    as="button"
                    title={browser.i18n.getMessage('downloadBookmarksDesc')}
                    onClick={() => handleOperation('download', '下载')}
                >
                    <AiOutlineCloudDownload />{browser.i18n.getMessage('downloadBookmarks')}
                    {selectedFile && <Badge variant="success" className="ml-2" style={{ fontSize: '0.7em' }}>
                        {selectedFile}
                    </Badge>}
                    {deduplicateOnDownload && <Badge variant="warning" className="ml-2" style={{ fontSize: '0.7em' }}>去重</Badge>}
                </Dropdown.Item>
                <Dropdown.Item
                    as="button"
                    title={browser.i18n.getMessage('removeAllBookmarksDesc')}
                    onClick={() => handleOperation('removeAll', '清空')}
                >
                    <AiOutlineClear />{browser.i18n.getMessage('removeAllBookmarks')}
                </Dropdown.Item>
                <Dropdown.Divider />

                {enableMultiBrowser && (
                    <>
                        <Dropdown.ItemText>
                            <small><strong>多浏览器书签数量:</strong></small>
                        </Dropdown.ItemText>
                        <Dropdown.ItemText style={{ fontSize: '0.85em', paddingLeft: '10px' }}>
                            <Badge variant="primary">Chrome: {browserCounts.chrome}</Badge>{' '}
                            <Badge variant="warning">Firefox: {browserCounts.firefox}</Badge>{' '}
                            <Badge variant="info">Edge: {browserCounts.edge}</Badge>{' '}
                            <Badge variant="secondary">Safari: {browserCounts.safari}</Badge>
                        </Dropdown.ItemText>
                        <Dropdown.Divider />
                    </>
                )}

                <Dropdown.Item name='setting' as="button">
                    <AiOutlineSetting />{browser.i18n.getMessage('settings')}
                </Dropdown.Item>
                <Dropdown.ItemText>
                    <AiOutlineInfoCircle /><a href="https://github.com/dudor/BookmarkHub" target="_blank">{browser.i18n.getMessage('help')}</a>|
                    <Badge id="localCount" variant="light" title={browser.i18n.getMessage('localCount')}>{count["local"]}</Badge>/
                    <Badge id="remoteCount" variant="light" title={browser.i18n.getMessage('remoteCount')}>{count["remote"]}</Badge>|
                    <a href="https://github.com/dudor" target="_blank" title={browser.i18n.getMessage('author')}><AiOutlineGithub /></a>
                </Dropdown.ItemText>
            </Dropdown.Menu >
        </IconContext.Provider>
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
);



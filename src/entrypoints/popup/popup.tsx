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

    useEffect(() => {
        document.addEventListener('click', (e: MouseEvent) => {
            let elem = e.target as HTMLInputElement;
            if (elem != null && elem.className === 'dropdown-item') {
                elem.setAttribute('disabled', 'disabled');
                const message: any = { name: elem.name };

                // 如果是下载操作且选择了文件，传递文件名
                if (elem.name === 'download' && selectedFile) {
                    message.fileName = selectedFile;
                }

                browser.runtime.sendMessage(message)
                    .then((res) => {
                        elem.removeAttribute('disabled');
                        console.log("msg", Date.now())
                        // 刷新数据
                        loadCounts();
                    })
                    .catch(c => {
                        console.log("error", c)
                    });
            }
        });
    }, [selectedFile])

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
                <Dropdown.Item name='upload' as="button" title={browser.i18n.getMessage('uploadBookmarksDesc')}>
                    <AiOutlineCloudUpload />{browser.i18n.getMessage('uploadBookmarks')}
                    {enableMultiBrowser && <Badge variant="info" className="ml-2">{currentBrowser}</Badge>}
                </Dropdown.Item>

                {showFileSelector && (
                    <Dropdown.ItemText>
                        <Form.Group style={{ marginBottom: '0.5rem' }}>
                            <Form.Label style={{ fontSize: '0.85em', marginBottom: '0.25rem' }}>
                                <strong>选择要下载的配置:</strong>
                            </Form.Label>
                            <Form.Control
                                as="select"
                                size="sm"
                                value={selectedFile}
                                onChange={(e) => setSelectedFile(e.target.value)}
                            >
                                <option value="">当前浏览器配置</option>
                                {availableFiles.map(file => (
                                    <option key={file.fileName} value={file.fileName}>
                                        {file.fileName} ({file.bookmarkCount} 个书签)
                                        {file.browserType && ` - ${file.browserType}`}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Dropdown.ItemText>
                )}

                <Dropdown.Item name='download' as="button" title={browser.i18n.getMessage('downloadBookmarksDesc')}>
                    <AiOutlineCloudDownload />{browser.i18n.getMessage('downloadBookmarks')}
                    {selectedFile && <Badge variant="success" className="ml-2" style={{ fontSize: '0.7em' }}>
                        {selectedFile}
                    </Badge>}
                </Dropdown.Item>
                <Dropdown.Item name='removeAll' as="button" title={browser.i18n.getMessage('removeAllBookmarksDesc')}>
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



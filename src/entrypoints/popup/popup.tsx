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

const Popup: React.FC = () => {
    const [count, setCount] = useState({ local: "0", remote: "0" })
    const [enableMultiBrowser, setEnableMultiBrowser] = useState(false)
    const [currentBrowser, setCurrentBrowser] = useState("unknown")
    const [browserCounts, setBrowserCounts] = useState<Record<string, string>>({})

    useEffect(() => {
        document.addEventListener('click', (e: MouseEvent) => {
            let elem = e.target as HTMLInputElement;
            if (elem != null && elem.className === 'dropdown-item') {
                elem.setAttribute('disabled', 'disabled');
                browser.runtime.sendMessage({ name: elem.name })
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

    useEffect(() => {
        loadCounts();
    }, [])
    return (
        <IconContext.Provider value={{ className: 'dropdown-item-icon' }}>
            <Dropdown.Menu show>
                <Dropdown.Item name='upload' as="button" title={browser.i18n.getMessage('uploadBookmarksDesc')}>
                    <AiOutlineCloudUpload />{browser.i18n.getMessage('uploadBookmarks')}
                    {enableMultiBrowser && <Badge variant="info" className="ml-2">{currentBrowser}</Badge>}
                </Dropdown.Item>
                <Dropdown.Item name='download' as="button" title={browser.i18n.getMessage('downloadBookmarksDesc')}>
                    <AiOutlineCloudDownload />{browser.i18n.getMessage('downloadBookmarks')}
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



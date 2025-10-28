import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/theme.css';
import './options.css'
import optionsStorage from '../../utils/optionsStorage'

const OptionsPage: React.FC = () => {
    useEffect(() => {
        optionsStorage.syncForm('#formOptions');
    }, [])

    return (
        <div className="options-wrapper">
            <div className="options-card surface-card">
                <header className="options-header">
                    <div>
                        <span className="pill pill--accent">BookmarkHub</span>
                        <h1>扩展设置中心</h1>
                        <p>配置 GitHub 凭据、同步策略与多浏览器选项。</p>
                    </div>
                    <div className="options-meta">
                        <span className="pill">版本 {browser.runtime.getManifest().version}</span>
                    </div>
                </header>

                <main className="options-content">
                    <form id='formOptions' name='formOptions'>
                        <section className="options-section">
                            <div className="section-heading">
                                <h2>GitHub 连接</h2>
                                <p>使用拥有 Gist 权限的 GitHub Token，并指定用于同步的 Gist。</p>
                            </div>

                            <div className="input-row">
                                <label htmlFor="githubToken">{browser.i18n.getMessage('githubToken')}</label>
                                <div className="input-row__field">
                                    <input
                                        id="githubToken"
                                        name="githubToken"
                                        type="text"
                                        placeholder="github token"
                                        autoComplete="off"
                                    />
                                    <a
                                        className="ghost-button"
                                        href="https://github.com/settings/tokens/new"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        生成 Token
                                    </a>
                                </div>
                                <span className="input-row__hint">确保勾选 gist 权限，Token 将仅保存在本地。</span>
                            </div>

                            <div className="input-row">
                                <label htmlFor="gistID">{browser.i18n.getMessage('gistID')}</label>
                                <input
                                    id="gistID"
                                    name="gistID"
                                    type="text"
                                    placeholder="gist id"
                                    autoComplete="off"
                                />
                                <span className="input-row__hint">输入目标 Gist 的 ID（URL 最后的字符串）。</span>
                            </div>

                            <div className="input-row">
                                <label htmlFor="gistFileName">{browser.i18n.getMessage('gistFileName')}</label>
                                <input
                                    id="gistFileName"
                                    name="gistFileName"
                                    type="text"
                                    placeholder="bookmarks.json"
                                    autoComplete="off"
                                />
                                <span className="input-row__hint">默认文件名为 BookmarkHub，可根据用途调整。</span>
                            </div>
                        </section>

                        <section className="options-section">
                            <div className="section-heading">
                                <h2>同步偏好</h2>
                                <p>根据日常使用场景调整提醒、去重与自动同步策略。</p>
                            </div>

                            <label className="toggle-row" htmlFor="enableNotify">
                                <input id="enableNotify" name="enableNotify" type="checkbox" />
                                <span className="toggle-row__indicator" />
                                <span className="toggle-row__content">
                                    <span className="toggle-row__label">{browser.i18n.getMessage('enableNotifications')}</span>
                                    <span className="toggle-row__description">同步完成后在浏览器右上角显示提醒。</span>
                                </span>
                            </label>

                            <label className="toggle-row" htmlFor="enableMultiBrowser">
                                <input id="enableMultiBrowser" name="enableMultiBrowser" type="checkbox" />
                                <span className="toggle-row__indicator" />
                                <span className="toggle-row__content">
                                    <span className="toggle-row__label">启用多浏览器模式</span>
                                    <span className="toggle-row__description">为不同浏览器分别存储书签（如 bookmarks-chrome.json）。</span>
                                </span>
                            </label>

                            <label className="toggle-row" htmlFor="useCustomFileName">
                                <input id="useCustomFileName" name="useCustomFileName" type="checkbox" />
                                <span className="toggle-row__indicator" />
                                <span className="toggle-row__content">
                                    <span className="toggle-row__label">使用自定义文件名</span>
                                    <span className="toggle-row__description">多浏览器模式下使用下方自定义名称替代自动命名。</span>
                                </span>
                            </label>

                            <div className="input-row">
                                <label htmlFor="customFileName">自定义文件名</label>
                                <input
                                    id="customFileName"
                                    name="customFileName"
                                    type="text"
                                    placeholder="work / travel / personal"
                                />
                                <span className="input-row__hint">例如 family、work 或 laptop，以区分不同场景。</span>
                            </div>
                        </section>

                        <section className="options-section">
                            <div className="section-heading">
                                <h2>自动同步</h2>
                                <p>定时上传可避免遗漏手动备份，建议在常用设备上开启。</p>
                            </div>

                            <label className="toggle-row" htmlFor="enableAutoSync">
                                <input id="enableAutoSync" name="enableAutoSync" type="checkbox" />
                                <span className="toggle-row__indicator" />
                                <span className="toggle-row__content">
                                    <span className="toggle-row__label">启用定时上传</span>
                                    <span className="toggle-row__description">按照设定间隔自动把最新书签同步到 Gist。</span>
                                </span>
                            </label>

                            <div className="input-row">
                                <label htmlFor="autoSyncInterval">上传间隔</label>
                                <select id="autoSyncInterval" name="autoSyncInterval">
                                    <option value="15">15 分钟</option>
                                    <option value="30">30 分钟</option>
                                    <option value="60">1 小时</option>
                                    <option value="360">6 小时</option>
                                    <option value="720">12 小时</option>
                                    <option value="1440">24 小时</option>
                                </select>
                                <span className="input-row__hint">根据设备使用频率灵活调整同步节奏。</span>
                            </div>
                        </section>

                        <footer className="options-footer">
                            <a
                                className="ghost-button"
                                href="https://github.com/dudor/BookmarkHub"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <span>{browser.i18n.getMessage('help')}</span>
                            </a>
                            <p>表单修改会自动保存，无需额外操作。</p>
                        </footer>
                    </form>
                </main>
            </div>
        </div >
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <OptionsPage />
    </React.StrictMode>,
  );
  

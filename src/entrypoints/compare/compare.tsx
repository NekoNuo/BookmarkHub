import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AiOutlineArrowLeft, AiOutlineDelete, AiOutlinePlus, AiOutlineCheckCircle } from 'react-icons/ai'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../../assets/theme.css'
import './compare.css'

// 书签项接口
interface BookmarkItem {
    id?: string
    title: string
    url: string
    path: string // 文件夹路径
}

// 对比结果接口
interface CompareResult {
    localOnly: BookmarkItem[]
    remoteOnly: BookmarkItem[]
}

const ComparePage: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [compareResult, setCompareResult] = useState<CompareResult>({ localOnly: [], remoteOnly: [] })
    const [selectedLocal, setSelectedLocal] = useState<Set<string>>(new Set())
    const [selectedRemote, setSelectedRemote] = useState<Set<string>>(new Set())
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' })

    // 加载对比数据
    useEffect(() => {
        loadCompareData()
    }, [])

    const loadCompareData = async () => {
        setLoading(true)
        try {
            const result = await browser.runtime.sendMessage({ name: 'compareBookmarks' })
            console.log('[ComparePage] 对比结果:', result)
            setCompareResult(result)
        } catch (err) {
            console.error('[ComparePage] 加载失败:', err)
            showMessage('加载对比数据失败', 'error')
        } finally {
            setLoading(false)
        }
    }

    const showMessage = (text: string, type: 'success' | 'error') => {
        setStatusMessage({ text, type })
        setTimeout(() => {
            setStatusMessage({ text: '', type: '' })
        }, 3000)
    }

    // 全选/取消全选 - 本地
    const toggleSelectAllLocal = () => {
        if (selectedLocal.size === compareResult.localOnly.length) {
            setSelectedLocal(new Set())
        } else {
            setSelectedLocal(new Set(compareResult.localOnly.map((_, idx) => idx.toString())))
        }
    }

    // 全选/取消全选 - 远程
    const toggleSelectAllRemote = () => {
        if (selectedRemote.size === compareResult.remoteOnly.length) {
            setSelectedRemote(new Set())
        } else {
            setSelectedRemote(new Set(compareResult.remoteOnly.map((_, idx) => idx.toString())))
        }
    }

    // 切换单个选择 - 本地
    const toggleLocalItem = (index: string) => {
        const newSet = new Set(selectedLocal)
        if (newSet.has(index)) {
            newSet.delete(index)
        } else {
            newSet.add(index)
        }
        setSelectedLocal(newSet)
    }

    // 切换单个选择 - 远程
    const toggleRemoteItem = (index: string) => {
        const newSet = new Set(selectedRemote)
        if (newSet.has(index)) {
            newSet.delete(index)
        } else {
            newSet.add(index)
        }
        setSelectedRemote(newSet)
    }

    // 删除选中的本地书签
    const deleteSelectedLocal = async () => {
        if (selectedLocal.size === 0) return

        const bookmarksToDelete = Array.from(selectedLocal).map(idx => 
            compareResult.localOnly[parseInt(idx)]
        )

        setLoading(true)
        try {
            const result = await browser.runtime.sendMessage({
                name: 'deleteLocalBookmarks',
                bookmarks: bookmarksToDelete
            })

            if (result.success) {
                showMessage(`成功删除 ${result.deletedCount} 个书签`, 'success')
                setSelectedLocal(new Set())
                // 重新加载对比数据
                await loadCompareData()
            } else {
                showMessage('删除失败: ' + (result.error || '未知错误'), 'error')
            }
        } catch (err: any) {
            console.error('[deleteSelectedLocal] 错误:', err)
            showMessage('删除失败: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    // 添加选中的远程书签到本地
    const addSelectedRemote = async () => {
        if (selectedRemote.size === 0) return

        const bookmarksToAdd = Array.from(selectedRemote).map(idx => 
            compareResult.remoteOnly[parseInt(idx)]
        )

        setLoading(true)
        try {
            const result = await browser.runtime.sendMessage({
                name: 'addRemoteBookmarksToLocal',
                bookmarks: bookmarksToAdd
            })

            if (result.success) {
                showMessage(`成功添加 ${result.addedCount} 个书签`, 'success')
                setSelectedRemote(new Set())
                // 重新加载对比数据
                await loadCompareData()
            } else {
                showMessage('添加失败: ' + (result.error || '未知错误'), 'error')
            }
        } catch (err: any) {
            console.error('[addSelectedRemote] 错误:', err)
            showMessage('添加失败: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="compare-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}

            {statusMessage.text && (
                <div className={`status-message ${statusMessage.type}`}>
                    {statusMessage.text}
                </div>
            )}

            <button
                className="back-button"
                onClick={() => window.close()}
            >
                <AiOutlineArrowLeft />
                返回
            </button>

            <div className="compare-header">
                <h1>📊 书签对比</h1>
                <p>对比本地和远程书签的差异，选择性同步</p>
            </div>

            <div className="compare-stats">
                <div className="stat-card local-only">
                    <h3>本地独有</h3>
                    <div className="count">{compareResult.localOnly.length}</div>
                </div>
                <div className="stat-card remote-only">
                    <h3>远程独有</h3>
                    <div className="count">{compareResult.remoteOnly.length}</div>
                </div>
            </div>

            <div className="compare-grid">
                {/* 本地独有书签 */}
                <div className="compare-panel">
                    <div className="panel-header local">
                        <h2>🏠 本地独有书签</h2>
                        <label className="select-all">
                            <input
                                type="checkbox"
                                checked={selectedLocal.size === compareResult.localOnly.length && compareResult.localOnly.length > 0}
                                onChange={toggleSelectAllLocal}
                            />
                            全选
                        </label>
                    </div>
                    <div className="bookmark-list">
                        {compareResult.localOnly.length === 0 ? (
                            <div className="empty-state">
                                <AiOutlineCheckCircle size={64} />
                                <p>没有本地独有的书签</p>
                            </div>
                        ) : (
                            compareResult.localOnly.map((bookmark, index) => (
                                <div key={index} className="bookmark-item">
                                    <div className="bookmark-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedLocal.has(index.toString())}
                                            onChange={() => toggleLocalItem(index.toString())}
                                        />
                                    </div>
                                    <div className="bookmark-info">
                                        <div className="bookmark-title">{bookmark.title || '无标题'}</div>
                                        <div className="bookmark-url">{bookmark.url}</div>
                                        {bookmark.path && <div className="bookmark-path">{bookmark.path}</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="action-bar">
                        <button
                            className="action-button delete"
                            disabled={selectedLocal.size === 0}
                            onClick={deleteSelectedLocal}
                        >
                            <AiOutlineDelete />
                            删除选中 ({selectedLocal.size})
                        </button>
                    </div>
                </div>

                {/* 远程独有书签 */}
                <div className="compare-panel">
                    <div className="panel-header remote">
                        <h2>☁️ 远程独有书签</h2>
                        <label className="select-all">
                            <input
                                type="checkbox"
                                checked={selectedRemote.size === compareResult.remoteOnly.length && compareResult.remoteOnly.length > 0}
                                onChange={toggleSelectAllRemote}
                            />
                            全选
                        </label>
                    </div>
                    <div className="bookmark-list">
                        {compareResult.remoteOnly.length === 0 ? (
                            <div className="empty-state">
                                <AiOutlineCheckCircle size={64} />
                                <p>没有远程独有的书签</p>
                            </div>
                        ) : (
                            compareResult.remoteOnly.map((bookmark, index) => (
                                <div key={index} className="bookmark-item">
                                    <div className="bookmark-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedRemote.has(index.toString())}
                                            onChange={() => toggleRemoteItem(index.toString())}
                                        />
                                    </div>
                                    <div className="bookmark-info">
                                        <div className="bookmark-title">{bookmark.title || '无标题'}</div>
                                        <div className="bookmark-url">{bookmark.url}</div>
                                        {bookmark.path && <div className="bookmark-path">{bookmark.path}</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="action-bar">
                        <button
                            className="action-button add"
                            disabled={selectedRemote.size === 0}
                            onClick={addSelectedRemote}
                        >
                            <AiOutlinePlus />
                            添加到本地 ({selectedRemote.size})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<ComparePage />)


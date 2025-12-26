// frontend/src/components/chat/header/ChatHeader.jsx
import { FaVideo, FaPhone, FaUsers, FaSearch, FaEllipsisV, FaTimes, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { HeaderButton } from '../common/ChatComponents';

export default function ChatHeader({
    selectedChat,
    selectedChannel,
    selectedTeam,
    showGeminiChat,
    showSearch,
    setShowSearch,
    showHeaderMenu,
    setShowHeaderMenu,
    setShowContactInfo,
    setSelectedChat,
    setMessages,
    setSelectedChannel,
    searchQuery,
    setSearchQuery,
    fetchRecentChats,
    api,
    handleComingSoon,
    getCurrentName,
    getCurrentAvatar
}) {
    return (
        <>
            {/* Header */}
            <div className="h-14 border-b border-[#3b3b3b] flex items-center justify-between px-4 bg-[#1f1f1f]">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-[#2b2b2b]/50 px-2 py-1 rounded transition-colors"
                    onClick={() => !showGeminiChat && setShowContactInfo(true)}
                >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold ${showGeminiChat ? 'bg-gradient-to-br from-blue-400 to-cyan-400' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                        {getCurrentAvatar()}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{getCurrentName()}</h3>
                        {selectedChannel && <span className="text-xs text-gray-500">{selectedChannel.description || 'Team Channel'}</span>}
                        {showGeminiChat && <span className="text-xs text-gray-500">AI Assistant powered by Gemini</span>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!showGeminiChat && (
                        <>
                            <HeaderButton icon={<FaVideo />} label="Meet" onClick={() => handleComingSoon('Video Meeting')} />
                            <HeaderButton icon={<FaPhone />} label="Call" onClick={() => handleComingSoon('Voice Call')} />
                            <HeaderButton icon={<FaUsers />} label={`${selectedChannel?.member_count || selectedTeam?.member_count || '0'}`} onClick={() => { }} />
                        </>
                    )}
                    <HeaderButton icon={<FaSearch />} onClick={() => setShowSearch(!showSearch)} />
                    <HeaderButton icon={<FaEllipsisV />} onClick={() => setShowHeaderMenu(!showHeaderMenu)} dataAttr="data-header-menu-button" />
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && !showGeminiChat && (
                <div className="px-4 py-2 bg-[#2b2b2b] border-b border-[#3b3b3b]">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:outline-none focus:border-purple-500"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Header Menu Dropdown */}
            {showHeaderMenu && !showGeminiChat && (
                <div data-header-menu className="absolute top-14 right-4 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg shadow-2xl z-50 min-w-[220px] animate-[scaleIn_0.15s_ease-out]">
                    <div className="py-1">
                        <button onClick={() => { setShowContactInfo(true); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                            <span>Contact info</span>
                        </button>
                        <button onClick={() => { toast.info('Select messages to forward or delete'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <span>Select messages</span>
                        </button>
                        <button onClick={() => { toast.info('Notifications muted'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <span>Mute notifications</span>
                        </button>
                        <button onClick={() => { toast.info('Disappearing messages enabled'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>Disappearing messages</span>
                        </button>
                        <button onClick={() => { toast.info('Chat locked'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <span>Lock chat</span>
                        </button>
                        <div className="border-t border-[#3b3b3b] my-1"></div>
                        {selectedChat && (
                            <>
                                <button
                                    onClick={() => {
                                        setSelectedChat(null);
                                        setMessages([]);
                                        setShowHeaderMenu(false);
                                        toast.info('Chat closed');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    <span>Close chat</span>
                                </button>
                                <button
                                    onClick={() => {
                                        toast.info('User reported');
                                        setShowHeaderMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span>Report</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Block this user? They will not be able to message you.')) {
                                            toast.success('User blocked');
                                            setShowHeaderMenu(false);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    <span>Block</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('Clear all messages in this chat?')) {
                                            try {
                                                await api.delete(`/api/teams/direct-messages/${selectedChat.other_user_id}/clear`);
                                                setMessages([]);
                                                fetchRecentChats();
                                                toast.success('Chat cleared');
                                                setShowHeaderMenu(false);
                                            } catch (err) {
                                                toast.error('Failed to clear chat');
                                                console.error(err);
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    <span>Clear chat</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('Delete this chat? This cannot be undone.')) {
                                            try {
                                                await api.delete(`/api/teams/direct-messages/${selectedChat.other_user_id}/delete`);
                                                fetchRecentChats();
                                                toast.info('Chat deleted');
                                                setSelectedChat(null);
                                                setMessages([]);
                                                setShowHeaderMenu(false);
                                            } catch (err) {
                                                toast.error('Failed to delete chat');
                                                console.error(err);
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <FaTrash className="w-4 h-4" />
                                    <span>Delete chat</span>
                                </button>
                            </>
                        )}
                        {selectedChannel && (
                            <>
                                <button
                                    onClick={async () => {
                                        if (confirm('Clear all messages in this channel?')) {
                                            try {
                                                await api.delete(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/clear`);
                                                setMessages([]);
                                                toast.success('Channel cleared');
                                                setShowHeaderMenu(false);
                                            } catch (err) {
                                                toast.error('Failed to clear channel');
                                                console.error(err);
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    <span>Clear chat</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Exit ${selectedChannel.name}? You will no longer receive messages.`)) {
                                            toast.info('Left channel');
                                            setSelectedChannel(null);
                                            setMessages([]);
                                            setShowHeaderMenu(false);
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    <span>Exit channel</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

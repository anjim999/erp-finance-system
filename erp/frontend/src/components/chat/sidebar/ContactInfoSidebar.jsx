// frontend/src/components/chat/ContactInfoSidebar.jsx
import { FaTimes, FaSearch, FaStar, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function ContactInfoSidebar({
    show,
    selectedChat,
    selectedChannel,
    setShowStarredView,
    setSelectedChat,
    setMessages,
    onClose
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
            <div
                className="w-full max-w-md bg-[#1f1f1f] h-full overflow-y-auto animate-[slideInRight_0.3s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#1f1f1f] px-4 py-3 flex items-center gap-3 border-b border-[#3b3b3b]">
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                    <h2 className="flex-1 text-lg font-normal text-white">Contact info</h2>
                    <button className="text-white hover:text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center text-center bg-[#1f1f1f] py-8 px-6">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-7xl font-bold mb-4">
                            {selectedChat ? selectedChat.other_user_name?.[0] : selectedChannel?.name?.[0]}
                        </div>
                        <h3 className="text-2xl font-normal text-white mb-2">
                            {selectedChat ? selectedChat.other_user_name : selectedChannel?.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {selectedChat?.other_user_email || '+91 97777 86943'}
                        </p>
                    </div>

                    {/* Search Button */}
                    <div className="bg-[#1f1f1f] px-6 pb-4">
                        <button className="w-full bg-[#2b2b2b] hover:bg-[#3b3b3b] rounded-lg py-3 flex items-center justify-center gap-2 text-white transition-colors">
                            <FaSearch className="text-gray-400" />
                            <span>Search</span>
                        </button>
                    </div>

                    {/* About Section */}
                    <div className="bg-[#1f1f1f] px-6 py-4 mt-2">
                        <p className="text-gray-500 text-xs mb-2">About</p>
                        <p className="text-white text-sm">Hey there! I am using WhatsApp.</p>
                    </div>

                    {/* Media, Links and Docs */}
                    <div className="bg-[#1f1f1f] px-6 py-4 mt-2">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white">Media, links and docs</span>
                            </div>
                            <span className="text-gray-500 text-sm">79 &gt;</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-20 h-20 bg-[#2b2b2b] rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Starred Messages */}
                    <div className="bg-[#1f1f1f] mt-2">
                        <button
                            onClick={() => {
                                setShowStarredView(true);
                                onClose();
                            }}
                            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors"
                        >
                            <FaStar className="text-gray-400" />
                            <span className="flex-1 text-left text-white">Starred messages</span>
                            <span className="text-gray-500 text-sm">&gt;</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-2 bg-[#0d0d0d] mt-2"></div>

                    {/* More Options */}
                    <div className="bg-[#1f1f1f]">
                        <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <div className="flex-1 text-left">
                                <p className="text-white">Mute notifications</p>
                                <p className="text-xs text-gray-500">Off</p>
                            </div>
                        </button>
                        <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1 text-left">
                                <p className="text-white">Disappearing messages</p>
                                <p className="text-xs text-gray-500">Off</p>
                            </div>
                        </button>
                        <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <div className="flex-1 text-left">
                                <p className="text-white">Encryption</p>
                                <p className="text-xs text-gray-500">Messages are end-to-end encrypted. Click to verify.</p>
                            </div>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-2 bg-[#0d0d0d] mt-2"></div>

                    {/* Danger Zone */}
                    <div className="bg-[#1f1f1f] pb-8">
                        <button className="w-full px-6 py-4 text-left text-red-400 hover:bg-[#2b2b2b] transition-colors">
                            Block {selectedChat?.other_user_name || 'contact'}
                        </button>
                        <button className="w-full px-6 py-4 text-left text-red-400 hover:bg-[#2b2b2b] transition-colors">
                            Report contact
                        </button>
                        {selectedChat && (
                            <button
                                onClick={() => {
                                    if (confirm('Delete this chat? This cannot be undone.')) {
                                        setSelectedChat(null);
                                        setMessages([]);
                                        onClose();
                                        toast.success('Chat deleted');
                                    }
                                }}
                                className="w-full px-6 py-4 text-left text-red-400 hover:bg-[#2b2b2b] transition-colors"
                            >
                                Delete chat
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

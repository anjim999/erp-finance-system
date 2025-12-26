// frontend/src/components/chat/StarredMessagesView.jsx
import { FaStar, FaEllipsisV } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function StarredMessagesView({
    show,
    starredMessages,
    setStarredMessages,
    currentUserId,
    onClose
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-[#1b1b1b] z-50 flex flex-col">
            {/* Header */}
            <div className="bg-[#2b2b2b] px-4 py-4 flex items-center gap-3 border-b border-[#3b3b3b]">
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 className="text-lg font-semibold text-white">Starred messages</h2>
                <button className="ml-auto text-gray-400 hover:text-white">
                    <FaEllipsisV />
                </button>
            </div>

            {/* Starred Messages List */}
            <div className="flex-1 overflow-y-auto">
                {starredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <FaStar className="text-6xl text-gray-600 mb-4" />
                        <p className="text-gray-400 mb-2">No starred messages</p>
                        <p className="text-sm text-gray-500">
                            Tap and hold on any message to star it
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 p-4">
                        {starredMessages.map((msg, idx) => {
                            const isMe = msg.sender_id === currentUserId;
                            const msgDate = msg.created_at ? new Date(msg.created_at) : new Date();
                            const timeDisplay = format(msgDate, 'MMM d, h:mm a');

                            return (
                                <div key={msg.id || idx} className="bg-[#2b2b2b] rounded-lg p-3 border border-[#3b3b3b]">
                                    {/* Sender info */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-orange-500 to-pink-500'
                                            } text-white flex-shrink-0`}>
                                            {msg.sender_name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-sm">{msg.sender_name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{timeDisplay}</p>
                                        </div>
                                        <FaStar className="w-4 h-4 text-yellow-400" />
                                    </div>

                                    {/* Message content */}
                                    <div className="text-gray-200 text-sm pl-10">
                                        {msg.content}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-2 pl-10">
                                        <button
                                            onClick={() => {
                                                // Unstar message
                                                setStarredMessages(prev => prev.filter(m => m.id !== msg.id));
                                                toast.info('Message unstarred');
                                            }}
                                            className="text-xs text-gray-400 hover:text-yellow-400"
                                        >
                                            Unstar
                                        </button>
                                        <button
                                            onClick={() => {
                                                onClose();
                                                // Scroll to message
                                                setTimeout(() => {
                                                    const element = document.getElementById(`msg-${msg.id}`);
                                                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 300);
                                            }}
                                            className="text-xs text-gray-400 hover:text-purple-400"
                                        >
                                            Jump to message
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

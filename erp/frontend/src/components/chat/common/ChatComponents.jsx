// frontend/src/components/chat/ChatComponents.jsx
import { formatDistanceToNow } from 'date-fns';
import { FaImage, FaVideo, FaFile } from 'react-icons/fa';

export function NavItem({ icon, label, active, onClick, badge }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-md mb-1 transition-colors relative ${active ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:bg-[#3b3b3b] hover:text-white'
                }`}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-[10px] mt-0.5">{label}</span>
            {badge && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {badge}
                </span>
            )}
        </button>
    );
}

export function TabButton({ children, active, onClick, badge }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors relative ${active ? 'bg-[#3b3b3b] text-white' : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-white'
                }`}
        >
            {children}
            {badge > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
}

export function QuickAction({ icon, label, onClick, count }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2b2b] transition-colors"
        >
            <span className="text-purple-400">{icon}</span>
            <span className="text-sm flex-1 text-left">{label}</span>
            {count > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{count}</span>
            )}
        </button>
    );
}

export function ChatItem({ chat, selected, onClick, currentUserId }) {
    const isMyLastMessage = chat.last_sender_id === currentUserId;

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${selected ? 'bg-[#4a4a6a]' : 'hover:bg-[#2b2b2b]'
                }`}
        >
            <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                    {chat.other_user_name?.[0] || '?'}
                </div>
                {chat.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {chat.unread_count > 9 ? '9+' : chat.unread_count}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{chat.other_user_name}</p>
                <div className="flex items-center gap-1">
                    {/* Show ticks for any message (text or file) from current user */}
                    {(chat.last_message || chat.last_message_file_type) && isMyLastMessage && (
                        <span className="text-[10px]">
                            {chat.last_message_read ? (
                                <span className="text-blue-400">✓✓</span>
                            ) : chat.last_message_delivered ? (
                                <span className="text-gray-300">✓✓</span>
                            ) : (
                                <span className="text-gray-400">✓</span>
                            )}
                        </span>
                    )}
                    <p className="text-xs text-gray-500 truncate flex-1">
                        {(() => {
                            // Smart preview based on message content and file type
                            const hasText = chat.last_message && chat.last_message.trim().length > 0;
                            const hasFileType = chat.last_message_file_type;

                            // If there's text content, always show it
                            if (hasText) {
                                return chat.last_message;
                            }

                            // No text content - check if it's a file message
                            if (hasFileType) {
                                const isImage = chat.last_message_file_type.startsWith('image/');
                                const isVideo = chat.last_message_file_type.startsWith('video/');
                                const isPDF = chat.last_message_file_type.includes('pdf');
                                const isDoc = !isImage && !isVideo && !isPDF;

                                if (isImage) {
                                    return (
                                        <span className="flex items-center gap-1">
                                            <FaImage className="text-[10px]" />
                                            <span>Photo</span>
                                        </span>
                                    );
                                }

                                if (isVideo) {
                                    return (
                                        <span className="flex items-center gap-1">
                                            <FaVideo className="text-[10px]" />
                                            <span>Video</span>
                                        </span>
                                    );
                                }

                                if (isPDF) {
                                    return (
                                        <span className="flex items-center gap-1">
                                            <FaFile className="text-[10px] text-red-400" />
                                            <span>PDF</span>
                                        </span>
                                    );
                                }

                                if (isDoc) {
                                    return (
                                        <span className="flex items-center gap-1">
                                            <FaFile className="text-[10px]" />
                                            <span>Document</span>
                                        </span>
                                    );
                                }
                            }

                            // No message at all
                            return 'No messages yet';
                        })()}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                {chat.last_message && chat.last_message_at && (
                    <span className={`text-[10px] ${chat.unread_count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: false })}
                    </span>
                )}
            </div>
        </div>
    );
}

export function HeaderButton({ icon, label, onClick, dataAttr }) {
    const buttonProps = {};
    if (dataAttr) {
        buttonProps[dataAttr] = '';
    }

    return (
        <button
            onClick={onClick}
            {...buttonProps}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:bg-[#3b3b3b] rounded-md text-sm transition-colors"
        >
            {icon}
            {label && <span>{label}</span>}
        </button>
    );
}

export function InputButton({ icon, onClick, title, active }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded transition-colors ${active ? 'text-purple-400 bg-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-[#3b3b3b]'}`}
        >
            {icon}
        </button>
    );
}

// frontend/src/components/chat/message/MessageInput.jsx
import { FaImage, FaVideo, FaFile, FaFilePdf, FaPlay, FaTimes, FaAt, FaBold, FaItalic, FaSmile, FaPaperclip, FaLink, FaPaperPlane } from 'react-icons/fa';
import EmojiPicker from './EmojiPicker';
import { InputButton } from '../common/ChatComponents';

export default function MessageInput({
    showEmojiPicker,
    addEmoji,
    replyingTo,
    setReplyingTo,
    auth,
    editingMessage,
    editContent,
    setEditContent,
    handleEditMessage,
    setEditingMessage,
    showMentionDropdown,
    allUsers,
    mentionQuery,
    setNewMessage,
    setShowMentionDropdown,
    setMentionQuery,
    newMessage,
    handleSendMessage,
    setShowEmojiPicker,
    fileInputRef,
    handleFileUpload
}) {
    return (
        <div className="p-4 border-t border-[#3b3b3b]">
            {/* Emoji Picker */}
            <EmojiPicker show={showEmojiPicker} onSelectEmoji={addEmoji} />

            {/* Reply Preview - WhatsApp Style with Advanced Effects */}
            {replyingTo && (
                <div className="mb-3 bg-gradient-to-r from-[#1a1a1a] to-[#252525] rounded-xl overflow-hidden flex items-stretch shadow-lg shadow-black/20 border border-[#333] animate-slideIn">
                    {/* Animated gradient left border */}
                    <div className="w-1.5 bg-gradient-to-b from-green-400 via-green-500 to-emerald-600 flex-shrink-0"></div>

                    {/* Content */}
                    <div className="flex-1 p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            {/* Sender name */}
                            <div className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-1.5">
                                <span>{replyingTo.sender_id === auth.user?.id ? 'You' : replyingTo.sender_name}</span>
                            </div>

                            {/* Content preview based on type */}
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                                {(() => {
                                    const fileUrl = replyingTo.file_url;
                                    const fileName = replyingTo.file_name || '';
                                    const fileType = replyingTo.file_type || '';
                                    const attachments = replyingTo.attachments || [];
                                    const hasDirectFile = fileUrl && fileType;
                                    const hasAttachment = attachments.length > 0;

                                    if (hasDirectFile) {
                                        const isImage = fileType.startsWith('image/');
                                        const isVideo = fileType.startsWith('video/');
                                        const isPdf = fileType === 'application/pdf' || /\.pdf$/i.test(fileName);

                                        if (isImage) {
                                            return (
                                                <>
                                                    <FaImage className="text-blue-400" />
                                                    <span className="text-gray-300">Photo</span>
                                                </>
                                            );
                                        } else if (isVideo) {
                                            return (
                                                <>
                                                    <FaVideo className="text-purple-400" />
                                                    <span className="text-gray-300">Video</span>
                                                </>
                                            );
                                        } else if (isPdf) {
                                            return (
                                                <>
                                                    <FaFilePdf className="text-red-400" />
                                                    <span className="truncate text-gray-300">{fileName}</span>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <FaFile className="text-gray-400" />
                                                    <span className="truncate text-gray-300">{fileName}</span>
                                                </>
                                            );
                                        }
                                    } else if (hasAttachment) {
                                        const attachment = attachments[0];
                                        const attFileName = attachment.name || attachment.original_name || '';
                                        const attFileType = attachment.type || attachment.mime_type || '';
                                        const isImage = attFileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attFileName);
                                        const isVideo = attFileType?.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(attFileName);
                                        const isPdf = attFileType === 'application/pdf' || /\.pdf$/i.test(attFileName);

                                        if (isImage) {
                                            return (
                                                <>
                                                    <FaImage className="text-blue-400" />
                                                    <span className="text-gray-300">Photo</span>
                                                </>
                                            );
                                        } else if (isVideo) {
                                            return (
                                                <>
                                                    <FaVideo className="text-purple-400" />
                                                    <span className="text-gray-300">Video</span>
                                                </>
                                            );
                                        } else if (isPdf) {
                                            return (
                                                <>
                                                    <FaFilePdf className="text-red-400" />
                                                    <span className="truncate text-gray-300">{attFileName}</span>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <FaFile className="text-gray-400" />
                                                    <span className="truncate text-gray-300">{attFileName}</span>
                                                </>
                                            );
                                        }
                                    }

                                    return <span className="truncate text-gray-300">{replyingTo.content}</span>;
                                })()}
                            </div>
                        </div>

                        {/* Thumbnail for images/videos */}
                        {(() => {
                            const fileUrl = replyingTo.file_url;
                            const fileType = replyingTo.file_type || '';
                            const attachments = replyingTo.attachments || [];

                            if (fileUrl && fileType) {
                                const isImage = fileType.startsWith('image/');
                                const isVideo = fileType.startsWith('video/');

                                if (isImage) {
                                    return (
                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-[#444]">
                                            <img
                                                src={fileUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    );
                                } else if (isVideo) {
                                    return (
                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 relative shadow-md border border-[#444]">
                                            <video
                                                src={fileUrl}
                                                className="w-full h-full object-cover"
                                                muted
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <FaPlay className="text-white text-sm" />
                                            </div>
                                        </div>
                                    );
                                }
                            }

                            if (attachments.length > 0) {
                                const attachment = attachments[0];
                                const fileName = attachment.name || attachment.original_name || '';
                                const attFileType = attachment.type || attachment.mime_type || '';
                                const attFileUrl = attachment.url || attachment.path;
                                const isImage = attFileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                const isVideo = attFileType?.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(fileName);

                                if (isImage && attFileUrl) {
                                    return (
                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-[#444]">
                                            <img
                                                src={attFileUrl.startsWith('http') ? attFileUrl : `${import.meta.env.VITE_API_URL || ''}${attFileUrl}`}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    );
                                } else if (isVideo && attFileUrl) {
                                    return (
                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 relative shadow-md border border-[#444]">
                                            <video
                                                src={attFileUrl.startsWith('http') ? attFileUrl : `${import.meta.env.VITE_API_URL || ''}${attFileUrl}`}
                                                className="w-full h-full object-cover"
                                                muted
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <FaPlay className="text-white text-sm" />
                                            </div>
                                        </div>
                                    );
                                }
                            }
                            return null;
                        })()}
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => setReplyingTo(null)}
                        className="px-4 text-gray-500 hover:text-white hover:bg-white/5 transition-all self-stretch flex items-center"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>
            )}

            {/* Edit Mode */}
            {editingMessage && (
                <div className="mb-2 p-3 bg-[#2b2b2b] rounded-lg border border-[#3b3b3b]">
                    <div className="text-xs text-gray-400 mb-2">Editing message</div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleEditMessage()}
                            className="flex-1 px-3 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded text-white focus:outline-none focus:border-purple-500"
                            autoFocus
                        />
                        <button type="button" onClick={handleEditMessage} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white">
                            Save
                        </button>
                        <button type="button" onClick={() => { setEditingMessage(null); setEditContent(''); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="relative">
                {/* Mention Dropdown */}
                {showMentionDropdown && allUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 w-64 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg mb-2 max-h-48 overflow-y-auto z-50">
                        <p className="text-xs text-gray-500 px-3 py-2 border-b border-[#3b3b3b]">Mention someone</p>
                        {allUsers.filter(u => !mentionQuery || u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5).map(user => (
                            <div
                                key={user.id}
                                onClick={() => {
                                    const mentionText = `@${user.name} `;
                                    setNewMessage(prev => prev.replace(/@\w*$/, mentionText));
                                    setShowMentionDropdown(false);
                                    setMentionQuery('');
                                }}
                                className="p-2 hover:bg-[#3b3b3b] cursor-pointer flex items-center gap-2"
                            >
                                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                                    {user.name[0]}
                                </div>
                                <span className="text-sm text-gray-200">{user.name}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="bg-gradient-to-r from-[#1f1f1f] via-[#252525] to-[#1f1f1f] rounded-2xl border border-[#3b3b3b] focus-within:border-purple-500/50 focus-within:shadow-lg focus-within:shadow-purple-500/10 transition-all duration-300">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            const val = e.target.value;
                            setNewMessage(val);
                            const match = val.match(/@(\w*)$/);
                            if (match) {
                                setShowMentionDropdown(true);
                                setMentionQuery(match[1]);
                            } else {
                                setShowMentionDropdown(false);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && newMessage.trim() && !showMentionDropdown) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                            if (e.key === 'Escape') {
                                setShowMentionDropdown(false);
                            }
                        }}
                        placeholder={`Type a message... Use @ to mention`}
                        className="w-full px-5 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none text-[15px]"
                    />
                    <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-0.5">
                            <InputButton icon={<FaAt />} onClick={() => { setNewMessage(prev => prev + '@'); setShowMentionDropdown(true); }} title="Mention" />
                            <InputButton icon={<FaBold />} onClick={() => setNewMessage(prev => prev + '**text**')} title="Bold" />
                            <InputButton icon={<FaItalic />} onClick={() => setNewMessage(prev => prev + '_text_')} title="Italic" />
                            <InputButton icon={<FaSmile />} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji" active={showEmojiPicker} />
                            <InputButton icon={<FaImage />} onClick={() => fileInputRef.current?.click()} title="Image" />
                            <InputButton icon={<FaPaperclip />} onClick={() => fileInputRef.current?.click()} title="Attach" />
                            <InputButton icon={<FaLink />} onClick={() => setNewMessage(prev => prev + '[link](url)')} title="Link" />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:shadow-none"
                        >
                            <FaPaperPlane className="text-sm" />
                        </button>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
            </form>
        </div>
    );
}

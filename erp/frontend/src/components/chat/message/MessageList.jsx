// frontend/src/components/chat/message/MessageList.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaComments, FaPlay, FaDownload, FaFilePdf, FaFile, FaStar, FaReply, FaShare, FaTrash, FaSmile, FaEdit, FaCopy, FaEllipsisV, FaPlus, FaTimes, FaSearch, FaImage, FaVideo, FaPaperclip } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function MessageList({
    // Pinned messages
    pinnedMessages,
    setPinnedMessages,
    // Refs
    messagesContainerRef,
    messagesEndRef,
    // Scroll handler
    handleScroll,
    // Loading states
    loading,
    loadingMore,
    // Messages data
    messages,
    setMessages, // Needed for optimistic updates
    searchQuery,
    // Current user
    auth,
    // Image preview
    setImagePreview,
    // Actions
    setReplyingTo,
    setMessageToDelete,
    setShowDeleteModal,
    addReaction,
    removeReaction,
    setEditingMessage,
    setEditContent,
    handleForwardMessage,
    handleStarMessage, // Renamed from toggleStar to match parent
    starredMessages,
    handleReplyToMessage,
    handleCopyMessage,
    handlePinMessage,
    handleReportMessage,
    // Reactions
    setSelectedMessageReactions,
    setReactionsModalTab,
    setShowReactionsModal,
    fetchReactionDetails,
    lastFetchedReactionMessageIdRef,
    // Message actions
    messageMenuOpen,
    setMessageMenuOpen,
    recentlyUsedEmojis
}) {
    return (
        <>
            {/* Pinned Messages Banner */}
            {pinnedMessages.length > 0 && (
                <div className="bg-[#2b2b2b] border-b border-[#3b3b3b] px-4 py-2">
                    <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                        </svg>
                        <div
                            className="flex-1 min-w-0 cursor-pointer hover:bg-[#3b3b3b]/50 px-2 py-1 rounded transition-colors"
                            onClick={() => {
                                const lastPinned = pinnedMessages[pinnedMessages.length - 1];
                                const element = document.getElementById(`msg-${lastPinned.id}`);
                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                        >
                            <div className="text-xs text-gray-400">📌 Pinned</div>
                            <div className="text-sm text-white truncate">
                                {pinnedMessages[pinnedMessages.length - 1].content}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const lastPinned = pinnedMessages[pinnedMessages.length - 1];
                                setPinnedMessages(prev => prev.filter(m => m.id !== lastPinned.id));
                                toast.info('Message unpinned');
                            }}
                            className="text-gray-400 hover:text-white text-xl px-2"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#3b3b3b #1a1a1a'
                }}
            >
                {/* Loading more indicator at top */}
                {loadingMore && (
                    <div className="flex justify-center py-2">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <FaComments className="text-5xl mb-4 text-gray-600" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    (() => {
                        // Group consecutive images/videos from same sender
                        const filteredMessages = messages.filter(msg => !searchQuery || msg.content?.toLowerCase().includes(searchQuery.toLowerCase()));
                        const processedMessages = [];
                        let i = 0;

                        while (i < filteredMessages.length) {
                            const msg = filteredMessages[i];
                            const isMedia = msg.file_url && (msg.file_type?.startsWith('image/') || msg.file_type?.startsWith('video/'));

                            if (isMedia) {
                                // Start a media group
                                const group = [msg];
                                let j = i + 1;

                                // Continue grouping consecutive media from same sender
                                while (j < filteredMessages.length) {
                                    const nextMsg = filteredMessages[j];
                                    const isNextMedia = nextMsg.file_url && (nextMsg.file_type?.startsWith('image/') || nextMsg.file_type?.startsWith('video/'));
                                    const sameSender = nextMsg.sender_id === msg.sender_id;

                                    if (isNextMedia && sameSender) {
                                        group.push(nextMsg);
                                        j++;
                                    } else {
                                        break; // Stop grouping if text/PDF or different sender
                                    }
                                }

                                // Add as group if 2+ items, otherwise individual
                                if (group.length > 1) {
                                    processedMessages.push({ type: 'media-group', messages: group, sender_id: msg.sender_id, sender_name: msg.sender_name, created_at: msg.created_at, id: `group-${msg.id}` });
                                    i = j;
                                } else {
                                    processedMessages.push({ type: 'single', message: msg });
                                    i++;
                                }
                            } else {
                                // Regular message (text/PDF/doc)
                                processedMessages.push({ type: 'single', message: msg });
                                i++;
                            }
                        }

                        return processedMessages.map((item, idx) => {
                            if (item.type === 'media-group') {
                                // Render media group
                                const isMe = item.sender_id === auth.user?.id;
                                const showAvatar = idx === 0 || processedMessages[idx - 1]?.sender_id !== item.sender_id;
                                const msgDate = item.created_at ? new Date(item.created_at) : new Date();
                                const isToday = new Date().toDateString() === msgDate.toDateString();
                                const timeDisplay = isToday ? format(msgDate, 'h:mm a') : format(msgDate, 'MMM d, h:mm a');

                                return (
                                    <div key={item.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                                        {showAvatar ? (
                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${isMe ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'}`}>
                                                {item.sender_name?.[0] || '?'}
                                            </div>
                                        ) : (
                                            <div className="w-8" />
                                        )}
                                        <div className={`max-w-[60%] min-w-0 ${isMe ? 'items-end' : 'items-start'} relative`}>
                                            {/* Media Grid with Container */}
                                            <div className={`p-1 rounded-lg ${isMe ? 'bg-gradient-to-br from-blue-600/40 to-purple-600/40' : 'bg-[#1e1e2e]'} relative`}>
                                                <div className={`grid gap-1 ${item.messages.length === 2 ? 'grid-cols-2' : item.messages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} w-full max-w-[300px]`}>
                                                    {item.messages.slice(0, 4).map((media, mediaIdx) => {
                                                        return (
                                                            <div
                                                                key={media.id}
                                                                className="relative cursor-pointer hover:opacity-90 transition-all overflow-hidden rounded-md bg-black"
                                                                style={{ aspectRatio: '1/1' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setImagePreview({ url: media.file_url, name: media.file_name, messageId: media.id });
                                                                }}
                                                            >
                                                                {media.file_type?.startsWith('image/') ? (
                                                                    <img
                                                                        src={media.file_url}
                                                                        alt={media.file_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <video
                                                                            src={media.file_url}
                                                                            className="w-full h-full object-cover"
                                                                            preload="metadata"
                                                                        />
                                                                        {/* Play button overlay for videos */}
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                                                                <div className="w-0 h-0 border-l-[12px] border-l-black border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-0.5"></div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {/* +X Overlay for 5+ items on the 4th image */}
                                                                {mediaIdx === 3 && item.messages.length > 4 && (
                                                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-2xl font-bold">
                                                                        +{item.messages.length - 4}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <span className={`text-[10px] mt-1 px-1 block ${isMe ? 'text-right text-gray-300' : 'text-gray-400'}`}>{timeDisplay}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Render single message (original logic)
                                const msg = item.message;
                                const isMe = msg.sender_id === auth.user?.id;
                                const showAvatar = idx === 0 || (processedMessages[idx - 1]?.type === 'single' ? processedMessages[idx - 1].message.sender_id : processedMessages[idx - 1]?.sender_id) !== msg.sender_id;
                                const msgDate = msg.created_at ? new Date(msg.created_at) : new Date();
                                const isToday = new Date().toDateString() === msgDate.toDateString();
                                const timeDisplay = isToday ? format(msgDate, 'h:mm a') : format(msgDate, 'MMM d, h:mm a');

                                return (
                                    <div key={msg.id || idx} id={`msg-${msg.id}`} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                                        {showAvatar ? (
                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${isMe ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'}`}>
                                                {msg.sender_name?.[0] || '?'}
                                            </div>
                                        ) : (
                                            <div className="w-8" />
                                        )}
                                        <div className={`max-w-[60%] min-w-0 ${isMe ? 'items-end' : 'items-start'} relative`}>
                                            {showAvatar && (
                                                <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-sm font-medium text-gray-300">{msg.sender_name || 'Unknown'}</span>
                                                    <span className="text-xs text-gray-500">{timeDisplay}</span>
                                                    {/* Pinned Indicator */}
                                                    {pinnedMessages.some(m => m.id === msg.id) && (
                                                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                                                        </svg>
                                                    )}
                                                    {/* Starred Indicator */}
                                                    {starredMessages.some(m => m.id === msg.id) && (
                                                        <FaStar className="w-3 h-3 text-yellow-400" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <div
                                                    className={`relative px-4 py-2 rounded-lg text-sm break-words overflow-wrap-anywhere ${isMe
                                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-none'
                                                        : 'bg-[#2b2b2b] text-gray-200 rounded-tl-none border border-[#3b3b3b]'
                                                        }`}
                                                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                                >
                                                    {/* Reply Preview */}
                                                    {(msg.reply_to || msg.parent_id) && (
                                                        <div
                                                            className={`mb-2 pb-2 border-l-4 pl-2 ${isMe
                                                                ? 'border-white/30 bg-white/10'
                                                                : 'border-green-500 bg-green-500/10'
                                                                } rounded p-2 text-xs`}
                                                        >
                                                            {(() => {
                                                                const replyId = msg.reply_to || msg.parent_id;
                                                                const repliedMsg = messages.find(m => m.id === replyId);
                                                                const isRepliedToMe = repliedMsg?.sender_id === auth.user?.id;
                                                                const hasImage = repliedMsg?.file_url && (repliedMsg?.file_type?.startsWith('image/') || repliedMsg?.file_url?.startsWith('data:image/'));
                                                                const hasVideo = repliedMsg?.file_url && repliedMsg?.file_type?.startsWith('video/');
                                                                const hasPDF = repliedMsg?.file_url && (repliedMsg?.file_type?.includes('pdf') || repliedMsg?.file_name?.endsWith('.pdf'));
                                                                const hasDoc = repliedMsg?.file_url && !hasImage && !hasVideo && !hasPDF && repliedMsg?.file_name;

                                                                return (
                                                                    <>
                                                                        <div className="font-semibold mb-0.5">
                                                                            {!repliedMsg ? 'Message' : (isRepliedToMe ? 'You' : repliedMsg.sender_name)}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="opacity-80 line-clamp-2 flex-1">
                                                                                {hasImage ? (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <FaImage className="text-xs" />
                                                                                        <span>{repliedMsg.content || 'Photo'}</span>
                                                                                    </div>
                                                                                ) : hasVideo ? (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <FaVideo className="text-xs" />
                                                                                        <span>{repliedMsg.content || 'Video'}</span>
                                                                                    </div>
                                                                                ) : hasPDF ? (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <FaFile className="text-xs text-red-400" />
                                                                                        <span className="truncate">{repliedMsg.file_name}</span>
                                                                                    </div>
                                                                                ) : hasDoc ? (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <FaFile className="text-xs" />
                                                                                        <span className="truncate">{repliedMsg.file_name}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    repliedMsg?.content || 'Message'
                                                                                )}
                                                                            </div>
                                                                            {hasImage && (
                                                                                <img
                                                                                    src={repliedMsg.file_url}
                                                                                    alt="Preview"
                                                                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                                                />
                                                                            )}
                                                                            {hasVideo && (
                                                                                <div className="relative w-10 h-10 rounded bg-black flex-shrink-0 flex items-center justify-center">
                                                                                    <FaVideo className="text-white text-xs" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                    {/* Image - check file_type or base64 prefix */}
                                                    {msg.file_url && (msg.file_type?.startsWith('image/') || msg.file_url?.startsWith('data:image/')) ? (
                                                        <div className="space-y-2 relative z-10">
                                                            <div className="relative inline-block">
                                                                <img
                                                                    src={msg.file_url}
                                                                    alt={msg.file_name || 'Image'}
                                                                    className="w-full max-w-[300px] max-h-[250px] rounded-lg cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all object-cover"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setImagePreview({ url: msg.file_url, name: msg.file_name, messageId: msg.id });
                                                                    }}
                                                                />
                                                            </div>
                                                            {msg.content && msg.content !== msg.file_name && !msg.content.startsWith('📎') && <p>{msg.content}</p>}
                                                        </div>
                                                    ) : msg.file_url && msg.file_type?.startsWith('video/') ? (
                                                        /* Video Display */
                                                        <div className="space-y-2 relative z-10">
                                                            <div
                                                                className="relative w-full max-w-[300px] max-h-[250px] rounded-lg cursor-pointer hover:opacity-90 transition-all overflow-hidden bg-black group"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setImagePreview({ url: msg.file_url, name: msg.file_name, messageId: msg.id });
                                                                }}
                                                            >
                                                                <video
                                                                    src={msg.file_url}
                                                                    className="max-w-full max-h-[250px] rounded-lg object-cover"
                                                                    preload="metadata"
                                                                />
                                                                {/* Play Button Overlay */}
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all">
                                                                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                        <div className="w-0 h-0 border-l-[20px] border-l-black border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                                                                    </div>
                                                                </div>

                                                                {/* Video Duration Badge */}
                                                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs flex items-center gap-1">
                                                                    <FaVideo className="text-[10px]" />
                                                                    <span>Video</span>
                                                                </div>
                                                            </div>
                                                            {msg.content && msg.content !== msg.file_name && !msg.content.startsWith('📎') && <p>{msg.content}</p>}
                                                        </div>
                                                    ) : msg.file_url && (msg.file_type?.includes('pdf') || msg.file_type?.includes('document') || msg.file_url?.startsWith('data:application/pdf') || msg.file_name?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) ? (
                                                        /* File attachment (PDF, docs, etc) */
                                                        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg min-w-[200px]">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${msg.file_name?.endsWith('.pdf') ? 'bg-red-500/30 text-red-400' :
                                                                msg.file_name?.match(/\.(doc|docx)$/i) ? 'bg-blue-500/30 text-blue-400' :
                                                                    msg.file_name?.match(/\.(xls|xlsx)$/i) ? 'bg-green-500/30 text-green-400' :
                                                                        'bg-gray-500/30 text-gray-400'
                                                                }`}>
                                                                <FaFile className="text-lg" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm truncate">{msg.file_name || 'Document'}</p>
                                                                <p className="text-xs opacity-60">{msg.file_size || 'File'}</p>
                                                            </div>
                                                            <a
                                                                href={msg.file_url}
                                                                download={msg.file_name}
                                                                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                                                title="Download"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <FaDownload />
                                                            </a>
                                                        </div>
                                                    ) : msg.file_url && msg.file_name ? (
                                                        /* Any other file with file_url and file_name */
                                                        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg min-w-[200px]">
                                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-500/30 text-gray-400">
                                                                <FaFile className="text-lg" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm truncate">{msg.file_name}</p>
                                                                <p className="text-xs opacity-60">{msg.file_size || 'File'}</p>
                                                            </div>
                                                            <a
                                                                href={msg.file_url}
                                                                download={msg.file_name}
                                                                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                                                title="Download"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <FaDownload />
                                                            </a>
                                                        </div>
                                                    ) : msg.content?.match(/^📷|^📎/) ? (
                                                        /* File shared via content marker (for receiver without file_url) */
                                                        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                                                            {msg.content.startsWith('📷') ? (
                                                                <FaImage className="text-lg text-blue-400" />
                                                            ) : (
                                                                <FaPaperclip className="text-lg text-gray-400" />
                                                            )}
                                                            <span>{msg.content.replace(/^📷\s*|^📎\s*/, '').trim()}</span>
                                                        </div>
                                                    ) : msg.content?.startsWith('📎 Shared file:') ? (
                                                        /* Legacy file share format */
                                                        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                                                            <FaPaperclip className="text-lg" />
                                                            <span>{msg.content.replace('📎 Shared file:', '').trim()}</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Regular text message */}
                                                            {msg.content}
                                                            {/* Edited indicator */}
                                                            {msg.edited && (
                                                                <span className="text-[10px] opacity-60 ml-2 italic">edited</span>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Star/Pin Icons - at bottom right with spacing */}
                                                    <span className="inline-flex items-center gap-1 ml-2">
                                                        {pinnedMessages.some(m => m.id === msg.id) && (
                                                            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                                                            </svg>
                                                        )}
                                                        {starredMessages.some(m => m.id === msg.id) && (
                                                            <FaStar className="w-3 h-3 text-yellow-400" />
                                                        )}
                                                    </span>

                                                    {/* Tick marks for sender - inline with message */}
                                                    {isMe && (
                                                        <span className="inline-flex items-center ml-2 text-[10px]">
                                                            {msg.status === 'sending' ? (
                                                                <span className="text-gray-400">⏳</span>
                                                            ) : msg.status === 'failed' ? (
                                                                <span className="text-red-400">✕</span>
                                                            ) : msg.is_read || msg.status === 'seen' ? (
                                                                <span className="text-blue-400">✓✓</span>
                                                            ) : msg.is_delivered || msg.status === 'delivered' ? (
                                                                <span className="text-gray-300">✓✓</span>
                                                            ) : (
                                                                <span className="text-gray-400">✓</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* WhatsApp-style reaction - transparent emoji icon on hover, click to open reactions */}
                                                <div className={`absolute ${isMe ? 'top-1 -left-10' : 'top-1 -right-10'} opacity-0 group-hover:opacity-100 transition-all duration-200 z-20`}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showReactionBar: !m.showReactionBar } : { ...m, showReactionBar: false }));
                                                        }}
                                                        className="text-gray-400 hover:text-gray-200 text-lg transition-all hover:scale-110 bg-[#2b2b2b]/80 border border-[#3b3b3b]/50 rounded-full p-1.5 backdrop-blur-sm shadow-lg"
                                                        title="React to message"
                                                    >
                                                        <FaSmile />
                                                    </button>
                                                </div>

                                                {/* Message Options Menu Button */}
                                                <div className={`absolute ${isMe ? 'top-1 -left-20' : 'top-1 -right-20'} opacity-0 group-hover:opacity-100 transition-all duration-200 z-20`}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-200 text-sm transition-all hover:scale-110 bg-[#2b2b2b]/80 border border-[#3b3b3b]/50 rounded-full p-1.5 backdrop-blur-sm shadow-lg"
                                                        title="Message options"
                                                        data-msg-menu={msg.id}
                                                    >
                                                        <FaEllipsisV />
                                                    </button>
                                                </div>

                                                {/* Message Options Dropdown Menu - Opens downward like WhatsApp */}
                                                {messageMenuOpen === msg.id && ReactDOM.createPortal(
                                                    <div
                                                        className="fixed bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg shadow-2xl z-[99999] min-w-[200px] animate-[scaleIn_0.15s_ease-out]"
                                                        style={{
                                                            top: (() => {
                                                                const btn = document.querySelector(`[data-msg-menu="${msg.id}"]`);
                                                                if (!btn) return '50%';
                                                                const rect = btn.getBoundingClientRect();
                                                                const menuHeight = 380;

                                                                // Find chat header - the real boundary
                                                                const header = document.querySelector('[class*="p-4 bg-[#1b1b1b]"]') ||
                                                                    document.querySelector('[class*="justify-between p-4"]');
                                                                const minTop = header ? header.getBoundingClientRect().bottom + 10 : 130;

                                                                // Calculate spaces
                                                                const spaceBelow = window.innerHeight - rect.bottom;

                                                                // Try below first (preferred)
                                                                if (spaceBelow >= menuHeight) {
                                                                    return `${rect.bottom + 4}px`;
                                                                }

                                                                // Check if above would cross header
                                                                const abovePosition = rect.top - menuHeight - 4;
                                                                const wouldCrossHeader = abovePosition < minTop;

                                                                // If safe to position above, do it
                                                                if (!wouldCrossHeader) {
                                                                    return `${abovePosition}px`;
                                                                }

                                                                // Would cross header - CENTER IT VERTICALLY
                                                                const centerY = (window.innerHeight / 2) - (menuHeight / 2);
                                                                return `${Math.max(minTop, centerY)}px`;
                                                            })(),
                                                            [isMe ? 'right' : 'left']: (() => {
                                                                const btn = document.querySelector(`[data-msg-menu="${msg.id}"]`);
                                                                if (!btn) return '50%';
                                                                const rect = btn.getBoundingClientRect();
                                                                return isMe ? `${window.innerWidth - rect.right}px` : `${rect.left}px`;
                                                            })(),
                                                            maxHeight: '380px',
                                                            overflowY: 'auto'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="py-1">
                                                            <button onClick={() => handleReplyToMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                <FaReply className="text-blue-400 text-base" /> <span>Reply</span>
                                                            </button>
                                                            <button onClick={() => handleCopyMessage(msg.content)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                <span>Copy</span>
                                                            </button>
                                                            <button onClick={() => { setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showReactionBar: !m.showReactionBar } : { ...m, showReactionBar: false })); setMessageMenuOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                <FaSmile className="text-yellow-400 text-base" /> <span>React</span>
                                                            </button>
                                                            <button onClick={() => handleForwardMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                                                <span>Forward</span>
                                                            </button>
                                                            <button onClick={() => handlePinMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                <svg className={`w-4 h-4 ${pinnedMessages.some(m => m.id === msg.id) ? "text-yellow-400" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                                <span>{pinnedMessages.some(m => m.id === msg.id) ? 'Unpin' : 'Pin'}</span>
                                                            </button>
                                                            <button onClick={() => handleStarMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                <FaStar className={starredMessages.some(m => m.id === msg.id) ? "text-yellow-400" : "text-gray-400"} /> <span>{starredMessages.some(m => m.id === msg.id) ? 'Unstar' : 'Star'}</span>
                                                            </button>
                                                            {isMe && (
                                                                <>
                                                                    <div className="border-t border-[#3b3b3b] my-1"></div>
                                                                    <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); setMessageMenuOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                        <FaEdit className="text-blue-400" /> <span>Edit</span>
                                                                    </button>
                                                                    <button onClick={() => { setMessageToDelete(msg); setShowDeleteModal(true); setMessageMenuOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                        <FaTrash /> <span>Delete</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            {!isMe && (
                                                                <>
                                                                    <div className="border-t border-[#3b3b3b] my-1"></div>
                                                                    <button onClick={() => handleReportMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                        <span>Report</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>,
                                                    document.body
                                                )}

                                                {/* WhatsApp-style reaction bar - opens on click */}
                                                {msg.showReactionBar && (
                                                    <div
                                                        className={`absolute -top-17 ${isMe ? 'right-0' : 'left-0'} z-30 transition-all duration-200 ease-out`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        data-reaction-bar="true"
                                                    >
                                                        <div className="flex items-center gap-1 bg-[#2b2b2b] border border-[#3b3b3b] rounded-full px-3 py-2.5 shadow-2xl animate-[scaleIn_0.15s_ease-out]">
                                                            {/* Quick reactions */}
                                                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        addReaction(msg.id, emoji);
                                                                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showReactionBar: false } : m));
                                                                    }}
                                                                    className="text-2xl hover:scale-125 transition-transform px-2 py-1 rounded-full hover:bg-[#3b3b3b]"
                                                                    title={`React with ${emoji}`}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}

                                                            {/* Plus button to show more emojis */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        // Open the emoji picker and close all reaction bars
                                                                        setMessages(prev => prev.map(m => {
                                                                            if (m.id === msg.id) {
                                                                                // For the clicked message: close reaction bar, open picker
                                                                                return {
                                                                                    ...m,
                                                                                    showReactionBar: false,
                                                                                    showReactionPicker: true,
                                                                                    emojiSearchQuery: '',
                                                                                    emojiCategory: 'recently'
                                                                                };
                                                                            } else {
                                                                                // For other messages: close everything
                                                                                return {
                                                                                    ...m,
                                                                                    showReactionBar: false,
                                                                                    showReactionPicker: false
                                                                                };
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="text-gray-400 hover:text-white hover:bg-[#3b3b3b] hover:scale-110 rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 border border-[#4b4b4b]"
                                                                    title="More reactions"
                                                                >
                                                                    <FaPlus className="text-base" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Professional Emoji Picker - Rendered independently from reaction bar */}
                                                {msg.showReactionPicker && (() => {
                                                    const emojiCategories = {
                                                        recently: { label: 'Recently Used', icon: '🕒', emojis: recentlyUsedEmojis.length > 0 ? recentlyUsedEmojis : ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'] },
                                                        smileys: { label: 'Smileys & Emotion', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'] },
                                                        people: { label: 'People & Body', icon: '👋', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'] },
                                                        animals: { label: 'Animals & Nature', icon: '🐻', emojis: ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻'] },
                                                        food: { label: 'Food & Drink', icon: '🍕', emojis: ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯'] },
                                                        activity: { label: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'] },
                                                        travel: { label: 'Travel & Places', icon: '✈️', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲', '⛱', '🏖', '🏝'] },
                                                        objects: { label: 'Objects', icon: '💡', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀'] },
                                                        symbols: { label: 'Symbols', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', '🔠', '🔡', '🔤', '🔣', '🔢', '🔥', '💧', '🌊', '🎉', '🎊', '🎈', '🎀', '🎁', '🏆', '🏅', '🥇', '🥈', '🥉'] }
                                                    };

                                                    const currentCategory = msg.emojiCategory || 'recently';
                                                    const searchQuery = (msg.emojiSearchQuery || '').toLowerCase();

                                                    // Filter emojis based on search or category
                                                    let displayEmojis = currentCategory === 'recently'
                                                        ? emojiCategories.smileys.emojis
                                                        : emojiCategories[currentCategory].emojis;
                                                    if (searchQuery) {
                                                        displayEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
                                                    }

                                                    return ReactDOM.createPortal(
                                                        <div
                                                            className="fixed inset-0 z-[9999] transition-opacity duration-200"
                                                            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                                                            onMouseDown={(e) => {
                                                                if (e.target === e.currentTarget) {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setMessages(prev => prev.map(m => ({ ...m, showReactionPicker: false })));
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                className="bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out"
                                                                style={{
                                                                    width: '420px',
                                                                    height: '480px',
                                                                    position: 'fixed',
                                                                    top: '50%',
                                                                    left: isMe ? 'calc(50% - 150px)' : 'calc(50% + 150px)',
                                                                    transform: 'translateY(-50%)',
                                                                    border: '1px solid #333'
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                {/* Search Bar */}
                                                                <div className="p-3 border-b border-[#2a2a2a]">
                                                                    <div className="relative">
                                                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Search reaction"
                                                                            value={msg.emojiSearchQuery || ''}
                                                                            onChange={(e) => {
                                                                                const query = e.target.value;
                                                                                setMessages(prev => prev.map(m =>
                                                                                    m.id === msg.id ? { ...m, emojiSearchQuery: query } : m
                                                                                ));
                                                                            }}
                                                                            className="w-full bg-[#252525] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#4a4a4a] placeholder-gray-500"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Category Icons - INCLUDING recently */}
                                                                <div className="flex items-center gap-1 px-3 py-2 border-b border-[#2a2a2a] overflow-x-auto bg-[#1e1e1e]" style={{ scrollbarWidth: 'none' }}>
                                                                    {Object.entries(emojiCategories).map(([key, cat]) => (
                                                                        <button
                                                                            key={key}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setMessages(prev => prev.map(m =>
                                                                                    m.id === msg.id ? { ...m, emojiCategory: key, emojiSearchQuery: '' } : m
                                                                                ));
                                                                            }}
                                                                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${currentCategory === key
                                                                                ? 'bg-[#2e2e2e] ring-1 ring-[#444]'
                                                                                : 'hover:bg-[#2a2a2a]'
                                                                                }`}
                                                                            title={cat.label}
                                                                        >
                                                                            <span className="text-xl">{cat.icon}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                {/* Emoji Grid with Scrolling */}
                                                                <div
                                                                    className="p-4 overflow-y-auto"
                                                                    style={{
                                                                        height: '370px',
                                                                        scrollbarWidth: 'thin',
                                                                        scrollbarColor: '#3b3b3b #1a1a1a'
                                                                    }}
                                                                >
                                                                    {/* Recent Emojis Row - Only show when recently tab is active */}
                                                                    {!searchQuery && currentCategory === 'recently' && recentlyUsedEmojis.length > 0 && (
                                                                        <div className="mb-4">
                                                                            <h4 className="text-xs font-semibold text-gray-400 mb-3">Recent reactions</h4>
                                                                            <div className="flex items-center gap-2 flex-wrap mb-4">
                                                                                {recentlyUsedEmojis.map((emoji, idx) => (
                                                                                    <button
                                                                                        key={`recent-${emoji}-${idx}`}
                                                                                        onMouseDown={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            addReaction(msg.id, emoji);
                                                                                            setMessages(prev => prev.map(m => ({ ...m, showReactionPicker: false })));
                                                                                        }}
                                                                                        className="text-3xl hover:bg-[#2a2a2a] rounded p-1 transition-all hover:scale-125 cursor-pointer"
                                                                                        title={emoji}
                                                                                    >
                                                                                        {emoji}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Show ALL categories when Recently is active, or just the selected category */}
                                                                    {!searchQuery && currentCategory === 'recently' ? (
                                                                        // Show ALL emoji categories in one scrollable list
                                                                        Object.entries(emojiCategories)
                                                                            .filter(([key]) => key !== 'recently')
                                                                            .map(([key, cat]) => (
                                                                                <div key={key} className="mb-6">
                                                                                    <h4 className="text-xs font-semibold text-gray-400 mb-3">{cat.label}</h4>
                                                                                    <div className="grid grid-cols-8 gap-1">
                                                                                        {cat.emojis.map((emoji, idx) => (
                                                                                            <button
                                                                                                key={`${key}-${emoji}-${idx}`}
                                                                                                onMouseDown={(e) => {
                                                                                                    e.preventDefault();
                                                                                                    e.stopPropagation();
                                                                                                    addReaction(msg.id, emoji);
                                                                                                    setMessages(prev => prev.map(m => ({ ...m, showReactionPicker: false })));
                                                                                                }}
                                                                                                className="text-3xl hover:bg-[#2a2a2a] rounded p-1 transition-all hover:scale-125 cursor-pointer"
                                                                                                title={emoji}
                                                                                            >
                                                                                                {emoji}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                    ) : (
                                                                        // Show selected category or search results
                                                                        <>
                                                                            {!searchQuery && (
                                                                                <div className="mb-2">
                                                                                    <h4 className="text-xs font-semibold text-gray-400 mb-3">
                                                                                        {emojiCategories[currentCategory].label}
                                                                                    </h4>
                                                                                </div>
                                                                            )}
                                                                            <div className="grid grid-cols-8 gap-1">
                                                                                {displayEmojis.map((emoji, idx) => (
                                                                                    <button
                                                                                        key={`${emoji}-${idx}`}
                                                                                        onMouseDown={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            addReaction(msg.id, emoji);
                                                                                            setMessages(prev => prev.map(m => ({
                                                                                                ...m,
                                                                                                showReactionBar: false,
                                                                                                showReactionPicker: false
                                                                                            })));
                                                                                        }}
                                                                                        className="text-3xl hover:bg-[#2a2a2a] rounded p-1 transition-all hover:scale-125 cursor-pointer"
                                                                                        title={emoji}
                                                                                    >
                                                                                        {emoji}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>,
                                                        document.body
                                                    );
                                                })()}

                                                {/* Full Emoji Picker Modal - Opens from "React" menu option */}
                                                {msg.showFullEmojiPicker && (
                                                    <div
                                                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                                        onClick={() => setMessages(prev => prev.map(m => ({ ...m, showFullEmojiPicker: false })))}
                                                    >
                                                        <div
                                                            className="bg-[#2b2b2b] border border-[#3b3b3b] rounded-xl p-4 max-w-md w-full mx-4 animate-[scaleIn_0.2s_ease-out]"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h3 className="text-lg font-semibold text-white">Choose Reaction</h3>
                                                                <button
                                                                    onClick={() => setMessages(prev => prev.map(m => ({ ...m, showFullEmojiPicker: false })))}
                                                                    className="text-gray-400 hover:text-white"
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                                                                {['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '💯', '✅', '💪', '🙌', '😍', '🤔', '😊', '😎', '🤩', '😇', '🥰', '😘', '🥺', '😭', '😡', '🤬', '🙄', '😴', '🤐', '🤫', '🤭', '🤗', '🤓', '😈', '👻', '🤡', '👀', '💀', '☠️', '👽', '🤖', '💩'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => {
                                                                            addReaction(msg.id, emoji);
                                                                            setMessages(prev => prev.map(m => ({ ...m, showFullEmojiPicker: false })));
                                                                        }}
                                                                        className="text-3xl hover:bg-[#3b3b3b] p-3 rounded-lg transition-all hover:scale-125"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}


                                                {/* Display existing reactions - WhatsApp style (single container) */}
                                                {(() => {
                                                    // Check if reactions exist and is a valid array
                                                    const hasReactions = Array.isArray(msg.reactions) && msg.reactions.length > 0;

                                                    if (!hasReactions) return null;

                                                    const totalReactions = msg.reactions.reduce((sum, r) => sum + parseInt(r.count || 0), 0);
                                                    const firstThreeEmojis = msg.reactions.slice(0, 3).map(r => r.emoji).join('');

                                                    return (
                                                        <div className="mt-1">
                                                            <span
                                                                className="inline-flex items-center gap-1.5 text-sm bg-[#3b3b3b] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#4b4b4b] transition-colors border border-[#4b4b4b]"
                                                                onClick={() => {
                                                                    setSelectedMessageReactions(msg);
                                                                    setReactionsModalTab('all');
                                                                    setShowReactionsModal(true);
                                                                }}
                                                                title="Click to see who reacted"
                                                            >
                                                                <span>{firstThreeEmojis}</span>
                                                                <span className="text-gray-300 font-medium text-xs">{totalReactions}</span>
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        });
                    })()
                )}
                <div ref={messagesEndRef} />
            </div>
        </>
    );
}

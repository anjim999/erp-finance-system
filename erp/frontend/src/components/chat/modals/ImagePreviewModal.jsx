// frontend/src/components/chat/modals/ImagePreviewModal.jsx
import { FaTimes, FaStar, FaShare, FaReply, FaDownload, FaTrash, FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CustomVideoPlayer from '../common/VideoPlayer';

export default function ImagePreviewModal({
    imagePreview,
    messages,
    starredMessages,
    setStarredMessages,
    setReplyingTo,
    setMessageToDelete,
    setShowDeleteModal,
    setImagePreview,
    handleForwardMessage
}) {
    if (!imagePreview) return null;

    // Get all images AND videos from messages
    const allMedia = messages.filter(m => m.file_url && (
        m.file_type?.startsWith('image/') ||
        m.file_type?.startsWith('video/') ||
        m.file_url?.startsWith('data:image/')
    ));

    // Use messageId for reliable matching, fallback to URL
    let currentIndex = -1;
    if (imagePreview.messageId) {
        currentIndex = allMedia.findIndex(m => m.id === imagePreview.messageId);
    }
    if (currentIndex === -1) {
        currentIndex = allMedia.findIndex(m => m.file_url === imagePreview.url);
    }

    const currentMessage = currentIndex >= 0 ? allMedia[currentIndex] : null;

    const goToPrevious = () => {
        if (currentIndex > 0) {
            const prevMsg = allMedia[currentIndex - 1];
            setImagePreview({ url: prevMsg.file_url, name: prevMsg.file_name, messageId: prevMsg.id });
        }
    };

    const goToNext = () => {
        if (currentIndex < allMedia.length - 1) {
            const nextMsg = allMedia[currentIndex + 1];
            setImagePreview({ url: nextMsg.file_url, name: nextMsg.file_name, messageId: nextMsg.id });
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setImagePreview(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    >
                        <FaTimes className="text-white text-xl" />
                    </button>
                    {currentMessage && (
                        <div>
                            <div className="text-white font-medium">{currentMessage.sender_name}</div>
                            <div className="text-gray-400 text-xs">{new Date(currentMessage.created_at).toLocaleString()}</div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                    {/* Star */}
                    <button
                        onClick={() => {
                            if (currentMessage) {
                                if (starredMessages.some(m => m.id === currentMessage.id)) {
                                    setStarredMessages(prev => prev.filter(m => m.id !== currentMessage.id));
                                    toast.info('Removed from starred');
                                } else {
                                    setStarredMessages(prev => [...prev, currentMessage]);
                                    toast.success('Added to starred');
                                }
                            }
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title="Star"
                    >
                        <FaStar className={`text-xl ${currentMessage && starredMessages.some(m => m.id === currentMessage.id) ? 'text-yellow-400' : 'text-white'}`} />
                    </button>

                    {/* Forward */}
                    <button
                        onClick={() => {
                            if (currentMessage) {
                                handleForwardMessage(currentMessage);
                                setImagePreview(null);
                            }
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title="Forward"
                    >
                        <FaShare className="text-white text-xl" />
                    </button>

                    {/* Reply */}
                    <button
                        onClick={() => {
                            if (currentMessage) {
                                setReplyingTo(currentMessage);
                                setImagePreview(null);
                            }
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title="Reply"
                    >
                        <FaReply className="text-white text-xl" />
                    </button>

                    {/* Download */}
                    <a
                        href={imagePreview.url}
                        download={imagePreview.name || 'image'}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title="Download"
                    >
                        <FaDownload className="text-white text-xl" />
                    </a>

                    {/* Delete */}
                    {currentMessage && (
                        <button
                            onClick={() => {
                                setMessageToDelete(currentMessage);
                                setShowDeleteModal(true);
                                setImagePreview(null);
                            }}
                            className="p-2 hover:bg-red-500/20 rounded-full transition-colors cursor-pointer"
                            title="Delete"
                        >
                            <FaTrash className="text-red-400 text-xl" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Media Area */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                {/* Previous Button */}
                {currentIndex > 0 && (
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 cursor-pointer"
                    >
                        <FaChevronLeft className="text-white text-2xl" />
                    </button>
                )}

                {/* Image or Video based on type */}
                {(() => {
                    const isVideo = currentMessage?.file_type?.startsWith('video/') ||
                        imagePreview.url?.match(/\.(mp4|mov|avi|webm)$/i);

                    if (isVideo) {
                        return <CustomVideoPlayer url={imagePreview.url} />;
                    }

                    return (
                        <img
                            src={imagePreview.url}
                            alt={imagePreview.name || 'Preview'}
                            className="max-w-full max-h-full object-contain"
                            style={{ maxHeight: 'calc(100vh - 180px)' }}
                        />
                    );
                })()}

                {/* Next Button */}
                {currentIndex < allMedia.length - 1 && (
                    <button
                        onClick={goToNext}
                        className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 cursor-pointer"
                    >
                        <FaChevronRight className="text-white text-2xl" />
                    </button>
                )}
            </div>

            {/* Thumbnail Carousel */}
            {allMedia.length > 1 && (
                <div className="bg-[#1a1a1a] px-4 py-3">
                    <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar justify-center">
                        {allMedia.map((msg) => {
                            const isVideoThumb = msg.file_type?.startsWith('video/') || msg.file_url?.match(/\.(mp4|mov|avi|webm)$/i);
                            const isSelected = msg.id === imagePreview.messageId || msg.file_url === imagePreview.url;
                            return (
                                <button
                                    key={msg.id}
                                    onClick={() => setImagePreview({ url: msg.file_url, name: msg.file_name, messageId: msg.id })}
                                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all relative ${isSelected ? 'border-2 border-white' : 'border-2 border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    {isVideoThumb ? (
                                        <>
                                            <video
                                                src={msg.file_url}
                                                className="w-full h-full object-cover"
                                                muted
                                                preload="metadata"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <FaPlay className="text-white text-[8px]" />
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={msg.file_url}
                                            alt={msg.file_name || 'Thumbnail'}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="text-center text-gray-500 text-xs mt-1">
                        {currentIndex + 1} / {allMedia.length}
                    </div>
                </div>
            )}
        </div>
    );
}

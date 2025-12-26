// frontend/src/components/chat/modals/ReactionsModal.jsx
import { FaTimes } from 'react-icons/fa';
import { useRef } from 'react';

export default function ReactionsModal({
    show,
    selectedMessageReactions,
    reactionsModalTab,
    setReactionsModalTab,
    reactionDetails,
    currentUserId,
    onRemoveReaction,
    onClose
}) {
    const lastFetchedReactionMessageIdRef = useRef(null);

    if (!show || !selectedMessageReactions) return null;

    const closeReactionsModal = () => {
        onClose();
        lastFetchedReactionMessageIdRef.current = null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeReactionsModal}>
            <div className="bg-[#2b2b2b] rounded-xl w-full max-w-md shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header with Tabs */}
                <div className="border-b border-[#3b3b3b]">
                    {/* Close button */}
                    <div className="flex justify-between items-center px-4 py-3">
                        <h3 className="text-lg font-semibold text-white">Reactions</h3>
                        <button
                            onClick={closeReactionsModal}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
                        {/* All Tab */}
                        <button
                            onClick={() => setReactionsModalTab('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${reactionsModalTab === 'all'
                                ? 'bg-[#3b3b3b] text-white'
                                : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                }`}
                        >
                            All {selectedMessageReactions.reactions?.reduce((sum, r) => sum + parseInt(r.count || 0), 0) || 0}
                        </button>

                        {/* Individual Emoji Tabs */}
                        {selectedMessageReactions.reactions?.map((reaction, idx) => (
                            <button
                                key={idx}
                                onClick={() => setReactionsModalTab(reaction.emoji)}
                                className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${reactionsModalTab === reaction.emoji
                                    ? 'bg-[#3b3b3b] text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                    }`}
                            >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {reactionDetails.length > 0 ? (
                        reactionDetails
                            .filter(reaction => reactionsModalTab === 'all' || reaction.emoji === reactionsModalTab)
                            .map((reaction, idx) => {
                                const isOwnReaction = reaction.user_id === currentUserId;
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 hover:bg-[#333] rounded-lg transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {reaction.user_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">
                                                {reaction.user_name || 'User'}
                                                {isOwnReaction && <span className="text-xs text-gray-400 ml-2">(You)</span>}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{reaction.user_email || ''}</p>
                                        </div>
                                        <div
                                            className={`text-2xl ${isOwnReaction ? 'cursor-pointer hover:opacity-60 transition-opacity' : ''}`}
                                            onClick={() => {
                                                if (isOwnReaction && selectedMessageReactions?.id) {
                                                    onRemoveReaction(selectedMessageReactions.id, reaction.emoji);
                                                    // Close modal if no more reactions
                                                    if (reactionDetails.length <= 1) {
                                                        closeReactionsModal();
                                                    }
                                                }
                                            }}
                                            title={isOwnReaction ? "Click to remove your reaction" : ""}
                                        >
                                            {reaction.emoji}
                                        </div>
                                    </div>
                                );
                            })
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            <p className="text-sm">No reactions yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// frontend/src/components/chat/modals/ForwardMessageModal.jsx
import { FaSearch } from 'react-icons/fa';
import Modal from '../common/Modal';

export default function ForwardMessageModal({
    show,
    forwardingMessage,
    allUsers,
    currentUserId,
    forwardSearch,
    setForwardSearch,
    selectedForwardUsers,
    setSelectedForwardUsers,
    onSendForward,
    onClose
}) {
    if (!show) return null;

    const handleClose = () => {
        onClose();
        setSelectedForwardUsers([]);
        setForwardSearch('');
    };

    return (
        <Modal onClose={handleClose} title="Forward Message">
            <div className="space-y-4">
                {/* Message Preview */}
                <div className="bg-[#2b2b2b] p-3 rounded-lg border border-[#3b3b3b]">
                    <div className="text-xs text-gray-400 mb-1">Forwarding:</div>
                    <div className="text-sm text-gray-200 line-clamp-2">{forwardingMessage?.content}</div>
                </div>

                {/* Searchbar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={forwardSearch}
                        onChange={(e) => setForwardSearch(e.target.value)}
                        className="w-full px-4 py-2 pl-10 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>

                {/* User List */}
                <div className="max-h-96 overflow-y-auto space-y-1">
                    {allUsers
                        .filter(user =>
                            user.id !== currentUserId &&
                            user.name.toLowerCase().includes(forwardSearch.toLowerCase())
                        )
                        .map(user => {
                            const isSelected = selectedForwardUsers.includes(user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        setSelectedForwardUsers(prev =>
                                            isSelected
                                                ? prev.filter(id => id !== user.id)
                                                : [...prev, user.id]
                                        );
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-purple-600/20 border border-purple-500' : 'hover:bg-[#3b3b3b]'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {user.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>

                {/* Send Button */}
                <div className="flex gap-2 pt-4 border-t border-[#3b3b3b]">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSendForward}
                        disabled={selectedForwardUsers.length === 0}
                        className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${selectedForwardUsers.length > 0
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-gray-700 cursor-not-allowed'
                            }`}
                    >
                        Forward {selectedForwardUsers.length > 0 && `(${selectedForwardUsers.length})`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

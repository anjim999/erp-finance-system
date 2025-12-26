// frontend/src/components/chat/modals/DeleteModal.jsx
import { FaTrash, FaUsers, FaUser } from 'react-icons/fa';

export default function DeleteModal({ show, messageToDelete, currentUserId, onDeleteForEveryone, onDeleteForMe, onClose }) {
    if (!show || !messageToDelete) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999]" onClick={onClose}>
            <div className="bg-gradient-to-b from-[#2d2d2d] to-[#252525] rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-[scaleIn_0.2s_ease-out] border border-[#3b3b3b] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header with Icon */}
                <div className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <FaTrash className="text-red-400 text-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-1">Delete Message?</h3>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>

                {/* Buttons */}
                <div className="border-t border-[#3b3b3b]">
                    {messageToDelete.sender_id === currentUserId && (
                        <button
                            onClick={onDeleteForEveryone}
                            className="w-full px-4 py-4 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-b border-[#3b3b3b] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FaUsers className="text-sm" />
                            <span>Delete for everyone</span>
                        </button>
                    )}
                    <button
                        onClick={onDeleteForMe}
                        className="w-full px-4 py-4 text-sm text-white hover:bg-white/5 transition-colors border-b border-[#3b3b3b] flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <FaUser className="text-sm" />
                        <span>Delete for me</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-4 text-sm text-gray-400 hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

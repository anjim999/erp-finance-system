// frontend/src/components/chat/modals/TeamSettingsModal.jsx
import { FaPlus, FaTrash } from 'react-icons/fa';
import Modal from '../common/Modal';

export default function TeamSettingsModal({
    show,
    editingTeamName,
    setEditingTeamName,
    onSaveChanges,
    onDeleteTeam,
    onAddMembers,
    onClose
}) {
    if (!show) return null;

    return (
        <Modal onClose={onClose} title="Team Settings">
            <div className="py-4 space-y-4">
                <div>
                    <label className="text-sm text-gray-400 block mb-2">Team Name</label>
                    <input
                        type="text"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        className="w-full px-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onSaveChanges}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={onDeleteTeam}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                        <FaTrash />
                    </button>
                </div>
                <div className="pt-4 border-t border-[#3b3b3b]">
                    <button
                        onClick={onAddMembers}
                        className="w-full px-4 py-2 bg-[#3b3b3b] hover:bg-[#4b4b4b] text-white rounded-lg flex items-center justify-center gap-2"
                    >
                        <FaPlus /> Add Members
                    </button>
                </div>
            </div>
        </Modal>
    );
}

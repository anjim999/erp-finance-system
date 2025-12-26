// frontend/src/components/chat/modals/EditChannelModal.jsx
import Modal from '../common/Modal';

export default function EditChannelModal({
    show,
    editingChannel,
    editingChannelName,
    setEditingChannelName,
    onSave,
    onClose
}) {
    if (!show || !editingChannel) return null;

    const handleClose = () => {
        onClose();
        setEditingChannelName('');
    };

    return (
        <Modal onClose={handleClose} title="Edit Channel">
            <div className="py-4 space-y-4">
                <div>
                    <label className="text-sm text-gray-400 block mb-2">Channel Name</label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">#</span>
                        <input
                            type="text"
                            value={editingChannelName}
                            onChange={(e) => setEditingChannelName(e.target.value)}
                            placeholder="channel-name"
                            className="flex-1 px-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>
                <button
                    onClick={onSave}
                    disabled={!editingChannelName.trim()}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg"
                >
                    Save Changes
                </button>
            </div>
        </Modal>
    );
}

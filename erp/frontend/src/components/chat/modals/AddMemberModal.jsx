// frontend/src/components/chat/modals/AddMemberModal.jsx
import Modal from '../common/Modal';

export default function AddMemberModal({ show, allUsers, onAddMember, onClose }) {
    if (!show) return null;

    return (
        <Modal onClose={onClose} title="Add Members">
            <div className="py-4 max-h-[400px] overflow-y-auto">
                {allUsers.map(user => (
                    <div
                        key={user.id}
                        onClick={() => onAddMember(user.id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b3b3b] rounded-lg cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.name?.[0] || '?'}
                        </div>
                        <div>
                            <p className="text-white">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

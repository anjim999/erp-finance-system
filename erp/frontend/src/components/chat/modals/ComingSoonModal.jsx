// frontend/src/components/chat/modals/ComingSoonModal.jsx
import Modal from '../common/Modal';

export default function ComingSoonModal({ show, featureName, onClose }) {
    if (!show) return null;

    return (
        <Modal onClose={onClose} title="Coming Soon">
            <div className="text-center py-8">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">{featureName}</h3>
                <p className="text-gray-400">This feature is coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">We're working hard to bring you the best experience.</p>
                <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                >
                    Got it!
                </button>
            </div>
        </Modal>
    );
}

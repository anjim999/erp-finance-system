// frontend/src/components/chat/Modal.jsx
import { FaTimes } from 'react-icons/fa';

export default function Modal({ onClose, title, children }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[#2b2b2b] rounded-xl p-6 w-full max-w-md border border-[#3b3b3b] shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-[#3b3b3b] rounded text-gray-400">
                        <FaTimes />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

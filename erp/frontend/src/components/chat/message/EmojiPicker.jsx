// frontend/src/components/chat/message/EmojiPicker.jsx
import { EMOJI_LIST } from '../../../utils/chatConstants';

export default function EmojiPicker({ show, onSelectEmoji }) {
    if (!show) return null;

    return (
        <div className="mb-2 p-3 bg-[#2b2b2b] rounded-lg border border-[#3b3b3b]">
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {EMOJI_LIST.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => onSelectEmoji(emoji)}
                        className="text-xl hover:bg-[#3b3b3b] p-1 rounded"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

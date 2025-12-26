// src/components/chat/Chat.jsx - Real-time Chat Component
import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaTimes, FaPlus, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/chat/useTeamsSocket';
import api from '../../api/axiosClient';
import { formatDistanceToNow } from 'date-fns';

export default function Chat() {
    const { auth } = useAuth();
    const { subscribe } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch chat rooms
    useEffect(() => {
        if (isOpen && auth) {
            fetchRooms();
        }
    }, [isOpen, auth]);

    // Subscribe to new messages
    useEffect(() => {
        const unsubscribe = subscribe('chat:message', (data) => {
            if (data.roomId === activeRoom?.id) {
                setMessages(prev => [...prev, data.message]);
            }
            // Update room's last message
            setRooms(prev => prev.map(room =>
                room.id === data.roomId
                    ? { ...room, last_message: data.message.message, last_message_at: data.message.created_at }
                    : room
            ));
        });
        return unsubscribe;
    }, [subscribe, activeRoom]);

    // Scroll to bottom when new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/api/chat/rooms');
            setRooms(res.data.data || []);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    const fetchMessages = async (roomId) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/chat/rooms/${roomId}/messages`);
            setMessages(res.data.data || []);
            // Mark as read
            await api.put(`/api/chat/rooms/${roomId}/read`);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeRoom) return;

        try {
            await api.post(`/api/chat/rooms/${activeRoom.id}/messages`, {
                message: newMessage
            });
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleRoomClick = (room) => {
        setActiveRoom(room);
        fetchMessages(room.id);
    };

    const handleUserSelect = async (e) => {
        const userEmail = e.target.value;
        if (!userEmail) return;

        try {
            // Create a direct message room with this user
            const name = userEmail.split('@')[0].replace('.', ' '); // e.g., "employee1" -> "employee1"
            const res = await api.post('/api/chat/rooms', {
                name: `DM: ${name}`,
                type: 'direct'
            });

            const newRoom = res.data.data;
            setRooms(prev => [newRoom, ...prev]);
            setActiveRoom(newRoom);
            fetchMessages(newRoom.id);

            // Reset dropdown
            e.target.value = '';
        } catch (err) {
            console.error('Error creating direct message:', err);
        }
    };

    const handleCreateRoom = async () => {
        const name = prompt('Enter room name:');
        if (!name) return;

        try {
            const res = await api.post('/api/chat/rooms', { name, type: 'group' });
            setRooms(prev => [res.data.data, ...prev]);
        } catch (err) {
            console.error('Error creating room:', err);
        }
    };

    if (!auth) return null;

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
            >
                {isOpen ? <FaTimes className="text-xl" /> : <FaComments className="text-xl" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] theme-bg-secondary rounded-2xl shadow-2xl border theme-border-light z-50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FaComments />
                                <span className="font-semibold">Team Chat</span>
                            </div>
                            <button onClick={handleCreateRoom} className="p-1 hover:bg-white/20 rounded" title="Create Group Chat">
                                <FaPlus />
                            </button>
                        </div>

                        {/* User Selection Dropdown */}
                        <select
                            onChange={handleUserSelect}
                            className="w-full text-sm bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                            <option value="" className="text-gray-900">💬 Start chat with...</option>
                            <option value="employee1@test.com" className="text-gray-900">👤 John Doe (Employee)</option>
                            <option value="employee2@test.com" className="text-gray-900">👤 Jane Smith (Employee)</option>
                            <option value="employee3@test.com" className="text-gray-900">👤 Bob Johnson (Employee)</option>
                            <option value="hr.manager@test.com" className="text-gray-900">👥 HR Manager</option>
                            <option value="finance.manager@test.com" className="text-gray-900">💰 Finance Manager</option>
                            <option value="sales.manager@test.com" className="text-gray-900">📈 Mike Ross (Sales)</option>
                            <option value="accountant@test.com" className="text-gray-900">📊 Alice Chen (Accountant)</option>
                            <option value="support@test.com" className="text-gray-900">🎧 Sarah Williams (Support)</option>
                            <option value="company.admin@test.com" className="text-gray-900">👔 Company Admin</option>
                        </select>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Rooms List */}
                        {!activeRoom && (
                            <div className="w-full overflow-y-auto">
                                {rooms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full theme-text-muted p-4">
                                        <FaUsers className="text-4xl mb-2" />
                                        <p>No chat rooms yet</p>
                                        <button
                                            onClick={handleCreateRoom}
                                            className="mt-2 text-blue-500 hover:underline"
                                        >
                                            Create one
                                        </button>
                                    </div>
                                ) : (
                                    rooms.map(room => (
                                        <div
                                            key={room.id}
                                            onClick={() => handleRoomClick(room)}
                                            className="p-4 border-b theme-border-light hover:theme-bg-tertiary cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {room.name?.[0]?.toUpperCase() || 'G'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium theme-text-primary truncate">{room.name}</p>
                                                    <p className="text-sm theme-text-muted truncate">{room.last_message || 'No messages yet'}</p>
                                                </div>
                                                {room.unread_count > 0 && (
                                                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                        {room.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Messages View */}
                        {activeRoom && (
                            <div className="w-full flex flex-col">
                                {/* Room Header */}
                                <div className="p-3 border-b theme-border-light flex items-center gap-2">
                                    <button onClick={() => setActiveRoom(null)} className="theme-text-muted hover:theme-text-primary">
                                        ←
                                    </button>
                                    <span className="font-medium theme-text-primary">{activeRoom.name}</span>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center theme-text-muted py-10">
                                            No messages yet. Start the conversation!
                                        </div>
                                    ) : (
                                        messages.map((msg, i) => {
                                            const isOwn = msg.sender_id === auth.user?.id;
                                            return (
                                                <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                                                        : 'theme-bg-tertiary theme-text-primary rounded-bl-none'
                                                        }`}>
                                                        {!isOwn && (
                                                            <p className="text-xs font-medium text-blue-500 mb-1">{msg.sender_name}</p>
                                                        )}
                                                        <p>{msg.message}</p>
                                                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'theme-text-muted'}`}>
                                                            {msg.created_at && formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="p-3 border-t theme-border-light">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2 rounded-full theme-bg-tertiary theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

// src/pages/TeamsPage.jsx - Microsoft Teams Professional Interface
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    FaPaperPlane, FaSmile, FaPaperclip, FaUsers, FaPlus, FaHashtag, FaComments,
    FaThumbsUp, FaHeart, FaLaugh, FaTimes, FaSearch, FaUser, FaVideo, FaPhone,
    FaCalendarAlt, FaCloud, FaEllipsisH, FaTh, FaBell, FaRobot, FaCompass,
    FaAt, FaStar, FaCog, FaChevronDown, FaChevronRight, FaChevronLeft, FaLock, FaGlobe,
    FaMicrophone, FaImage, FaGift, FaReply, FaEllipsisV, FaCheck, FaCheckDouble,
    FaFile, FaDownload, FaTrash, FaEdit, FaBold, FaItalic, FaLink, FaList, FaShare,
    FaFilePdf, FaPlay, FaPause, FaBackward, FaForward, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/chat/useTeamsSocket';
import api from '../../api/axiosClient';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-toastify';

// Extracted Components
import ChatHeader from '../../components/chat/header/ChatHeader';
import ChatSidebar from '../../components/chat/sidebar/ChatSidebar';
import ContactInfoSidebar from '../../components/chat/sidebar/ContactInfoSidebar';
import StarredMessagesView from '../../components/chat/sidebar/StarredMessagesView';
import MessageInput from '../../components/chat/message/MessageInput';
import MessageList from '../../components/chat/message/MessageList';
import CreateGroupModal from '../../components/chat/modals/CreateGroupModal';
import DeleteModal from '../../components/chat/modals/DeleteModal';
import ComingSoonModal from '../../components/chat/modals/ComingSoonModal';
import ForwardMessageModal from '../../components/chat/modals/ForwardMessageModal';
import TeamSettingsModal from '../../components/chat/modals/TeamSettingsModal';
import CreateChannelModal from '../../components/chat/modals/CreateChannelModal';
import EditChannelModal from '../../components/chat/modals/EditChannelModal';
import AddMemberModal from '../../components/chat/modals/AddMemberModal';
import ReactionsModal from '../../components/chat/modals/ReactionsModal';
import ImagePreviewModal from '../../components/chat/modals/ImagePreviewModal';
import CustomVideoPlayer from '../../components/chat/common/VideoPlayer';
import Modal from '../../components/chat/common/Modal';
import { NavItem, TabButton, QuickAction, ChatItem } from '../../components/chat/common/ChatComponents';
import { EMOJI_LIST, GEMINI_RESPONSES } from '../../utils/chatConstants';

export default function TeamsPage() {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { subscribe } = useSocket();

    // Navigation State
    const [activeNav, setActiveNav] = useState('chat');
    const [sidebarTab, setSidebarTab] = useState('chats');

    // Teams State
    const [teams, setTeams] = useState([]);
    const [expandedTeams, setExpandedTeams] = useState({});
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);

    // Chat State
    const [recentChats, setRecentChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // Messages
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null); // For infinite scroll
    const fileInputRef = useRef(null);

    // Refs to track current chat/channel for socket listeners (prevents re-subscription)
    const selectedChatRef = useRef(selectedChat);
    const selectedChannelRef = useRef(selectedChannel);
    const selectedTeamRef = useRef(selectedTeam);

    // Infinite scroll state
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Modals & UI
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showUsersList, setShowUsersList] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState([]);
    const [newGroupInitialChannel, setNewGroupInitialChannel] = useState('');
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // chat, shared
    const [sharedFiles, setSharedFiles] = useState([]);

    // Channel/Team Management
    const [showTeamSettings, setShowTeamSettings] = useState(false);
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [editingTeamName, setEditingTeamName] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [showEditChannel, setShowEditChannel] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [editingChannelName, setEditingChannelName] = useState('');
    const [channelMenuOpen, setChannelMenuOpen] = useState(null); // channel id for open menu

    // Activity & Mentions
    const [activities, setActivities] = useState([]);
    const [mentions, setMentions] = useState([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');

    // Gemini AI
    const [showGeminiChat, setShowGeminiChat] = useState(false);
    const [geminiMessages, setGeminiMessages] = useState([
        { role: 'assistant', content: 'Hello! I\'m Gemini AI. How can I help you today?' }
    ]);
    const [geminiInput, setGeminiInput] = useState('');
    const [geminiLoading, setGeminiLoading] = useState(false);

    // Image Preview Modal
    const [imagePreview, setImagePreview] = useState(null);

    // Coming Soon Modal
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState('');

    // Message Actions Menu 
    const [messageMenuOpen, setMessageMenuOpen] = useState(null); // stores message ID
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [starredMessages, setStarredMessages] = useState(() => {
        const saved = localStorage.getItem('starredMessages');
        return saved ? JSON.parse(saved) : [];
    });
    const [pinnedMessages, setPinnedMessages] = useState(() => {
        const saved = localStorage.getItem('pinnedMessages');
        return saved ? JSON.parse(saved) : [];
    });
    const [forwardingMessage, setForwardingMessage] = useState(null); // Message being forwarded
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardSearch, setForwardSearch] = useState('');
    const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
    const [showContactInfo, setShowContactInfo] = useState(false); // Contact info sidebar
    const [showStarredView, setShowStarredView] = useState(false); // Starred messages full page
    const [showHeaderMenu, setShowHeaderMenu] = useState(false); // Header 3-dot menu
    const [searchQuery, setSearchQuery] = useState(''); // Message search
    const [showSearch, setShowSearch] = useState(false); // Search bar visibility

    // Message selection and deletion
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

    // Reactions Modal
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const [selectedMessageReactions, setSelectedMessageReactions] = useState(null);

    // Recently used emojis state - load from localStorage
    const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState(() => {
        try {
            const stored = localStorage.getItem(`recentEmojis_${auth.user?.id}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [reactionsModalTab, setReactionsModalTab] = useState('all');
    const [reactionDetails, setReactionDetails] = useState([]);


    // Initial Load - ONLY fetch essential data (teams list and recent chats)
    // Don't load all channels upfront - load them when team is selected!
    useEffect(() => {
        const loadEssentials = async () => {
            try {
                // Parallel loading for speed
                await Promise.all([
                    fetchRecentChats(),
                    fetchActivities(),
                    fetchAllUsers()
                ]);

                // Fetch teams list only (fast)
                const teamsRes = await api.get('/api/teams');
                const allTeams = teamsRes.data.data || [];
                setTeams(allTeams);

                // Don't load channels here - they'll load when user selects a team
            } catch (err) {
                console.error('Initial load error:', err);
            }
        };
        loadEssentials();
    }, []);

    // Global listener for DM notifications - updates unread count in sidebar
    // This runs independently and updates sidebar even when chat is not open
    // (selectedChatRef is already declared above on line 65)

    useEffect(() => {
        const unsub = subscribe('direct:message', (msg) => {
            // If message is from another user
            if (msg.sender_id !== auth.user?.id) {
                // ALWAYS notify sender that message was delivered (for double gray ticks)
                api.post(`/api/teams/direct-messages/${msg.sender_id}/delivered`).catch(() => { });

                const currentChat = selectedChatRef.current;
                // If NOT viewing this specific chat, increment unread
                if (!currentChat || currentChat.other_user_id !== msg.sender_id) {
                    setRecentChats(prev => {
                        const existingIdx = prev.findIndex(c => c.other_user_id === msg.sender_id);
                        if (existingIdx >= 0) {
                            const updated = [...prev];
                            updated[existingIdx] = {
                                ...updated[existingIdx],
                                last_message: msg.content || '',
                                last_message_file_type: msg.file_type || null,
                                last_message_file_name: msg.file_name || null,
                                last_message_at: msg.created_at,
                                last_sender_id: msg.sender_id,
                                last_message_read: false,
                                unread_count: (parseInt(updated[existingIdx].unread_count) || 0) + 1
                            };
                            const chat = updated.splice(existingIdx, 1)[0];
                            return [chat, ...updated];
                        } else {
                            return [{
                                other_user_id: msg.sender_id,
                                other_user_name: msg.sender_name,
                                last_message: msg.content || '',
                                last_message_file_type: msg.file_type || null,
                                last_message_file_name: msg.file_name || null,
                                last_message_at: msg.created_at,
                                last_sender_id: msg.sender_id,
                                last_message_read: false,
                                unread_count: 1
                            }, ...prev];
                        }
                    });
                }
            } else {
                // Message from current user - update chat list with sent message
                setRecentChats(prev => {
                    const recipientId = prev.find(c => c.other_user_id)?.other_user_id || msg.recipient_id;
                    return prev.map(c => c.other_user_id === recipientId ? {
                        ...c,
                        last_message: msg.content || '',
                        last_message_file_type: msg.file_type || null,
                        last_message_file_name: msg.file_name || null,
                        last_message_at: msg.created_at,
                        last_sender_id: msg.sender_id,
                        last_message_read: false
                    } : c);
                });
            }
        });
        return unsub;
    }, [subscribe, auth.user?.id]);

    // Auto-scroll - show latest messages immediately on load
    const prevMessageCountRef = useRef(0);
    const isInitialLoadRef = useRef(true);
    useEffect(() => {
        // Scroll to bottom when messages first load OR when new message arrives
        if (messages.length > 0) {
            if (messages.length > prevMessageCountRef.current) {
                // New message arrived - smooth scroll
                if (!isInitialLoadRef.current) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            }

            // On initial load, immediately jump to bottom
            if (isInitialLoadRef.current) {
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                    }
                }, 0);
                isInitialLoadRef.current = false;
            }
        }
        prevMessageCountRef.current = messages.length;
    }, [messages.length]);

    // Socket subscriptions
    useEffect(() => {
        if (selectedChannel) {
            return subscribe('channel:message', (data) => {
                if (data.channelId === selectedChannel.id) {
                    // Only add if NOT from self (own messages added optimistically)
                    if (data.message?.sender_id !== auth.user?.id) {
                        setMessages(prev => {
                            const exists = prev.some(m => m.id === data.message?.id);
                            if (exists) return prev;
                            return [...prev, { ...data.message, status: 'delivered' }];
                        });
                    }
                }
            });
        }
        if (selectedChat) {
            const unsubDM = subscribe('direct:message', (msg) => {
                // Only add if from the current chat (not own messages - those are added optimistically)
                if (msg.sender_id === selectedChat.other_user_id) {
                    setMessages(prev => {
                        // Prevent duplicate messages
                        const exists = prev.some(m => m.id === msg.id);
                        if (exists) return prev;
                        // Keep all file info from socket message
                        return [...prev, { ...msg, status: 'delivered' }];
                    });

                    // Notify sender that message was delivered
                    api.post(`/api/teams/direct-messages/${selectedChat.other_user_id}/delivered`).catch(() => { });

                    // Auto-mark as read since chat is open
                    api.post(`/api/teams/direct-messages/${selectedChat.other_user_id}/read`).catch(() => { });

                    // Clear unread count locally for this chat
                    setRecentChats(prev => prev.map(c =>
                        c.other_user_id === selectedChat.other_user_id ? { ...c, unread_count: 0 } : c
                    ));
                }
            });

            // Listen for message delivered status (gray double ticks)
            const unsubDelivered = subscribe('message:delivered', (data) => {
                if (data.receiver_id === selectedChat.other_user_id) {
                    // Change from single tick to double gray tick
                    setMessages(prev => prev.map(m =>
                        m.sender_id === auth.user?.id && m.status === 'sent' ? { ...m, status: 'delivered' } : m
                    ));
                }
            });

            // Listen for message read status updates (when receiver reads your messages)
            const unsubRead = subscribe('message:read', (data) => {
                if (data.reader_id === selectedChat.other_user_id) {
                    // Mark messages as seen in chat window
                    setMessages(prev => prev.map(m =>
                        m.sender_id === auth.user?.id ? { ...m, is_read: true, status: 'seen' } : m
                    ));
                    // Update chat list - blue ticks
                    setRecentChats(prev => prev.map(c =>
                        c.other_user_id === selectedChat.other_user_id ? { ...c, last_message_read: true } : c
                    ));
                }
            });

            return () => {
                unsubDM && unsubDM();
                unsubDelivered && unsubDelivered();
                unsubRead && unsubRead();
            };
        }
    }, [selectedChannel, selectedChat, subscribe]);

    // Global listener for DELIVERED status - updates chat view to double gray ticks
    useEffect(() => {
        const unsub = subscribe('message:delivered', (data) => {
            // Update messages in chat view - single tick to double gray tick
            setMessages(prev => prev.map(m =>
                m.sender_id === auth.user?.id && (m.status === 'sent' || m.status === 'sending')
                    ? { ...m, status: 'delivered', is_delivered: true }
                    : m
            ));

            // Update sidebar to show double gray ticks (delivered but not read)
            // Only update the SPECIFIC chat with the receiver_id from the event
            if (data.receiver_id) {
                setRecentChats(prev => prev.map(c =>
                    c.other_user_id === data.receiver_id && c.last_sender_id === auth.user?.id && !c.last_message_read
                        ? { ...c, last_message_delivered: true }
                        : c
                ));
            }
        });
        return unsub;
    }, [subscribe, auth.user?.id]);

    // Global listener for READ receipts - updates chat view to blue ticks + chat list
    useEffect(() => {
        const unsub = subscribe('message:read', (data) => {
            // Update messages in chat view - double gray to double blue
            setMessages(prev => prev.map(m =>
                m.sender_id === auth.user?.id
                    ? { ...m, is_read: true, status: 'seen' }
                    : m
            ));
            // Update chat list to show blue ticks
            setRecentChats(prev => prev.map(c =>
                c.other_user_id === data.reader_id ? { ...c, last_message_read: true } : c
            ));
        });
        return unsub;
    }, [subscribe, auth.user?.id]);

    // Global listener for CHANNEL messages - updates even when viewing other channels/chats
    // (selectedChannelRef is already declared above on line 66)

    useEffect(() => {
        const unsub = subscribe('channel:message', (data) => {
            if (data.message?.sender_id !== auth.user?.id) {
                const currentChannel = selectedChannelRef.current;
                // If viewing this channel, add message (no unread update needed)
                if (currentChannel?.id === data.channelId) {
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === data.message?.id);
                        if (exists) return prev;
                        return [...prev, { ...data.message, status: 'delivered' }];
                    });
                } else {
                    // NOT viewing this channel - increment unread count locally
                    setChannels(prev => prev.map(c =>
                        c.id === data.channelId
                            ? { ...c, unread_count: (parseInt(c.unread_count) || 0) + 1 }
                            : c
                    ));
                }
            }
        });
        return unsub;
    }, [subscribe, auth.user?.id]);

    // Keep refs updated
    useEffect(() => {
        selectedChatRef.current = selectedChat;
        selectedChannelRef.current = selectedChannel;
        selectedTeamRef.current = selectedTeam;
    }, [selectedChat, selectedChannel, selectedTeam]);

    // Real-time reaction updates via socket
    useEffect(() => {
        const unsub = subscribe('message:reaction', async (data) => {
            // data = { messageId, emoji, userId, reactions: [...] }
            if (data.messageId) {
                // Update messages state with new reactions
                setMessages(prev => {
                    const updated = prev.map(msg => {
                        // Ensure both IDs are compared as numbers
                        if (parseInt(msg.id) === parseInt(data.messageId)) {
                            return { ...msg, reactions: data.reactions || msg.reactions };
                        }
                        return msg;
                    });
                    return updated;
                });

                // Also update selectedMessageReactions if it's the same message
                setSelectedMessageReactions(prev => {
                    if (prev && parseInt(prev.id) === parseInt(data.messageId)) {
                        return { ...prev, reactions: data.reactions || prev.reactions };
                    }
                    return prev;
                });

                // ALWAYS refetch reactionDetails if the modal is open for this message
                // This ensures real-time updates for both your own reactions and others'
                if (showReactionsModal && selectedMessageReactions && parseInt(selectedMessageReactions.id) === parseInt(data.messageId)) {
                    try {
                        let res;
                        // Check if it's a channel message or direct message (use refs for current values)
                        if (selectedChannelRef.current && selectedTeamRef.current) {
                            res = await api.get(
                                `/api/teams/${selectedTeamRef.current.id}/channels/${selectedChannelRef.current.id}/messages/${data.messageId}/reactions`
                            );
                        } else if (selectedChatRef.current) {
                            res = await api.get(
                                `/api/teams/direct-messages/${selectedChatRef.current.other_user_id}/messages/${data.messageId}/reactions`
                            );
                        }
                        if (res) {
                            setReactionDetails(res.data.data || []);
                        }
                    } catch (err) {
                        console.error('Failed to refetch reaction details:', err);
                    }
                }
            }
        });
        return unsub;
    }, [subscribe, showReactionsModal, selectedMessageReactions, auth.user?.id]);

    // Listen for message deletion events
    useEffect(() => {
        const unsub = subscribe('message:deleted', (data) => {
            // data = { messageId, channelId, chatUserId }
            if (data.messageId) {
                setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
                toast.info('A message was deleted');
            }
        });
        return unsub;
    }, [subscribe]);

    // Listen for message edit events
    useEffect(() => {
        const unsub = subscribe('message:edited', (data) => {
            // data = { messageId, content, edited }
            if (data.messageId) {
                setMessages(prev => prev.map(msg =>
                    msg.id === data.messageId
                        ? { ...msg, content: data.content, edited: data.edited }
                        : msg
                ));
            }
        });
        return unsub;
    }, [subscribe]);

    //Close reaction pickers when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Don't close if clicking on the header menu button or the menu itself
            const target = event.target;
            const isHeaderMenuButton = target.closest('[data-header-menu-button]');
            const isHeaderMenu = target.closest('[data-header-menu]');
            const isMessageMenuButton = target.closest('[data-message-menu-button]');
            const isMessageMenu = target.closest('[data-message-menu]');
            const isChannelMenuButton = target.closest('[data-channel-menu-button]');
            const isChannelMenu = target.closest('[data-channel-menu]');
            const isReactionBar = target.closest('[data-reaction-bar]');

            if (!isHeaderMenuButton && !isHeaderMenu) {
                setShowHeaderMenu(false);
            }

            if (!isMessageMenuButton && !isMessageMenu) {
                setMessageMenuOpen(null);
            }

            if (!isChannelMenuButton && !isChannelMenu) {
                setChannelMenuOpen(null);
            }

            // Close reaction bars only if NOT clicking inside a reaction bar
            // (picker is handled by its own portal backdrop)
            if (!isReactionBar) {
                setMessages(prev => prev.map(m => ({ ...m, showReactionBar: false })));
            }
        };

        // Add click listener when any reaction UI or message menu is open
        const hasOpenReactions = messages.some(m => m.showReactionBar); // Picker handled by portal
        const hasOpenMenu = messageMenuOpen !== null;
        const hasHeaderMenu = showHeaderMenu;
        const hasChannelMenu = channelMenuOpen !== null;

        if (hasOpenReactions || hasOpenMenu || hasHeaderMenu || hasChannelMenu) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [messages, messageMenuOpen, showHeaderMenu, channelMenuOpen]);

    // Save starred messages to localStorage
    useEffect(() => {
        localStorage.setItem('starredMessages', JSON.stringify(starredMessages));
    }, [starredMessages]);

    // Save pinned messages to localStorage
    useEffect(() => {
        localStorage.setItem('pinnedMessages', JSON.stringify(pinnedMessages));
    }, [pinnedMessages]);

    // Track the last fetched message ID to prevent unnecessary refetches
    const lastFetchedReactionMessageIdRef = useRef(null);

    // Fetch reaction details when modal opens or a different message is selected
    useEffect(() => {
        const fetchReactionDetails = async () => {
            if (showReactionsModal && selectedMessageReactions) {
                const messageId = selectedMessageReactions.id;

                try {
                    let res;
                    // Check if it's a channel message or direct message
                    if (selectedChannel && selectedTeam) {
                        res = await api.get(
                            `/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages/${messageId}/reactions`
                        );
                    } else if (selectedChat) {
                        res = await api.get(
                            `/api/teams/direct-messages/${selectedChat.other_user_id}/messages/${messageId}/reactions`
                        );
                    }

                    if (res) {
                        setReactionDetails(res.data.data || []);
                        lastFetchedReactionMessageIdRef.current = messageId;
                    }
                } catch (err) {
                    console.error('Failed to fetch reaction details:', err);
                    setReactionDetails([]);
                }
            } else {
                setReactionDetails([]);
                lastFetchedReactionMessageIdRef.current = null;
            }
        };
        fetchReactionDetails();
    }, [showReactionsModal, selectedMessageReactions?.id, JSON.stringify(selectedMessageReactions?.reactions), selectedChat, selectedChannel, selectedTeam]);

    // Coming Soon Handler
    const handleComingSoon = (feature) => {
        setComingSoonFeature(feature);
        setShowComingSoon(true);
    };

    // API Functions
    const fetchTeams = async () => {
        try {
            const res = await api.get('/api/teams');
            setTeams(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchChannels = async (teamId) => {
        try {
            const res = await api.get(`/api/teams/${teamId}/channels`);
            const teamChannels = res.data.data || [];
            // Update only channels for this specific team, preserve other teams' channels
            setChannels(prev => {
                const otherTeamChannels = prev.filter(c => c.team_id !== teamId);
                return [...otherTeamChannels, ...teamChannels];
            });
        } catch (err) { console.error(err); }
    };

    const fetchChannelMessages = async (teamId, channelId, loadMore = false) => {
        try {
            if (!loadMore) setLoading(true);

            // Load only recent 50 messages for fast initial load
            const res = await api.get(`/api/teams/${teamId}/channels/${channelId}/messages?limit=50`);
            const newMessages = res.data.data || [];

            // Debug: Check what reactions data we're getting

            if (loadMore) {
                setMessages(prev => [...newMessages, ...prev]);
            } else {
                setMessages(newMessages);
                setHasMore(newMessages.length === 50); // If we got 50, there might be more
            }
        } catch (err) { console.error(err); } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchRecentChats = async () => {
        try {
            const res = await api.get('/api/teams/direct-messages');
            setRecentChats(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDMMessages = async (otherUserId, loadMore = false) => {
        try {
            if (!loadMore) setLoading(true);

            // Load only recent 50 messages for fast initial load
            const res = await api.get(`/api/teams/direct-messages/${otherUserId}?limit=50`);
            const newMessages = res.data.data || [];

            // Debug: Check what reactions data we're getting

            if (loadMore) {
                setMessages(prev => [...newMessages, ...prev]);
            } else {
                setMessages(newMessages);
                setHasMore(newMessages.length === 50); // If we got 50, there might be more
            }
        } catch (err) { console.error(err); } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await api.get('/api/notifications?limit=20');
            setActivities(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchMentions = async () => {
        // Simulated mentions - in real app, filter messages where user is mentioned
        setMentions([]);
    };

    // Load more older messages (infinite scroll)
    const loadMoreMessages = async () => {
        if (loadingMore || !hasMore || messages.length === 0) return;

        setLoadingMore(true);

        try {
            const oldestMessage = messages[0];
            const before = oldestMessage.created_at;

            let res;
            if (selectedChannel && selectedTeam) {
                res = await api.get(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages?limit=50&before=${before}`);
            } else if (selectedChat) {
                res = await api.get(`/api/teams/direct-messages/${selectedChat.other_user_id}?limit=50&before=${before}`);
            }

            const olderMessages = res?.data?.data || [];

            if (olderMessages.length > 0) {
                // Save current scroll position
                const container = messagesContainerRef.current;
                const previousScrollHeight = container?.scrollHeight || 0;

                // Add older messages to the beginning
                setMessages(prev => [...olderMessages, ...prev]);

                // Restore scroll position (prevent jump)
                setTimeout(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - previousScrollHeight;
                    }
                }, 50);

                // If we got less than 50, we've reached the end
                setHasMore(olderMessages.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Load more error:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle scroll for infinite loading
    const handleScroll = (e) => {
        const container = e.target;
        // If scrolled near top (within 200px), load more
        if (container.scrollTop < 200 && !loadingMore && hasMore) {
            loadMoreMessages();
        }
    };

    const fetchSharedFiles = async () => {
        // Extract files from messages or load from API
        const filesFromMessages = messages.filter(m => m.content && m.content.includes('📎 Shared file:'));
        const extractedFiles = filesFromMessages.map((m, idx) => ({
            id: m.id || idx,
            name: m.content.replace('📎 Shared file:', '').trim(),
            size: 'Unknown',
            uploadedBy: m.sender_name || 'Unknown',
            date: m.created_at ? new Date(m.created_at) : new Date(),
            url: m.file_url || null
        }));

        // Add demo files if no real files
        if (extractedFiles.length === 0) {
            setSharedFiles([
                { id: 1, name: 'Project_Proposal.pdf', size: '2.4 MB', uploadedBy: 'John Doe', date: new Date(), url: null },
                { id: 2, name: 'Budget_2024.xlsx', size: '1.1 MB', uploadedBy: 'Jane Smith', date: new Date(), url: null },
                { id: 3, name: 'Meeting_Notes.docx', size: '456 KB', uploadedBy: 'Mike Johnson', date: new Date(), url: null },
            ]);
        } else {
            setSharedFiles(extractedFiles);
        }
    };

    const searchUsers = async (q) => {
        setUserSearch(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const res = await api.get(`/api/teams/users/search?query=${q}`);
            setSearchResults(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await api.get('/api/teams/users/search?query=');
            setAllUsers(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    // Selection Handlers
    const selectTeam = (team) => {
        setExpandedTeams(prev => ({ ...prev, [team.id]: !prev[team.id] }));
        if (!expandedTeams[team.id]) {
            setSelectedTeam(team);
            fetchChannels(team.id);
        }
    };

    const selectChannel = (channel) => {
        // Clear unread count locally when opening channel
        setChannels(prev => prev.map(c =>
            c.id === channel.id ? { ...c, unread_count: 0 } : c
        ));
        setSelectedChannel({ ...channel, unread_count: 0 });
        setSelectedChat(null);
        setShowGeminiChat(false);

        // Reset infinite scroll state
        setHasMore(true);
        setLoadingMore(false);
        isInitialLoadRef.current = true; // Treat as new conversation

        // Safety check: ensure selectedTeam exists before accessing its properties
        if (selectedTeam?.id) {
            fetchChannelMessages(selectedTeam.id, channel.id);
            fetchSharedFiles();
            // Mark channel as read on server, then refetch to ensure clean state
            api.post(`/api/teams/${selectedTeam.id}/channels/${channel.id}/read`)
                .then(() => fetchChannels(selectedTeam.id))
                .catch(() => { });
        }
    };

    const selectChat = async (chat) => {
        // First update the UI immediately - clear unread count
        setRecentChats(prev => prev.map(c =>
            c.other_user_id === chat.other_user_id ? { ...c, unread_count: 0 } : c
        ));

        setSelectedChat({ ...chat, unread_count: 0 });
        setSelectedChannel(null);
        setSelectedTeam(null);
        setShowGeminiChat(false);

        // Reset infinite scroll state
        setHasMore(true);
        setLoadingMore(false);
        isInitialLoadRef.current = true; // Treat as new conversation

        // Fetch messages
        await fetchDMMessages(chat.other_user_id);
        fetchSharedFiles();

        // Mark messages as read on server, then refetch to ensure count is accurate
        api.post(`/api/teams/direct-messages/${chat.other_user_id}/read`)
            .then(() => fetchRecentChats())
            .catch(() => { });
    };

    const startNewChat = (user) => {
        const existing = recentChats.find(c => c.other_user_id === user.id);
        if (existing) {
            selectChat(existing);
        } else {
            const newChat = {
                other_user_id: user.id,
                other_user_name: user.name,
                other_user_avatar: user.avatar
            };
            setRecentChats([newChat, ...recentChats]);
            selectChat(newChat);
        }
        setSearchResults([]);
        setUserSearch('');
    };

    // Send Message - Optimistic UI for instant display
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageContent = newMessage;
        const tempId = Date.now();

        // Optimistic UI - add message immediately with 'sending' status
        const optimisticMessage = {
            id: tempId,
            sender_id: auth.user?.id,
            sender_name: auth.user?.name || 'You',
            content: messageContent,
            created_at: new Date().toISOString(),
            status: 'sending', // sending -> sent -> delivered -> seen
            reply_to: replyingTo?.id || null
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setShowEmojiPicker(false);
        setShowMentionDropdown(false);
        const replyId = replyingTo?.id;
        setReplyingTo(null); // Clear reply state

        try {
            if (selectedChannel && selectedTeam) {
                const res = await api.post(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages`, {
                    content: messageContent,
                    reply_to: replyId
                });
                // Update with real message data
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...res.data.data, status: 'sent' } : m
                ));
            } else if (selectedChat) {
                const res = await api.post(`/api/teams/direct-messages/${selectedChat.other_user_id}`, {
                    content: messageContent,
                    reply_to: replyId
                });
                // Update with real message data
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...res.data.data, status: 'sent' } : m
                ));
                // Update chat list with your sent message (clear file metadata for text messages)
                setRecentChats(prev => prev.map(c =>
                    c.other_user_id === selectedChat.other_user_id ? {
                        ...c,
                        last_message: messageContent,
                        last_message_file_type: null, // Clear file type for text messages
                        last_message_file_name: null, // Clear file name for text messages
                        last_message_at: new Date().toISOString(),
                        last_sender_id: auth.user?.id,
                        last_message_read: false,
                        last_message_delivered: false // Show single tick until delivered
                    } : c
                ));
            }
        } catch (err) {
            console.error(err);
            // Mark message as failed
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, status: 'failed' } : m
            ));
            toast.error('Failed to send message');
        }
    };

    // Add Emoji
    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
    };

    // Add Reaction (local update for instant feedback)
    const addReaction = async (messageId, emoji) => {
        // Track recently used emoji
        setRecentlyUsedEmojis(prev => {
            // Remove emoji if it already exists to move it to front
            const filtered = prev.filter(e => e !== emoji);
            // Add to front, keep max 8 emojis
            const updated = [emoji, ...filtered].slice(0, 8);
            // Save to localStorage
            try {
                localStorage.setItem(`recentEmojis_${auth.user?.id}`, JSON.stringify(updated));
            } catch (err) {
                console.error('Failed to save recent emojis:', err);
            }
            return updated;
        });

        // Local update for instant feedback
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const existingReactions = msg.reactions || [];
                const existingEmoji = existingReactions.find(r => r.emoji === emoji);
                if (existingEmoji) {
                    return {
                        ...msg,
                        reactions: existingReactions.map(r =>
                            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                        )
                    };
                } else {
                    return {
                        ...msg,
                        reactions: [...existingReactions, { emoji, count: 1 }]
                    };
                }
            }
            return msg;
        }));

        // Also update selectedMessageReactions for the modal tabs at the top
        setSelectedMessageReactions(prev => {
            if (!prev || prev.id !== messageId) return prev;
            const existingReactions = prev.reactions || [];
            const existingEmoji = existingReactions.find(r => r.emoji === emoji);
            if (existingEmoji) {
                return {
                    ...prev,
                    reactions: existingReactions.map(r =>
                        r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                    )
                };
            } else {
                return {
                    ...prev,
                    reactions: [...existingReactions, { emoji, count: 1 }]
                };
            }
        });

        // API call to persist reaction
        try {
            if (selectedChannel && selectedTeam) {
                // Channel message reaction
                await api.post(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages/${messageId}/react`, { emoji });
            } else if (selectedChat) {
                // Direct message reaction
                await api.post(`/api/teams/direct-messages/${selectedChat.other_user_id}/messages/${messageId}/react`, { emoji });
            }
        } catch (err) {
            console.error('Reaction API error:', err);
            // Optionally revert the local update on error
            // For now, we keep the local update even if API fails
        }
    };

    // Remove Reaction (local update for instant feedback)
    const removeReaction = async (messageId, emoji) => {
        // Local update for instant feedback
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const existingReactions = msg.reactions || [];
                const existingEmoji = existingReactions.find(r => r.emoji === emoji);
                if (existingEmoji) {
                    if (existingEmoji.count > 1) {
                        // Decrease count by 1
                        return {
                            ...msg,
                            reactions: existingReactions.map(r =>
                                r.emoji === emoji ? { ...r, count: r.count - 1 } : r
                            )
                        };
                    } else {
                        // Remove the emoji entirely if count becomes 0
                        return {
                            ...msg,
                            reactions: existingReactions.filter(r => r.emoji !== emoji)
                        };
                    }
                }
            }
            return msg;
        }));

        // Also update reactionDetails for the modal user list
        setReactionDetails(prev => prev.filter(r => !(r.emoji === emoji && r.user_id === auth.user?.id)));

        // Also update selectedMessageReactions for the modal tabs at the top
        setSelectedMessageReactions(prev => {
            if (!prev || prev.id !== messageId) return prev;
            const existingReactions = prev.reactions || [];
            const existingEmoji = existingReactions.find(r => r.emoji === emoji);
            if (existingEmoji) {
                if (existingEmoji.count > 1) {
                    return {
                        ...prev,
                        reactions: existingReactions.map(r =>
                            r.emoji === emoji ? { ...r, count: r.count - 1 } : r
                        )
                    };
                } else {
                    return {
                        ...prev,
                        reactions: existingReactions.filter(r => r.emoji !== emoji)
                    };
                }
            }
            return prev;
        });

        // API call to remove reaction
        try {
            if (selectedChannel && selectedTeam) {
                // Channel message reaction
                await api.delete(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages/${messageId}/react`, { data: { emoji } });
            } else if (selectedChat) {
                // Direct message reaction
                await api.delete(`/api/teams/direct-messages/${selectedChat.other_user_id}/messages/${messageId}/react`, { data: { emoji } });
            }
        } catch (err) {
            console.error('Remove reaction API error:', err);
        }
    };

    // File Upload - Convert all files to base64 for receiver with status tracking
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            // Check each file size
            const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast.warning(`${oversizedFiles.length} file(s) too large (max 10MB each).`);
                e.target.value = '';
                return;
            }

            toast.info(`Uploading ${files.length} file(s)...`);

            // Process all files
            for (const file of files) {
                await uploadSingleFile(file);
            }

            fetchRecentChats();
        } catch (err) {
            console.error('File upload error:', err);
            toast.error('Failed to upload files');
        }

        e.target.value = '';
    };

    // Helper function to upload a single file (simple - no cancel/retry complexity)
    const uploadSingleFile = async (file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const fileSize = file.size < 1024 ? `${file.size} B` :
            file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` :
                `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        const tempId = Date.now() + Math.random();

        try {
            // Convert to base64
            const fileUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const optimisticMessage = {
                id: tempId,
                sender_id: auth.user?.id,
                sender_name: auth.user?.name || 'You',
                content: (isImage || isVideo) ? '' : `📎 ${file.name}`,
                file_url: fileUrl,
                file_name: file.name,
                file_type: file.type,
                file_size: fileSize,
                created_at: new Date().toISOString(),
                status: 'sending'
            };

            // Add optimistic message immediately
            setMessages(prev => [...prev, optimisticMessage]);

            // Send to channel or DM
            let res;
            if (selectedChannel && selectedTeam) {
                res = await api.post(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages`, {
                    content: (isImage || isVideo) ? '' : `📎 ${file.name}`,
                    file_url: fileUrl,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: fileSize
                });
            } else if (selectedChat) {
                res = await api.post(`/api/teams/direct-messages/${selectedChat.other_user_id}`, {
                    content: (isImage || isVideo) ? '' : `📎 ${file.name}`,
                    file_url: fileUrl,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: fileSize
                });
            }

            // Update with real message data
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...res.data.data, status: 'sent' } : m
            ));

            toast.success('File uploaded successfully!');
        } catch (err) {
            console.error('File upload error:', err);
            // Remove the optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error(`Failed to upload ${file.name}`);
        }
    };

    // Create Group
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error('Please enter a group name');
            return;
        }
        if (creatingGroup) return; // Prevent double-clicks

        setCreatingGroup(true);
        try {
            const channelToCreate = newGroupInitialChannel.trim();

            const requestData = {
                name: newGroupName,
                type: 'custom',
                members: newGroupMembers.map(m => m.id),
                ...(channelToCreate && { initial_channel: channelToCreate })
            };


            const response = await api.post('/api/teams', requestData);

            // Add the new team to the list immediately for instant UI update
            if (response.data?.data) {
                setTeams(prev => [...prev, response.data.data]);
            }

            toast.success('Team created!');

            // Reset form state first
            setNewGroupName('');
            setNewGroupMembers([]);
            setNewGroupInitialChannel('');
            setCreatingGroup(false);

            // Then close the modal
            setShowCreateGroup(false);

            // Refresh teams list from server to ensure consistency
            await fetchTeams();
        } catch (err) {
            console.error('Create team error:', err);
            toast.error('Failed to create group');
            setCreatingGroup(false);
        }
    };

    // Create new channel
    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || !selectedTeam) return;
        try {
            await api.post(`/api/teams/${selectedTeam.id}/channels`, {
                name: newChannelName
            });
            toast.success('Channel created!');
            setShowCreateChannel(false);
            setNewChannelName('');
            fetchChannels(selectedTeam.id);
        } catch (err) {
            toast.error('Failed to create channel');
        }
    };

    // Update team name
    const handleUpdateTeam = async () => {
        if (!editingTeamName.trim() || !selectedTeam) return;
        try {
            await api.put(`/api/teams/${selectedTeam.id}`, {
                name: editingTeamName
            });
            toast.success('Team updated!');
            setShowTeamSettings(false);
            fetchTeams();
        } catch (err) {
            toast.error('Failed to update team');
        }
    };

    // Delete team
    const handleDeleteTeam = async () => {
        if (!selectedTeam) return;
        if (!confirm('Are you sure you want to delete this team?')) return;
        try {
            await api.delete(`/api/teams/${selectedTeam.id}`);
            toast.success('Team deleted!');
            setShowTeamSettings(false);
            setSelectedTeam(null);
            setSelectedChannel(null);
            fetchTeams();
        } catch (err) {
            toast.error('Failed to delete team');
        }
    };

    // Delete channel
    const handleDeleteChannel = async (channelId) => {
        if (!confirm('Are you sure you want to delete this channel?')) return;
        try {
            await api.delete(`/api/teams/${selectedTeam.id}/channels/${channelId}`);
            toast.success('Channel deleted!');
            if (selectedChannel?.id === channelId) {
                setSelectedChannel(null);
            }
            fetchChannels(selectedTeam.id);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete channel');
        }
    };

    // Edit channel
    const handleEditChannel = async () => {
        if (!editingChannel || !editingChannelName.trim()) return;
        try {
            await api.put(`/api/teams/${editingChannel.team_id}/channels/${editingChannel.id}`, {
                name: editingChannelName.trim()
            });
            toast.success('Channel updated!');
            setShowEditChannel(false);
            setEditingChannel(null);
            setEditingChannelName('');
            fetchChannels(editingChannel.team_id);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update channel');
        }
    };

    // Add member to team
    const handleAddMember = async (userId) => {
        if (!selectedTeam) return;
        try {
            await api.post(`/api/teams/${selectedTeam.id}/members`, {
                memberId: userId
            });
            toast.success('Member added!');
            setShowAddMember(false);
        } catch (err) {
            toast.error('Failed to add member');
        }
    };

    // Gemini AI Chat
    const handleGeminiSend = async () => {
        if (!geminiInput.trim()) return;

        const userMsg = { role: 'user', content: geminiInput };
        setGeminiMessages(prev => [...prev, userMsg]);
        setGeminiInput('');
        setGeminiLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const response = GEMINI_RESPONSES[Math.floor(Math.random() * GEMINI_RESPONSES.length)];
            const aiMsg = { role: 'assistant', content: response + '\n\n' + generateContextualResponse(geminiInput) };
            setGeminiMessages(prev => [...prev, aiMsg]);
            setGeminiLoading(false);
        }, 1500);
    };

    const generateContextualResponse = (query) => {
        const q = query.toLowerCase();
        if (q.includes('meeting') || q.includes('schedule')) {
            return "📅 I can help you schedule meetings. Would you like me to check your calendar availability or create a new meeting invite?";
        }
        if (q.includes('project') || q.includes('task')) {
            return "📊 For project management, I recommend breaking down tasks into smaller milestones. Would you like me to help create a project timeline?";
        }
        if (q.includes('email') || q.includes('message')) {
            return "✉️ I can help draft professional emails or messages. Just let me know the recipient and key points you'd like to communicate.";
        }
        if (q.includes('help') || q.includes('how')) {
            return "💡 I'm here to assist with:\n• Scheduling & Calendar\n• Project Planning\n• Document Drafting\n• Team Collaboration Tips\n• Quick Answers\n\nWhat would you like help with?";
        }
        return "🎯 I've noted your request. Is there anything specific you'd like me to elaborate on or help you with?";
    };

    // Message Action Handlers
    const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
        try {
            if (selectedChannel && selectedTeam) {
                await api.delete(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages/${messageId}`);
            } else if (selectedChat) {
                await api.delete(`/api/teams/direct-messages/${selectedChat.other_user_id}/messages/${messageId}`);
            }

            // Update local state
            setMessages(prev => prev.filter(m => m.id !== messageId));
            toast.success(deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted');
            setMessageMenuOpen(null);
            setShowDeleteModal(false);
            setMessageToDelete(null);
        } catch (err) {
            toast.error('Failed to delete message');
            console.error(err);
        }
    };

    const handleEditMessage = async () => {
        if (!editContent.trim() || !editingMessage) return;

        try {
            if (selectedChannel && selectedTeam) {
                await api.put(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/messages/${editingMessage.id}`, {
                    content: editContent
                });
            } else if (selectedChat) {
                await api.put(`/api/teams/direct-messages/${selectedChat.other_user_id}/messages/${editingMessage.id}`, {
                    content: editContent
                });
            }

            // Update local state
            setMessages(prev => prev.map(m =>
                m.id === editingMessage.id ? { ...m, content: editContent, edited: true } : m
            ));
            toast.success('Message updated');
            setEditingMessage(null);
            setEditContent('');
        } catch (err) {
            toast.error('Failed to update message');
            console.error(err);
        }
    };

    const handleStarMessage = (message) => {
        setStarredMessages(prev => {
            const isStarred = prev.some(m => m.id === message.id);
            if (isStarred) {
                toast.info('Removed from starred');
                return prev.filter(m => m.id !== message.id);
            } else {
                toast.success('Added to starred messages');
                return [...prev, message];
            }
        });
        setMessageMenuOpen(null);
    };

    const handlePinMessage = (message) => {
        setPinnedMessages(prev => {
            const isPinned = prev.some(m => m.id === message.id);
            if (isPinned) {
                toast.info('Message unpinned');
                return prev.filter(m => m.id !== message.id);
            } else {
                toast.success('Message pinned');
                return [...prev, message];
            }
        });
        setMessageMenuOpen(null);
    };

    const handleCopyMessage = (content) => {
        navigator.clipboard.writeText(content);
        toast.success('Message copied to clipboard');
        setMessageMenuOpen(null);
    };

    const handleReplyToMessage = (message) => {
        setReplyingTo(message);
        setMessageMenuOpen(null);
    };

    const handleForwardMessage = (message) => {
        setForwardingMessage(message);
        setShowForwardModal(true);
        setMessageMenuOpen(null);
    };

    const handleSendForward = async () => {
        if (selectedForwardUsers.length === 0) {
            toast.error('Please select at least one user');
            return;
        }

        try {
            for (const userId of selectedForwardUsers) {
                await api.post(`/api/teams/direct-messages/${userId}`, {
                    content: forwardingMessage.content,
                    file_url: forwardingMessage.file_url
                });
            }
            toast.success(`Forwarded to ${selectedForwardUsers.length} user(s)`);
            setShowForwardModal(false);
            setForwardingMessage(null);
            setSelectedForwardUsers([]);
            setForwardSearch('');
        } catch (err) {
            toast.error('Failed to forward message');
            console.error(err);
        }
    };

    const handleReportMessage = (message) => {
        toast.info('Message reported to admins');
        setMessageMenuOpen(null);
    };


    // Get current chat/channel name
    const getCurrentName = () => {
        if (showGeminiChat) return 'Gemini AI';
        if (selectedChannel) return `#${selectedChannel.name}`;
        if (selectedChat) return selectedChat.other_user_name;
        return 'Select a chat';
    };

    const getCurrentAvatar = () => {
        if (showGeminiChat) return '✨';
        if (selectedChannel) return selectedChannel.name?.[0];
        if (selectedChat) return selectedChat.other_user_name?.[0];
        return '?';
    };

    return (

        <div className="flex h-screen bg-[#1b1b1b] overflow-hidden">
            {/* ========== LEFT NAV RAIL ========== */}
            <div className="w-[68px] bg-[#2b2b2b] flex flex-col items-center py-2 border-r border-[#3b3b3b]">
                {/* Logo */}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <FaComments className="text-white text-lg" />
                </div>

                {/* Nav Items */}
                <NavItem icon={<FaBell />} label="Activity" active={activeNav === 'activity'} onClick={() => setActiveNav('activity')} badge={activities.length > 0 ? activities.length : null} />
                <NavItem icon={<FaComments />} label="Chat" active={activeNav === 'chat'} onClick={() => setActiveNav('chat')} badge={recentChats.filter(c => c.unread_count > 0).length || null} />
                <NavItem icon={<FaCalendarAlt />} label="Calendar" active={activeNav === 'calendar'} onClick={() => navigate('/calendar')} />
                <NavItem icon={<FaVideo />} label="Calls" onClick={() => handleComingSoon('Video Calls')} />
                <NavItem icon={<FaPhone />} label="Phone" onClick={() => handleComingSoon('Phone Calls')} />
                <NavItem icon={<FaEllipsisH />} label="More" onClick={() => handleComingSoon('More Features')} />

                <div className="flex-1" />

                <NavItem icon={<FaTh />} label="Apps" onClick={() => navigate('/dashboard')} />
            </div>

            <ChatSidebar
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                activities={activities}
                recentChats={recentChats}
                setShowCreateGroup={setShowCreateGroup}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                selectedChat={selectedChat}
                setShowUsersList={setShowUsersList}
                showGeminiChat={showGeminiChat}
                setShowGeminiChat={setShowGeminiChat}
                setSelectedChat={setSelectedChat}
                setSelectedChannel={setSelectedChannel}
                navigate={navigate}
                handleComingSoon={handleComingSoon}
                teams={teams}
                selectedTeam={selectedTeam}
                selectTeam={selectTeam}
                expandedTeams={expandedTeams}
                channels={channels}
                selectedChannel={selectedChannel}
                selectChannel={selectChannel}
                channelMenuOpen={channelMenuOpen}
                setChannelMenuOpen={setChannelMenuOpen}
                setEditingChannel={setEditingChannel}
                setEditingChannelName={setEditingChannelName}
                setShowEditChannel={setShowEditChannel}
                handleDeleteChannel={handleDeleteChannel}
                setShowCreateChannel={setShowCreateChannel}
                mentions={mentions}
                selectChat={selectChat}
                auth={auth}
                showUsersList={showUsersList}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                searchUsers={searchUsers}
                searchResults={searchResults}
                setSearchResults={setSearchResults}
                allUsers={allUsers}
                startNewChat={startNewChat}
                setShowTeamSettings={setShowTeamSettings}
                setEditingTeamName={setEditingTeamName}
            />


            {/* ========== MAIN CONTENT ========== */}
            <div className="flex-1 flex flex-col bg-[#1b1b1b]">
                <ChatHeader
                    selectedChat={selectedChat}
                    selectedChannel={selectedChannel}
                    selectedTeam={selectedTeam}
                    showGeminiChat={showGeminiChat}
                    showSearch={showSearch}
                    setShowSearch={setShowSearch}
                    showHeaderMenu={showHeaderMenu}
                    setShowHeaderMenu={setShowHeaderMenu}
                    setShowContactInfo={setShowContactInfo}
                    setSelectedChat={setSelectedChat}
                    setMessages={setMessages}
                    setSelectedChannel={setSelectedChannel}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    fetchRecentChats={fetchRecentChats}
                    api={api}
                    handleComingSoon={handleComingSoon}
                    getCurrentName={getCurrentName}
                    getCurrentAvatar={getCurrentAvatar}
                />
                {/* Tabs (for channels) */}
                {(selectedChannel || selectedChat) && !showGeminiChat && (
                    <div className="h-10 border-b border-[#3b3b3b] flex items-center px-4 gap-4 bg-[#1f1f1f]">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`text-sm pb-2 px-1 ${activeTab === 'chat' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => { setActiveTab('shared'); fetchSharedFiles(); }}
                            className={`text-sm pb-2 px-1 ${activeTab === 'shared' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            Shared
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {showGeminiChat ? (
                    /* Gemini AI Chat */
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {geminiMessages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                        }`}>
                                        {msg.role === 'user' ? auth.user?.name?.[0] || 'U' : '✨'}
                                    </div>
                                    <div className={`max-w-[70%] px-4 py-3 rounded-lg text-sm ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none'
                                        : 'bg-[#2b2b2b] text-gray-200 rounded-tl-none border border-[#3b3b3b]'
                                        }`}>
                                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                    </div>
                                </div>
                            ))}
                            {geminiLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">✨</div>
                                    <div className="bg-[#2b2b2b] px-4 py-3 rounded-lg border border-[#3b3b3b]">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-[#1f1f1f] border-t border-[#3b3b3b]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={geminiInput}
                                    onChange={(e) => setGeminiInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleGeminiSend()}
                                    placeholder="Ask Gemini anything..."
                                    className="flex-1 px-4 py-3 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleGeminiSend}
                                    disabled={!geminiInput.trim() || geminiLoading}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg"
                                >
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'shared' ? (
                    /* Shared Files */
                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Shared Files</h3>
                        <div className="space-y-2">
                            {sharedFiles.map(file => (
                                <div key={file.id} className="flex items-center gap-3 p-3 bg-[#2b2b2b] rounded-lg hover:bg-[#3b3b3b] transition-colors">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.name.endsWith('.pdf') ? 'bg-red-500/20 text-red-400' :
                                        file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'bg-green-500/20 text-green-400' :
                                            file.name.endsWith('.docx') || file.name.endsWith('.doc') ? 'bg-blue-500/20 text-blue-400' :
                                                file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        <FaFile />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white">{file.name}</p>
                                        <p className="text-xs text-gray-500">{file.size} • {file.uploadedBy} • {file.date ? format(new Date(file.date), 'MMM d') : ''}</p>
                                    </div>
                                    <a
                                        href={file.url || '#'}
                                        download={file.name}
                                        onClick={(e) => {
                                            if (!file.url) {
                                                e.preventDefault();
                                                toast.info('File download not available in demo');
                                            }
                                        }}
                                        className="p-2 hover:bg-[#4b4b4b] rounded text-gray-400 hover:text-white transition-colors"
                                        title="Download file"
                                    >
                                        <FaDownload />
                                    </a>
                                </div>
                            ))}
                            {sharedFiles.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No shared files yet</p>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Messages Area */
                    <>
                        {/* Pinned Messages Banner */}
                        {pinnedMessages.length > 0 && (
                            <div className="bg-[#2b2b2b] border-b border-[#3b3b3b] px-4 py-2">
                                <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                                    </svg>
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer hover:bg-[#3b3b3b]/50 px-2 py-1 rounded transition-colors"
                                        onClick={() => {
                                            const element = document.getElementById(`msg-${pinnedMessages[0].id}`);
                                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                    >
                                        <p className="text-xs text-gray-300 truncate">{pinnedMessages[0].content}</p>
                                    </div>
                                    <button
                                        onClick={() => handlePinMessage(pinnedMessages[0].id, false)}
                                        className="text-gray-400 hover:text-white p-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}

                        <MessageList
                            pinnedMessages={pinnedMessages}
                            setPinnedMessages={setPinnedMessages}
                            messagesContainerRef={messagesContainerRef}
                            messagesEndRef={messagesEndRef}
                            handleScroll={handleScroll}
                            loading={loading}
                            loadingMore={loadingMore}
                            messages={messages}
                            setMessages={setMessages}
                            searchQuery={searchQuery}
                            auth={auth}
                            setImagePreview={setImagePreview}
                            setReplyingTo={setReplyingTo}
                            setMessageToDelete={setMessageToDelete}
                            setShowDeleteModal={setShowDeleteModal}
                            addReaction={addReaction}
                            removeReaction={removeReaction}
                            setEditingMessage={setEditingMessage}
                            setEditContent={setEditContent}
                            handleForwardMessage={handleForwardMessage}
                            handleStarMessage={handleStarMessage}
                            starredMessages={starredMessages}
                            handleReplyToMessage={handleReplyToMessage}
                            handleCopyMessage={handleCopyMessage}
                            handlePinMessage={handlePinMessage}
                            handleReportMessage={handleReportMessage}
                            messageMenuOpen={messageMenuOpen}
                            setMessageMenuOpen={setMessageMenuOpen}
                            recentlyUsedEmojis={recentlyUsedEmojis}
                            setSelectedMessageReactions={setSelectedMessageReactions}
                            setReactionsModalTab={setReactionsModalTab}
                            setShowReactionsModal={setShowReactionsModal}
                        />

                        <MessageInput
                            showEmojiPicker={showEmojiPicker}
                            setShowEmojiPicker={setShowEmojiPicker}
                            addEmoji={addEmoji}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            auth={auth}
                            editingMessage={editingMessage}
                            setEditingMessage={setEditingMessage}
                            editContent={editContent}
                            setEditContent={setEditContent}
                            handleEditMessage={handleEditMessage}
                            showMentionDropdown={showMentionDropdown}
                            allUsers={allUsers}
                            mentionQuery={mentionQuery}
                            setShowMentionDropdown={setShowMentionDropdown}
                            setMentionQuery={setMentionQuery}
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            handleSendMessage={handleSendMessage}
                            fileInputRef={fileInputRef}
                            handleFileUpload={handleFileUpload}
                        />
                    </>
                )
                }
            </div >


            <CreateGroupModal
                show={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                newGroupName={newGroupName}
                setNewGroupName={setNewGroupName}
                newGroupInitialChannel={newGroupInitialChannel}
                setNewGroupInitialChannel={setNewGroupInitialChannel}
                newGroupMembers={newGroupMembers}
                setNewGroupMembers={setNewGroupMembers}
                userSearch={userSearch}
                searchUsers={searchUsers}
                searchResults={searchResults}
                allUsers={allUsers}
                creatingGroup={creatingGroup}
                handleCreateGroup={handleCreateGroup}
            />

            <TeamSettingsModal
                show={showTeamSettings}
                onClose={() => setShowTeamSettings(false)}
                editingTeamName={editingTeamName}
                setEditingTeamName={setEditingTeamName}
                onSaveChanges={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
                onAddMembers={() => { setShowTeamSettings(false); setShowAddMember(true); }}
            />

            <CreateChannelModal
                show={showCreateChannel}
                onClose={() => setShowCreateChannel(false)}
                newChannelName={newChannelName}
                setNewChannelName={setNewChannelName}
                onCreate={handleCreateChannel}
            />

            <EditChannelModal
                show={showEditChannel}
                onClose={() => setShowEditChannel(false)}
                editingChannel={editingChannel}
                editingChannelName={editingChannelName}
                setEditingChannelName={setEditingChannelName}
                onSave={handleEditChannel}
            />

            <AddMemberModal
                show={showAddMember}
                onClose={() => setShowAddMember(false)}
                allUsers={allUsers}
                onAddMember={handleAddMember}
            />

            <ForwardMessageModal
                show={showForwardModal}
                onClose={() => setShowForwardModal(false)}
                forwardingMessage={forwardingMessage}
                forwardSearch={forwardSearch}
                setForwardSearch={setForwardSearch}
                allUsers={allUsers}
                selectedForwardUsers={selectedForwardUsers}
                setSelectedForwardUsers={setSelectedForwardUsers}
                onSendForward={handleSendForward}
                currentUserId={auth.user?.id}
            />

            <DeleteModal
                show={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setMessageToDelete(null); }}
                messageToDelete={messageToDelete}
                currentUserId={auth.user?.id}
                onDeleteForEveryone={() => handleDeleteMessage(messageToDelete.id, true)}
                onDeleteForMe={() => handleDeleteMessage(messageToDelete.id, false)}
            />

            <ReactionsModal
                show={showReactionsModal}
                onClose={() => setShowReactionsModal(false)}
                selectedMessageReactions={selectedMessageReactions}
                reactionsModalTab={reactionsModalTab}
                setReactionsModalTab={setReactionsModalTab}
                reactionDetails={reactionDetails}
                currentUserId={auth.user?.id}
                onRemoveReaction={removeReaction}
            />

            <ContactInfoSidebar
                show={showContactInfo}
                onClose={() => setShowContactInfo(false)}
                selectedChat={selectedChat}
                selectedChannel={selectedChannel}
                setShowStarredView={setShowStarredView}
                setSelectedChat={setSelectedChat}
                setMessages={setMessages}
            />

            <StarredMessagesView
                show={showStarredView}
                onClose={() => setShowStarredView(false)}
                starredMessages={starredMessages}
                setStarredMessages={setStarredMessages}
                currentUserId={auth.user?.id}
            />

            <ComingSoonModal
                show={showComingSoon}
                onClose={() => setShowComingSoon(false)}
                featureName={comingSoonFeature}
            />

            <ImagePreviewModal
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                messages={messages}
                setReplyingTo={setReplyingTo}
                handleForwardMessage={handleForwardMessage}
                setMessageToDelete={setMessageToDelete}
                setShowDeleteModal={setShowDeleteModal}
                starredMessages={starredMessages}
                setStarredMessages={setStarredMessages}
            />
        </div>
    );
}

// src/pages/TeamsPage.jsx - Microsoft Teams Professional Interface with Full Features
// Fixed JSX syntax errors
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
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api/axiosClient';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-toastify';

// Emoji data
const EMOJI_LIST = ['😀', '😂', '😊', '😍', '🥰', '😎', '🤔', '😅', '😢', '😭', '😤', '😡', '🥳', '🎉', '👍', '👎', '❤️', '🔥', '💯', '✅', '❌', '⭐', '💡', '🚀', '💪', '🙏', '👋', '🤝', '💼', '📊', '📈', '📉', '📅', '⏰', '✉️', '📎', '🔗', '💻', '📱', '🎯', '🏆', '🌟', '💎', '🎨', '📝', '✏️', '📌', '🔔'];

// Gemini AI responses (simulated)
const GEMINI_RESPONSES = [
    "I'd be happy to help you with that! Based on your query, here's what I suggest...",
    "Great question! Let me analyze this for you...",
    "I've processed your request. Here's my recommendation...",
    "That's an interesting point. From my analysis...",
    "I can assist you with that. Here are some options to consider...",
];

// Custom Video Player Component
function CustomVideoPlayer({ url }) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [volumeIndicatorVisible, setVolumeIndicatorVisible] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(0);
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const hideControlsTimeoutRef = useRef(null);
    const volumeIndicatorTimeoutRef = useRef(null);
    const progressBarRef = useRef(null);
    const fullscreenProgressBarRef = useRef(null);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Reset hide controls timer
    const resetHideControlsTimer = () => {
        setShowControls(true);
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current);
        }
        if (isFullscreen) {
            hideControlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // Show volume indicator temporarily when changing volume via keyboard
    const showVolumeIndicator = () => {
        setVolumeIndicatorVisible(true);
        if (volumeIndicatorTimeoutRef.current) {
            clearTimeout(volumeIndicatorTimeoutRef.current);
        }
        volumeIndicatorTimeoutRef.current = setTimeout(() => {
            setVolumeIndicatorVisible(false);
        }, 1500);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    };

    const skip = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(!isMuted);
            showVolumeIndicator();
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setVolume(val);
            setIsMuted(val === 0);
        }
    };

    const handleSeek = (e) => {
        const val = parseFloat(e.target.value);
        if (videoRef.current && duration) {
            videoRef.current.currentTime = (val / 100) * duration;
        }
    };

    // Handle mouse hover on progress bar to show time preview
    const handleProgressHover = (e, barRef) => {
        if (!duration || !barRef?.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const position = (e.clientX - rect.left) / rect.width;
        const clampedPosition = Math.max(0, Math.min(1, position));
        const time = clampedPosition * duration;
        setHoverTime(time);
        setHoverPosition(clampedPosition * 100);
    };

    const handleProgressLeave = () => {
        setHoverTime(null);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
        resetHideControlsTimer();
        switch (e.key) {
            case ' ':
            case 'k':
            case 'K':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowRight':
            case 'l':
            case 'L':
                e.preventDefault();
                skip(10);
                break;
            case 'ArrowLeft':
            case 'j':
            case 'J':
                e.preventDefault();
                skip(-10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (videoRef.current) {
                    videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1);
                    setVolume(videoRef.current.volume);
                    showVolumeIndicator();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (videoRef.current) {
                    videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1);
                    setVolume(videoRef.current.volume);
                    showVolumeIndicator();
                }
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                toggleMute();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            default:
                break;
        }
    };

    // Handle mouse movement to show/hide controls
    const handleMouseMove = () => {
        resetHideControlsTimer();
    };

    const handleMouseLeave = () => {
        if (isFullscreen) {
            hideControlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 1000);
        }
    };

    // Add/remove keyboard event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPlaying, isMuted, volume, isFullscreen]);

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isNowFullscreen);
            if (!isNowFullscreen) {
                // Exiting fullscreen - always show controls
                setShowControls(true);
                if (hideControlsTimeoutRef.current) {
                    clearTimeout(hideControlsTimeoutRef.current);
                }
            } else {
                // Entering fullscreen - start hide timer
                resetHideControlsTimer();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
            if (volumeIndicatorTimeoutRef.current) {
                clearTimeout(volumeIndicatorTimeoutRef.current);
            }
        };
    }, []);

    // Calculate volume percentage for the slider fill
    const volumePercent = isMuted ? 0 : Math.round(volume * 100);

    return (
        <div
            ref={containerRef}
            className={`relative ${isFullscreen ? 'bg-black w-screen h-screen flex items-center justify-center' : 'inline-block'}`}
            style={{ outline: 'none', cursor: isFullscreen && !showControls ? 'none' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Video Element - NO native controls */}
            <video
                ref={videoRef}
                src={url}
                className={`object-contain ${isFullscreen ? 'w-full h-full' : 'max-w-full rounded-lg'}`}
                style={{
                    maxHeight: isFullscreen ? 'calc(100vh - 100px)' : 'calc(100vh - 280px)',
                    outline: 'none'
                }}
                autoPlay
                playsInline
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
            />

            {/* NORMAL MODE - Controls positioned below video, matching video width */}
            {!isFullscreen && (
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3"
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="flex items-center gap-2">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer focus:outline-none flex-shrink-0"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <FaPause className="text-white text-[8px]" />
                            ) : (
                                <FaPlay className="text-white text-[8px] ml-0.5" />
                            )}
                        </button>

                        {/* Progress Bar - Green bar with blue head */}
                        <div
                            ref={progressBarRef}
                            className="flex-1 h-3 relative flex items-center"
                            onMouseMove={(e) => handleProgressHover(e, progressBarRef)}
                            onMouseLeave={handleProgressLeave}
                        >
                            {/* Background track (gray) */}
                            <div className="absolute w-full h-[2px] bg-gray-500 rounded-full" />
                            {/* Filled track (green) */}
                            <div
                                className="absolute h-[2px] bg-green-500 rounded-full"
                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                            {/* Blue thumb/head */}
                            <div
                                className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-sm"
                                style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 4px)` }}
                            />
                            {/* Hover time preview tooltip */}
                            {hoverTime !== null && (
                                <div
                                    className="absolute bottom-4 transform -translate-x-1/2 pointer-events-none whitespace-nowrap z-20"
                                    style={{ left: `${hoverPosition}%` }}
                                >
                                    <div className="bg-gray-800/95 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-lg">
                                        {formatTime(hoverTime)}
                                    </div>
                                    {/* Arrow pointing down */}
                                    <div className="w-0 h-0 mx-auto border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800/95" />
                                </div>
                            )}
                            {/* Invisible range input for interaction */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={duration ? (currentTime / duration) * 100 : 0}
                                onChange={handleSeek}
                                className="absolute w-full h-3 opacity-0 cursor-pointer z-10"
                            />
                        </div>

                        {/* Time Display */}
                        <span className="text-white text-[10px] font-bold flex-shrink-0">
                            {formatTime(currentTime)}/{formatTime(duration)}
                        </span>

                        {/* Fullscreen Button */}
                        <button
                            onClick={toggleFullscreen}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors cursor-pointer focus:outline-none flex-shrink-0"
                            title="Fullscreen (F)"
                        >
                            <FaExpand className="text-white text-[10px]" />
                        </button>
                    </div>
                </div>
            )}

            {/* FULLSCREEN MODE - Full Controls Bar */}
            {isFullscreen && (
                <div
                    className={`absolute bottom-4 left-4 right-4 bg-black/80 rounded-xl p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onMouseEnter={() => setShowControls(true)}
                >
                    {/* Progress Bar - Green bar with blue head */}
                    <div
                        ref={fullscreenProgressBarRef}
                        className="w-full h-6 relative flex items-center mb-4"
                        onMouseMove={(e) => handleProgressHover(e, fullscreenProgressBarRef)}
                        onMouseLeave={handleProgressLeave}
                    >
                        {/* Background track (gray) */}
                        <div className="absolute w-full h-1.5 bg-gray-600 rounded-full" />
                        {/* Filled track (green) */}
                        <div
                            className="absolute h-1.5 bg-green-500 rounded-full"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                        {/* Blue thumb/head */}
                        <div
                            className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg"
                            style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)` }}
                        />
                        {/* Hover time preview tooltip */}
                        {hoverTime !== null && (
                            <div
                                className="absolute bottom-6 transform -translate-x-1/2 pointer-events-none whitespace-nowrap z-20"
                                style={{ left: `${hoverPosition}%` }}
                            >
                                <div className="bg-gray-800/95 text-white text-sm font-semibold px-3 py-1.5 rounded-md shadow-lg">
                                    {formatTime(hoverTime)}
                                </div>
                                {/* Arrow pointing down */}
                                <div className="w-0 h-0 mx-auto border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-800/95" />
                            </div>
                        )}
                        {/* Invisible range input for interaction */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={duration ? (currentTime / duration) * 100 : 0}
                            onChange={handleSeek}
                            className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Left - Time */}
                        <span className="text-white text-sm font-mono w-24">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>

                        {/* Center - Playback Controls */}
                        <div className="flex items-center gap-4">
                            {/* Backward 10s */}
                            <button
                                onClick={() => skip(-10)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition-colors cursor-pointer focus:outline-none"
                                title="Backward 10s (← or J)"
                            >
                                <FaBackward className="text-white text-lg" />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="w-14 h-14 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer focus:outline-none"
                                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                            >
                                {isPlaying ? (
                                    <FaPause className="text-white text-xl" />
                                ) : (
                                    <FaPlay className="text-white text-xl ml-1" />
                                )}
                            </button>

                            {/* Forward 10s */}
                            <button
                                onClick={() => skip(10)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition-colors cursor-pointer focus:outline-none"
                                title="Forward 10s (→ or L)"
                            >
                                <FaForward className="text-white text-lg" />
                            </button>
                        </div>

                        {/* Right - Volume & Fullscreen */}
                        <div className="flex items-center gap-2">
                            {/* Volume with slider */}
                            <div
                                className="flex items-center gap-2 relative"
                                onMouseEnter={() => setShowVolumeSlider(true)}
                                onMouseLeave={() => setShowVolumeSlider(false)}
                            >
                                {/* Volume Slider - Green bar with blue head */}
                                {(showVolumeSlider || volumeIndicatorVisible) && (
                                    <div className="flex items-center w-24 h-6 relative">
                                        {/* Background track (gray) */}
                                        <div className="absolute w-full h-1 bg-gray-500 rounded-full" />
                                        {/* Filled track (green) */}
                                        <div
                                            className="absolute h-1 bg-green-500 rounded-full"
                                            style={{ width: `${volumePercent}%` }}
                                        />
                                        {/* Blue thumb/head */}
                                        <div
                                            className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-md"
                                            style={{ left: `calc(${volumePercent}% - 6px)` }}
                                        />
                                        {/* Invisible range input for interaction */}
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
                                        />
                                    </div>
                                )}

                                {/* Mute Button */}
                                <button
                                    onClick={toggleMute}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer focus:outline-none"
                                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                                >
                                    {isMuted || volume === 0 ? (
                                        <FaVolumeMute className="text-white text-lg" />
                                    ) : (
                                        <FaVolumeUp className="text-white text-lg" />
                                    )}
                                </button>
                            </div>

                            {/* Exit Fullscreen Button */}
                            <button
                                onClick={toggleFullscreen}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer focus:outline-none"
                                title="Exit Fullscreen (F)"
                            >
                                <FaCompress className="text-white text-lg" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


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

            {/* ========== SIDEBAR ========== */}
            <div className="w-[300px] bg-[#1f1f1f] flex flex-col border-r border-[#3b3b3b]">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                        {activeNav === 'activity' ? 'Activity' : 'Chat'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[#3b3b3b] rounded text-gray-400">
                            <FaSearch />
                        </button>
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="p-2 hover:bg-[#3b3b3b] rounded text-gray-400"
                            title="New Chat"
                        >
                            <FaPlus />
                        </button>
                    </div>
                </div>

                {activeNav === 'activity' ? (
                    /* Activity Feed */
                    <div className="flex-1 overflow-y-auto px-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Recent Activity</p>
                        {activities.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-8">No recent activity</p>
                        ) : (
                            activities.map(activity => (
                                <div key={activity.id} className="p-3 hover:bg-[#2b2b2b] rounded-md cursor-pointer mb-1">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <FaBell className="text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-200">{activity.title}</p>
                                            <p className="text-xs text-gray-500">{activity.message}</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        {/* Tabs with badges */}
                        <div className="px-3 flex gap-1 mb-3 flex-wrap">
                            <TabButton active={sidebarTab === 'unread'} onClick={() => setSidebarTab('unread')} badge={recentChats.filter(c => c.unread_count > 0).length}>Unread</TabButton>
                            <TabButton active={sidebarTab === 'chats'} onClick={() => setSidebarTab('chats')}>Chats</TabButton>
                            <TabButton active={sidebarTab === 'channels'} onClick={() => setSidebarTab('channels')} badge={channels.reduce((sum, c) => sum + (parseInt(c.unread_count) || 0), 0)}>Channels</TabButton>
                        </div>

                        {/* Search - Click to open New Chat modal */}
                        <div className="px-3 mb-3">
                            <button
                                onClick={() => setShowUsersList(true)}
                                className="w-full flex items-center gap-2 pl-3 pr-3 py-2 bg-[#2b2b2b] border border-[#3b3b3b] rounded-md text-sm text-gray-500 hover:border-purple-500 transition-colors text-left"
                            >
                                <FaSearch className="text-sm" />
                                <span>Search people to chat...</span>
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="px-3 space-y-1 mb-3">
                            <QuickAction
                                icon={<span className="text-lg">✨</span>}
                                label="Gemini AI"
                                onClick={() => {
                                    setShowGeminiChat(true);
                                    setSelectedChat(null);
                                    setSelectedChannel(null);
                                }}
                            />
                            <QuickAction icon={<FaCompass />} label="Discover" onClick={() => navigate('/marketplace')} />
                            <QuickAction icon={<FaAt />} label="Mentions" onClick={() => setSidebarTab('mentions')} count={mentions.length} />
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto px-3">
                            {sidebarTab === 'channels' ? (
                                <>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Teams and channels</p>
                                    {teams.map(team => (
                                        <div key={team.id} className="mb-1">
                                            <div
                                                className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-[#3b3b3b] group overflow-hidden ${selectedTeam?.id === team.id ? 'bg-[#3b3b3b]' : ''}`}
                                            >
                                                <div onClick={() => selectTeam(team)} className="flex items-center gap-2 flex-1 min-w-0">
                                                    {expandedTeams[team.id] ? <FaChevronDown className="text-gray-500 text-xs flex-shrink-0" /> : <FaChevronRight className="text-gray-500 text-xs flex-shrink-0" />}
                                                    <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {team.name[0]}
                                                    </div>
                                                    <span className="text-sm text-gray-200 flex-1 truncate min-w-0">{team.name}</span>
                                                    {/* Team unread count - sum of all channel unreads */}
                                                    {selectedTeam?.id === team.id && channels.reduce((sum, c) => sum + (parseInt(c.unread_count) || 0), 0) > 0 && (
                                                        <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                            {channels.reduce((sum, c) => sum + (parseInt(c.unread_count) || 0), 0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setEditingTeamName(team.name); setShowTeamSettings(true); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#4b4b4b] rounded"
                                                    title="Team Settings"
                                                >
                                                    <FaEllipsisV className="text-xs text-gray-400" />
                                                </button>
                                            </div>
                                            {expandedTeams[team.id] && (
                                                <div className="mt-1">
                                                    {channels.filter(c => c.team_id === team.id).map(channel => (
                                                        <div
                                                            key={channel.id}
                                                            onClick={() => { selectChannel(channel); setChannelMenuOpen(null); }}
                                                            className={`flex items-center gap-2 pl-10 pr-2 py-1.5 rounded-md cursor-pointer hover:bg-[#3b3b3b] group relative ${selectedChannel?.id === channel.id ? 'bg-[#4a4a6a]' : ''}`}
                                                        >
                                                            <FaHashtag className="text-gray-500 text-xs flex-shrink-0" />
                                                            <span className="text-sm text-gray-300 flex-1 truncate min-w-0">{channel.name}</span>
                                                            {channel.unread_count > 0 && (
                                                                <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                                    {channel.unread_count}
                                                                </span>
                                                            )}
                                                            {/* 3-dot menu button */}
                                                            <button
                                                                data-channel-menu-button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChannelMenuOpen(channelMenuOpen === channel.id ? null : channel.id);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#4b4b4b] rounded"
                                                            >
                                                                <FaEllipsisV className="text-[10px] text-gray-400" />
                                                            </button>

                                                            {/* Dropdown menu */}
                                                            {channelMenuOpen === channel.id && (
                                                                <div
                                                                    data-channel-menu
                                                                    className="absolute right-0 top-full mt-1 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg shadow-xl z-50 py-1 min-w-[120px]"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingChannel(channel);
                                                                            setEditingChannelName(channel.name);
                                                                            setShowEditChannel(true);
                                                                            setChannelMenuOpen(null);
                                                                        }}
                                                                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#3b3b3b] flex items-center gap-2"
                                                                    >
                                                                        <FaEdit className="text-xs" /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDeleteChannel(channel.id);
                                                                            setChannelMenuOpen(null);
                                                                        }}
                                                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-2"
                                                                    >
                                                                        <FaTrash className="text-xs" /> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => { setSelectedTeam(team); setShowCreateChannel(true); }}
                                                        className="flex items-center gap-2 pl-10 pr-2 py-1.5 text-purple-400 hover:bg-[#3b3b3b] rounded-md w-full"
                                                    >
                                                        <FaPlus className="text-xs" />
                                                        <span className="text-xs">Add channel</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setShowCreateGroup(true)}
                                        className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-purple-400 hover:bg-[#3b3b3b] mt-2"
                                    >
                                        <FaPlus className="text-xs" />
                                        <span className="text-sm">Create new team</span>
                                    </button>
                                </>
                            ) : sidebarTab === 'unread' ? (
                                <>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Unread</p>
                                    {recentChats.filter(c => c.unread_count > 0).map(chat => (
                                        <ChatItem
                                            key={chat.other_user_id}
                                            chat={chat}
                                            selected={selectedChat?.other_user_id === chat.other_user_id}
                                            onClick={() => selectChat(chat)}
                                            currentUserId={auth.user?.id}
                                        />
                                    ))}
                                    {recentChats.filter(c => c.unread_count > 0).length === 0 && (
                                        <p className="text-center text-gray-500 text-sm py-4">You're all caught up! 🎉</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">Chats</p>
                                    {recentChats.map(chat => (
                                        <ChatItem
                                            key={chat.other_user_id}
                                            chat={chat}
                                            selected={selectedChat?.other_user_id === chat.other_user_id}
                                            onClick={() => selectChat(chat)}
                                            currentUserId={auth.user?.id}
                                        />
                                    ))}
                                    {recentChats.length === 0 && (
                                        <p className="text-center text-gray-500 text-sm py-4">No recent chats</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* WhatsApp-style Floating Action Button */}
                        <div className="p-3">
                            <button
                                onClick={() => setShowUsersList(true)}
                                className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl shadow-lg flex items-center justify-center text-white ml-auto transition-all duration-200 hover:scale-105"
                                title="New Chat"
                            >
                                <FaComments className="text-xl" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ========== NEW CHAT MODAL (All Users) ========== */}
            {showUsersList && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowUsersList(false)}>
                    <div className="bg-[#2b2b2b] rounded-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-[#3b3b3b] shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-4 border-b border-[#3b3b3b] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">New Chat</h3>
                            <button onClick={() => setShowUsersList(false)} className="p-1 hover:bg-[#3b3b3b] rounded text-gray-400">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-3 border-b border-[#3b3b3b]">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={userSearch}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="flex-1 overflow-y-auto">
                            <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-2 bg-[#1f1f1f] sticky top-0">
                                {userSearch ? `Results for "${userSearch}"` : 'All People'}
                            </p>
                            {(searchResults.length > 0 ? searchResults : allUsers).map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        startNewChat(user);
                                        setShowUsersList(false);
                                        setUserSearch('');
                                        setSearchResults([]);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#3b3b3b] cursor-pointer transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                        {user.name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{user.name}</p>
                                        <p className="text-sm text-gray-400">{user.email || user.role}</p>
                                    </div>
                                </div>
                            ))}
                            {allUsers.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No users found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== MAIN CONTENT ========== */}
            <div className="flex-1 flex flex-col bg-[#1b1b1b]">
                {/* Header */}
                <div className="h-14 border-b border-[#3b3b3b] flex items-center justify-between px-4 bg-[#1f1f1f]">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:bg-[#2b2b2b]/50 px-2 py-1 rounded transition-colors"
                        onClick={() => !showGeminiChat && setShowContactInfo(true)}
                    >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold ${showGeminiChat ? 'bg-gradient-to-br from-blue-400 to-cyan-400' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                            {getCurrentAvatar()}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">{getCurrentName()}</h3>
                            {selectedChannel && <span className="text-xs text-gray-500">{selectedChannel.description || 'Team Channel'}</span>}
                            {showGeminiChat && <span className="text-xs text-gray-500">AI Assistant powered by Gemini</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!showGeminiChat && (
                            <>
                                <HeaderButton icon={<FaVideo />} label="Meet" onClick={() => handleComingSoon('Video Meeting')} />
                                <HeaderButton icon={<FaPhone />} label="Call" onClick={() => handleComingSoon('Voice Call')} />
                                <HeaderButton icon={<FaUsers />} label={`${selectedChannel?.member_count || selectedTeam?.member_count || '0'}`} onClick={() => { }} />
                            </>
                        )}
                        <HeaderButton icon={<FaSearch />} onClick={() => setShowSearch(!showSearch)} />
                        <HeaderButton icon={<FaEllipsisV />} onClick={() => setShowHeaderMenu(!showHeaderMenu)} dataAttr="data-header-menu-button" />
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && !showGeminiChat && (
                    <div className="px-4 py-2 bg-[#2b2b2b] border-b border-[#3b3b3b]">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:outline-none focus:border-purple-500"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Header Menu Dropdown */}
                {showHeaderMenu && !showGeminiChat && (
                    <div data-header-menu className="absolute top-14 right-4 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg shadow-2xl z-50 min-w-[220px] animate-[scaleIn_0.15s_ease-out]">
                        <div className="py-1">
                            <button onClick={() => { setShowContactInfo(true); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                                <span>Contact info</span>
                            </button>
                            <button onClick={() => { toast.info('Select messages to forward or delete'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <span>Select messages</span>
                            </button>
                            <button onClick={() => { toast.info('Notifications muted'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                <span>Mute notifications</span>
                            </button>
                            <button onClick={() => { toast.info('Disappearing messages enabled'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>Disappearing messages</span>
                            </button>
                            <button onClick={() => { toast.info('Chat locked'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <span>Lock chat</span>
                            </button>
                            <div className="border-t border-[#3b3b3b] my-1"></div>
                            {selectedChat && (
                                <>
                                    <button
                                        onClick={() => {
                                            setSelectedChat(null);
                                            setMessages([]);
                                            setShowHeaderMenu(false);
                                            toast.info('Chat closed');
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        <span>Close chat</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.info('User reported');
                                            setShowHeaderMenu(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        <span>Report</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Block this user? They will not be able to message you.')) {
                                                toast.success('User blocked');
                                                setShowHeaderMenu(false);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                        <span>Block</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Clear all messages in this chat?')) {
                                                try {
                                                    await api.delete(`/api/teams/direct-messages/${selectedChat.other_user_id}/clear`);
                                                    setMessages([]);
                                                    fetchRecentChats(); // Refresh the chat list
                                                    toast.success('Chat cleared');
                                                    setShowHeaderMenu(false);
                                                } catch (err) {
                                                    toast.error('Failed to clear chat');
                                                    console.error(err);
                                                }
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span>Clear chat</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Delete this chat? This cannot be undone.')) {
                                                try {
                                                    await api.delete(`/api/teams/direct-messages/${selectedChat.other_user_id}/delete`);
                                                    fetchRecentChats(); // Refresh the chat list
                                                    toast.info('Chat deleted');
                                                    setSelectedChat(null);
                                                    setMessages([]);
                                                    setShowHeaderMenu(false);
                                                } catch (err) {
                                                    toast.error('Failed to delete chat');
                                                    console.error(err);
                                                }
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                        <span>Delete chat</span>
                                    </button>
                                </>
                            )}
                            {selectedChannel && (
                                <>
                                    <button
                                        onClick={async () => {
                                            if (confirm('Clear all messages in this channel?')) {
                                                try {
                                                    await api.delete(`/api/teams/${selectedTeam.id}/channels/${selectedChannel.id}/clear`);
                                                    setMessages([]);
                                                    toast.success('Channel cleared');
                                                    setShowHeaderMenu(false);
                                                    // No need to refresh recent chats for channels
                                                } catch (err) {
                                                    toast.error('Failed to clear channel');
                                                    console.error(err);
                                                }
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span>Clear chat</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Exit ${selectedChannel.name}? You will no longer receive messages.`)) {
                                                toast.info('Left channel');
                                                setSelectedChannel(null);
                                                setMessages([]);
                                                setShowHeaderMenu(false);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        <span>Exit channel</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

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
                                            const lastPinned = pinnedMessages[pinnedMessages.length - 1];
                                            const element = document.getElementById(`msg-${lastPinned.id}`);
                                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                    >
                                        <div className="text-xs text-gray-400">📌 Pinned</div>
                                        <div className="text-sm text-white truncate">
                                            {pinnedMessages[pinnedMessages.length - 1].content}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const lastPinned = pinnedMessages[pinnedMessages.length - 1];
                                            setPinnedMessages(prev => prev.filter(m => m.id !== lastPinned.id));
                                            toast.info('Message unpinned');
                                        }}
                                        className="text-gray-400 hover:text-white text-xl px-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}

                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#3b3b3b #1a1a1a'
                            }}
                        >
                            {/* Loading more indicator at top */}
                            {loadingMore && (
                                <div className="flex justify-center py-2">
                                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <FaComments className="text-5xl mb-4 text-gray-600" />
                                    <p>No messages yet</p>
                                    <p className="text-sm">Start the conversation!</p>
                                </div>
                            ) : (
                                (() => {
                                    // Group consecutive images/videos from same sender
                                    const filteredMessages = messages.filter(msg => !searchQuery || msg.content?.toLowerCase().includes(searchQuery.toLowerCase()));
                                    const processedMessages = [];
                                    let i = 0;

                                    while (i < filteredMessages.length) {
                                        const msg = filteredMessages[i];
                                        const isMedia = msg.file_url && (msg.file_type?.startsWith('image/') || msg.file_type?.startsWith('video/'));

                                        if (isMedia) {
                                            // Start a media group
                                            const group = [msg];
                                            let j = i + 1;

                                            // Continue grouping consecutive media from same sender
                                            while (j < filteredMessages.length) {
                                                const nextMsg = filteredMessages[j];
                                                const isNextMedia = nextMsg.file_url && (nextMsg.file_type?.startsWith('image/') || nextMsg.file_type?.startsWith('video/'));
                                                const sameSender = nextMsg.sender_id === msg.sender_id;

                                                if (isNextMedia && sameSender) {
                                                    group.push(nextMsg);
                                                    j++;
                                                } else {
                                                    break; // Stop grouping if text/PDF or different sender
                                                }
                                            }

                                            // Add as group if 2+ items, otherwise individual
                                            if (group.length > 1) {
                                                processedMessages.push({ type: 'media-group', messages: group, sender_id: msg.sender_id, sender_name: msg.sender_name, created_at: msg.created_at, id: `group-${msg.id}` });
                                                i = j;
                                            } else {
                                                processedMessages.push({ type: 'single', message: msg });
                                                i++;
                                            }
                                        } else {
                                            // Regular message (text/PDF/doc)
                                            processedMessages.push({ type: 'single', message: msg });
                                            i++;
                                        }
                                    }

                                    return processedMessages.map((item, idx) => {
                                        if (item.type === 'media-group') {
                                            // Render media group
                                            const isMe = item.sender_id === auth.user?.id;
                                            const showAvatar = idx === 0 || processedMessages[idx - 1]?.sender_id !== item.sender_id;
                                            const msgDate = item.created_at ? new Date(item.created_at) : new Date();
                                            const isToday = new Date().toDateString() === msgDate.toDateString();
                                            const timeDisplay = isToday ? format(msgDate, 'h:mm a') : format(msgDate, 'MMM d, h:mm a');

                                            return (
                                                <div key={item.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                                                    {showAvatar ? (
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${isMe ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'}`}>
                                                            {item.sender_name?.[0] || '?'}
                                                        </div>
                                                    ) : (
                                                        <div className="w-8" />
                                                    )}
                                                    <div className={`max-w-[60%] min-w-0 ${isMe ? 'items-end' : 'items-start'} relative`}>
                                                        {/* Media Grid with Container */}
                                                        <div className={`p-1 rounded-lg ${isMe ? 'bg-gradient-to-br from-blue-600/40 to-purple-600/40' : 'bg-[#1e1e2e]'} relative`}>
                                                            <div className={`grid gap-1 ${item.messages.length === 2 ? 'grid-cols-2' : item.messages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} w-full max-w-[300px]`}>
                                                                {item.messages.slice(0, 4).map((media, mediaIdx) => {
                                                                    return (
                                                                        <div
                                                                            key={media.id}
                                                                            className="relative cursor-pointer hover:opacity-90 transition-all overflow-hidden rounded-md bg-black"
                                                                            style={{ aspectRatio: '1/1' }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setImagePreview({ url: media.file_url, name: media.file_name, messageId: media.id });
                                                                            }}
                                                                        >
                                                                            {media.file_type?.startsWith('image/') ? (
                                                                                <img
                                                                                    src={media.file_url}
                                                                                    alt={media.file_name}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <>
                                                                                    <video
                                                                                        src={media.file_url}
                                                                                        className="w-full h-full object-cover"
                                                                                        preload="metadata"
                                                                                    />
                                                                                    {/* Play button overlay for videos */}
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                                                                            <div className="w-0 h-0 border-l-[12px] border-l-black border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-0.5"></div>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}

                                                                            {/* +X Overlay for 5+ items on the 4th image */}
                                                                            {mediaIdx === 3 && item.messages.length > 4 && (
                                                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-2xl font-bold">
                                                                                    +{item.messages.length - 4}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            <span className={`text-[10px] mt-1 px-1 block ${isMe ? 'text-right text-gray-300' : 'text-gray-400'}`}>{timeDisplay}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // Render single message (original logic)
                                            const msg = item.message;
                                            const isMe = msg.sender_id === auth.user?.id;
                                            const showAvatar = idx === 0 || (processedMessages[idx - 1]?.type === 'single' ? processedMessages[idx - 1].message.sender_id : processedMessages[idx - 1]?.sender_id) !== msg.sender_id;
                                            const msgDate = msg.created_at ? new Date(msg.created_at) : new Date();
                                            const isToday = new Date().toDateString() === msgDate.toDateString();
                                            const timeDisplay = isToday ? format(msgDate, 'h:mm a') : format(msgDate, 'MMM d, h:mm a');

                                            return (
                                                <div key={msg.id || idx} id={`msg-${msg.id}`} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                                                    {showAvatar ? (
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${isMe ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'}`}>
                                                            {msg.sender_name?.[0] || '?'}
                                                        </div>
                                                    ) : (
                                                        <div className="w-8" />
                                                    )}
                                                    <div className={`max-w-[60%] min-w-0 ${isMe ? 'items-end' : 'items-start'} relative`}>
                                                        {showAvatar && (
                                                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                                <span className="text-sm font-medium text-gray-300">{msg.sender_name || 'Unknown'}</span>
                                                                <span className="text-xs text-gray-500">{timeDisplay}</span>
                                                                {/* Pinned Indicator */}
                                                                {pinnedMessages.some(m => m.id === msg.id) && (
                                                                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                                                                    </svg>
                                                                )}
                                                                {/* Starred Indicator */}
                                                                {starredMessages.some(m => m.id === msg.id) && (
                                                                    <FaStar className="w-3 h-3 text-yellow-400" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="relative">
                                                            <div
                                                                className={`relative px-4 py-2 rounded-lg text-sm break-words overflow-wrap-anywhere ${isMe
                                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-none'
                                                                    : 'bg-[#2b2b2b] text-gray-200 rounded-tl-none border border-[#3b3b3b]'
                                                                    }`}
                                                                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                                            >
                                                                {/* Reply Preview */}
                                                                {(msg.reply_to || msg.parent_id) && (
                                                                    <div
                                                                        className={`mb-2 pb-2 border-l-4 pl-2 ${isMe
                                                                            ? 'border-white/30 bg-white/10'
                                                                            : 'border-green-500 bg-green-500/10'
                                                                            } rounded p-2 text-xs`}
                                                                    >
                                                                        {(() => {
                                                                            const replyId = msg.reply_to || msg.parent_id;
                                                                            const repliedMsg = messages.find(m => m.id === replyId);
                                                                            const isRepliedToMe = repliedMsg?.sender_id === auth.user?.id;
                                                                            const hasImage = repliedMsg?.file_url && (repliedMsg?.file_type?.startsWith('image/') || repliedMsg?.file_url?.startsWith('data:image/'));
                                                                            const hasVideo = repliedMsg?.file_url && repliedMsg?.file_type?.startsWith('video/');
                                                                            const hasPDF = repliedMsg?.file_url && (repliedMsg?.file_type?.includes('pdf') || repliedMsg?.file_name?.endsWith('.pdf'));
                                                                            const hasDoc = repliedMsg?.file_url && !hasImage && !hasVideo && !hasPDF && repliedMsg?.file_name;

                                                                            return (
                                                                                <>
                                                                                    <div className="font-semibold mb-0.5">
                                                                                        {!repliedMsg ? 'Message' : (isRepliedToMe ? 'You' : repliedMsg.sender_name)}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="opacity-80 line-clamp-2 flex-1">
                                                                                            {hasImage ? (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <FaImage className="text-xs" />
                                                                                                    <span>{repliedMsg.content || 'Photo'}</span>
                                                                                                </div>
                                                                                            ) : hasVideo ? (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <FaVideo className="text-xs" />
                                                                                                    <span>{repliedMsg.content || 'Video'}</span>
                                                                                                </div>
                                                                                            ) : hasPDF ? (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <FaFile className="text-xs text-red-400" />
                                                                                                    <span className="truncate">{repliedMsg.file_name}</span>
                                                                                                </div>
                                                                                            ) : hasDoc ? (
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <FaFile className="text-xs" />
                                                                                                    <span className="truncate">{repliedMsg.file_name}</span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                repliedMsg?.content || 'Message'
                                                                                            )}
                                                                                        </div>
                                                                                        {hasImage && (
                                                                                            <img
                                                                                                src={repliedMsg.file_url}
                                                                                                alt="Preview"
                                                                                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                                                            />
                                                                                        )}
                                                                                        {hasVideo && (
                                                                                            <div className="relative w-10 h-10 rounded bg-black flex-shrink-0 flex items-center justify-center">
                                                                                                <FaVideo className="text-white text-xs" />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                                {/* Image - check file_type or base64 prefix */}
                                                                {msg.file_url && (msg.file_type?.startsWith('image/') || msg.file_url?.startsWith('data:image/')) ? (
                                                                    <div className="space-y-2 relative z-10">
                                                                        <div className="relative inline-block">
                                                                            <img
                                                                                src={msg.file_url}
                                                                                alt={msg.file_name || 'Image'}
                                                                                className="w-full max-w-[300px] max-h-[250px] rounded-lg cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all object-cover"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setImagePreview({ url: msg.file_url, name: msg.file_name, messageId: msg.id });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        {msg.content && msg.content !== msg.file_name && !msg.content.startsWith('📎') && <p>{msg.content}</p>}
                                                                    </div>
                                                                ) : msg.file_url && msg.file_type?.startsWith('video/') ? (
                                                                    /* Video Display */
                                                                    <div className="space-y-2 relative z-10">
                                                                        <div
                                                                            className="relative w-full max-w-[300px] max-h-[250px] rounded-lg cursor-pointer hover:opacity-90 transition-all overflow-hidden bg-black group"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setImagePreview({ url: msg.file_url, name: msg.file_name, messageId: msg.id });
                                                                            }}
                                                                        >
                                                                            <video
                                                                                src={msg.file_url}
                                                                                className="max-w-full max-h-[250px] rounded-lg object-cover"
                                                                                preload="metadata"
                                                                            />
                                                                            {/* Play Button Overlay */}
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all">
                                                                                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                                    <div className="w-0 h-0 border-l-[20px] border-l-black border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Video Duration Badge */}
                                                                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs flex items-center gap-1">
                                                                                <FaVideo className="text-[10px]" />
                                                                                <span>Video</span>
                                                                            </div>
                                                                        </div>
                                                                        {msg.content && msg.content !== msg.file_name && !msg.content.startsWith('📎') && <p>{msg.content}</p>}
                                                                    </div>
                                                                ) : msg.file_url && (msg.file_type?.includes('pdf') || msg.file_type?.includes('document') || msg.file_url?.startsWith('data:application/pdf') || msg.file_name?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) ? (
                                                                    /* File attachment (PDF, docs, etc) */
                                                                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg min-w-[200px]">
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${msg.file_name?.endsWith('.pdf') ? 'bg-red-500/30 text-red-400' :
                                                                            msg.file_name?.match(/\.(doc|docx)$/i) ? 'bg-blue-500/30 text-blue-400' :
                                                                                msg.file_name?.match(/\.(xls|xlsx)$/i) ? 'bg-green-500/30 text-green-400' :
                                                                                    'bg-gray-500/30 text-gray-400'
                                                                            }`}>
                                                                            <FaFile className="text-lg" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm truncate">{msg.file_name || 'Document'}</p>
                                                                            <p className="text-xs opacity-60">{msg.file_size || 'File'}</p>
                                                                        </div>
                                                                        <a
                                                                            href={msg.file_url}
                                                                            download={msg.file_name}
                                                                            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                                                            title="Download"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <FaDownload />
                                                                        </a>
                                                                    </div>
                                                                ) : msg.file_url && msg.file_name ? (
                                                                    /* Any other file with file_url and file_name */
                                                                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg min-w-[200px]">
                                                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-500/30 text-gray-400">
                                                                            <FaFile className="text-lg" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm truncate">{msg.file_name}</p>
                                                                            <p className="text-xs opacity-60">{msg.file_size || 'File'}</p>
                                                                        </div>
                                                                        <a
                                                                            href={msg.file_url}
                                                                            download={msg.file_name}
                                                                            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                                                            title="Download"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <FaDownload />
                                                                        </a>
                                                                    </div>
                                                                ) : msg.content?.match(/^📷|^📎/) ? (
                                                                    /* File shared via content marker (for receiver without file_url) */
                                                                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                                                                        {msg.content.startsWith('📷') ? (
                                                                            <FaImage className="text-lg text-blue-400" />
                                                                        ) : (
                                                                            <FaPaperclip className="text-lg text-gray-400" />
                                                                        )}
                                                                        <span>{msg.content.replace(/^📷\s*|^📎\s*/, '').trim()}</span>
                                                                    </div>
                                                                ) : msg.content?.startsWith('📎 Shared file:') ? (
                                                                    /* Legacy file share format */
                                                                    <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                                                                        <FaPaperclip className="text-lg" />
                                                                        <span>{msg.content.replace('📎 Shared file:', '').trim()}</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {/* Regular text message */}
                                                                        {msg.content}
                                                                        {/* Edited indicator */}
                                                                        {msg.edited && (
                                                                            <span className="text-[10px] opacity-60 ml-2 italic">edited</span>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {/* Star/Pin Icons - at bottom right with spacing */}
                                                                <span className="inline-flex items-center gap-1 ml-2">
                                                                    {pinnedMessages.some(m => m.id === msg.id) && (
                                                                        <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                                            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                                                                        </svg>
                                                                    )}
                                                                    {starredMessages.some(m => m.id === msg.id) && (
                                                                        <FaStar className="w-3 h-3 text-yellow-400" />
                                                                    )}
                                                                </span>

                                                                {/* Tick marks for sender - inline with message */}
                                                                {isMe && (
                                                                    <span className="inline-flex items-center ml-2 text-[10px]">
                                                                        {msg.status === 'sending' ? (
                                                                            <span className="text-gray-400">⏳</span>
                                                                        ) : msg.status === 'failed' ? (
                                                                            <span className="text-red-400">✕</span>
                                                                        ) : msg.is_read || msg.status === 'seen' ? (
                                                                            <span className="text-blue-400">✓✓</span>
                                                                        ) : msg.is_delivered || msg.status === 'delivered' ? (
                                                                            <span className="text-gray-300">✓✓</span>
                                                                        ) : (
                                                                            <span className="text-gray-400">✓</span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* WhatsApp-style reaction - transparent emoji icon on hover, click to open reactions */}
                                                            <div className={`absolute ${isMe ? 'top-1 -left-10' : 'top-1 -right-10'} opacity-0 group-hover:opacity-100 transition-all duration-200 z-20`}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showReactionBar: !m.showReactionBar } : { ...m, showReactionBar: false }));
                                                                    }}
                                                                    className="text-gray-400 hover:text-gray-200 text-lg transition-all hover:scale-110 bg-[#2b2b2b]/80 border border-[#3b3b3b]/50 rounded-full p-1.5 backdrop-blur-sm shadow-lg"
                                                                    title="React to message"
                                                                >
                                                                    <FaSmile />
                                                                </button>
                                                            </div>

                                                            {/* Message Options Menu Button */}
                                                            <div className={`absolute ${isMe ? 'top-1 -left-20' : 'top-1 -right-20'} opacity-0 group-hover:opacity-100 transition-all duration-200 z-20`}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id);
                                                                    }}
                                                                    className="text-gray-400 hover:text-gray-200 text-sm transition-all hover:scale-110 bg-[#2b2b2b]/80 border border-[#3b3b3b]/50 rounded-full p-1.5 backdrop-blur-sm shadow-lg"
                                                                    title="Message options"
                                                                    data-msg-menu={msg.id}
                                                                >
                                                                    <FaEllipsisV />
                                                                </button>
                                                            </div>

                                                            {/* Message Options Dropdown Menu - Opens downward like WhatsApp */}
                                                            {messageMenuOpen === msg.id && ReactDOM.createPortal(
                                                                <div
                                                                    className="fixed bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg shadow-2xl z-[99999] min-w-[200px] animate-[scaleIn_0.15s_ease-out]"
                                                                    style={{
                                                                        top: (() => {
                                                                            const btn = document.querySelector(`[data-msg-menu="${msg.id}"]`);
                                                                            if (!btn) return '50%';
                                                                            const rect = btn.getBoundingClientRect();
                                                                            const menuHeight = 380;

                                                                            // Find chat header - the real boundary
                                                                            const header = document.querySelector('[class*="p-4 bg-[#1b1b1b]"]') ||
                                                                                document.querySelector('[class*="justify-between p-4"]');
                                                                            const minTop = header ? header.getBoundingClientRect().bottom + 10 : 130;

                                                                            // Calculate spaces
                                                                            const spaceBelow = window.innerHeight - rect.bottom;

                                                                            // Try below first (preferred)
                                                                            if (spaceBelow >= menuHeight) {
                                                                                return `${rect.bottom + 4}px`;
                                                                            }

                                                                            // Check if above would cross header
                                                                            const abovePosition = rect.top - menuHeight - 4;
                                                                            const wouldCrossHeader = abovePosition < minTop;

                                                                            // If safe to position above, do it
                                                                            if (!wouldCrossHeader) {
                                                                                return `${abovePosition}px`;
                                                                            }

                                                                            // Would cross header - CENTER IT VERTICALLY
                                                                            const centerY = (window.innerHeight / 2) - (menuHeight / 2);
                                                                            return `${Math.max(minTop, centerY)}px`;
                                                                        })(),
                                                                        [isMe ? 'right' : 'left']: (() => {
                                                                            const btn = document.querySelector(`[data-msg-menu="${msg.id}"]`);
                                                                            if (!btn) return '50%';
                                                                            const rect = btn.getBoundingClientRect();
                                                                            return isMe ? `${window.innerWidth - rect.right}px` : `${rect.left}px`;
                                                                        })(),
                                                                        maxHeight: '380px',
                                                                        overflowY: 'auto'
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="py-1">
                                                                        <button onClick={() => handleReplyToMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                            <FaReply className="text-blue-400 text-base" /> <span>Reply</span>
                                                                        </button>
                                                                        <button onClick={() => handleCopyMessage(msg.content)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                            <span>Copy</span>
                                                                        </button>
                                                                        <button onClick={() => { setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showReactionBar: !m.showReactionBar } : { ...m, showReactionBar: false })); setMessageMenuOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                            <FaSmile className="text-yellow-400 text-base" /> <span>React</span>
                                                                        </button>
                                                                        <button onClick={() => handleForwardMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                                                            <span>Forward</span>
                                                                        </button>
                                                                        <button onClick={() => handlePinMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                            <svg className={`w-4 h-4 ${pinnedMessages.some(m => m.id === msg.id) ? "text-yellow-400" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                                            <span>{pinnedMessages.some(m => m.id === msg.id) ? 'Unpin' : 'Pin'}</span>
                                                                        </button>
                                                                        <button onClick={() => handleStarMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                            <FaStar className={starredMessages.some(m => m.id === msg.id) ? "text-yellow-400" : "text-gray-400"} /> <span>{starredMessages.some(m => m.id === msg.id) ? 'Unstar' : 'Star'}</span>
                                                                        </button>
                                                                        {isMe && (
                                                                            <>
                                                                                <div className="border-t border-[#3b3b3b] my-1"></div>
                                                                                <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); setMessageMenuOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                                    <FaEdit className="text-blue-400" /> <span>Edit</span>
                                                                                </button>
                                                                                <button onClick={() => { setMessageToDelete(msg); setShowDeleteModal(true); setMessageMenuOpen(null); }} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                                    <FaTrash /> <span>Delete</span>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {!isMe && (
                                                                            <>
                                                                                <div className="border-t border-[#3b3b3b] my-1"></div>
                                                                                <button onClick={() => handleReportMessage(msg)} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#3b3b3b] flex items-center gap-3 transition-colors">
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                                    <span>Report</span>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>,
                                                                document.body
                                                            )}

                                                            {/* WhatsApp-style reaction bar - opens on click */}
                                                            {msg.showReactionBar && (
                                                                <div
                                                                    className={`absolute -top-17 ${isMe ? 'right-0' : 'left-0'} z-30 transition-all duration-200 ease-out`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    data-reaction-bar="true"
                                                                >
                                                                    <div className="flex items-center gap-1 bg-[#2b2b2b] border border-[#3b3b3b] rounded-full px-3 py-2.5 shadow-2xl animate-[scaleIn_0.15s_ease-out]">
                                                                        {/* Quick reactions */}
                                                                        {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                            <button
                                                                                key={emoji}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    addReaction(msg.id, emoji);
                                                                                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showReactionBar: false } : m));
                                                                                }}
                                                                                className="text-2xl hover:scale-125 transition-transform px-2 py-1 rounded-full hover:bg-[#3b3b3b]"
                                                                                title={`React with ${emoji}`}
                                                                            >
                                                                                {emoji}
                                                                            </button>
                                                                        ))}

                                                                        {/* Plus button to show more emojis */}
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    // Open the emoji picker and close all reaction bars
                                                                                    setMessages(prev => prev.map(m => {
                                                                                        if (m.id === msg.id) {
                                                                                            // For the clicked message: close reaction bar, open picker
                                                                                            return {
                                                                                                ...m,
                                                                                                showReactionBar: false,
                                                                                                showReactionPicker: true,
                                                                                                emojiSearchQuery: '',
                                                                                                emojiCategory: 'recently'
                                                                                            };
                                                                                        } else {
                                                                                            // For other messages: close everything
                                                                                            return {
                                                                                                ...m,
                                                                                                showReactionBar: false,
                                                                                                showReactionPicker: false
                                                                                            };
                                                                                        }
                                                                                    }));
                                                                                }}
                                                                                className="text-gray-400 hover:text-white hover:bg-[#3b3b3b] hover:scale-110 rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 border border-[#4b4b4b]"
                                                                                title="More reactions"
                                                                            >
                                                                                <FaPlus className="text-base" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Professional Emoji Picker - Rendered independently from reaction bar */}
                                                            {msg.showReactionPicker && (() => {
                                                                const emojiCategories = {
                                                                    recently: { label: 'Recently Used', icon: '🕒', emojis: recentlyUsedEmojis.length > 0 ? recentlyUsedEmojis : ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'] },
                                                                    smileys: { label: 'Smileys & Emotion', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'] },
                                                                    people: { label: 'People & Body', icon: '👋', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'] },
                                                                    animals: { label: 'Animals & Nature', icon: '🐻', emojis: ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻'] },
                                                                    food: { label: 'Food & Drink', icon: '🍕', emojis: ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯'] },
                                                                    activity: { label: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'] },
                                                                    travel: { label: 'Travel & Places', icon: '✈️', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲', '⛱', '🏖', '🏝'] },
                                                                    objects: { label: 'Objects', icon: '💡', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀'] },
                                                                    symbols: { label: 'Symbols', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', '🔠', '🔡', '🔤', '🔣', '🔢', '🔥', '💧', '🌊', '🎉', '🎊', '🎈', '🎀', '🎁', '🏆', '🏅', '🥇', '🥈', '🥉'] }
                                                                };

                                                                const currentCategory = msg.emojiCategory || 'recently';
                                                                const searchQuery = (msg.emojiSearchQuery || '').toLowerCase();

                                                                // Filter emojis based on search or category
                                                                let displayEmojis = currentCategory === 'recently'
                                                                    ? emojiCategories.smileys.emojis
                                                                    : emojiCategories[currentCategory].emojis;
                                                                if (searchQuery) {
                                                                    displayEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
                                                                }

                                                                return ReactDOM.createPortal(
                                                                    <div
                                                                        className="fixed inset-0 z-[9999] transition-opacity duration-200"
                                                                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                                                                        onMouseDown={(e) => {
                                                                            if (e.target === e.currentTarget) {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setMessages(prev => prev.map(m => ({ ...m, showReactionPicker: false })));
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out"
                                                                            style={{
                                                                                width: '420px',
                                                                                height: '480px',
                                                                                position: 'fixed',
                                                                                top: '50%',
                                                                                left: isMe ? 'calc(50% - 150px)' : 'calc(50% + 150px)',
                                                                                transform: 'translateY(-50%)',
                                                                                border: '1px solid #333'
                                                                            }}
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                            }}
                                                                        >
                                                                            {/* Search Bar */}
                                                                            <div className="p-3 border-b border-[#2a2a2a]">
                                                                                <div className="relative">
                                                                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="Search reaction"
                                                                                        value={msg.emojiSearchQuery || ''}
                                                                                        onChange={(e) => {
                                                                                            const query = e.target.value;
                                                                                            setMessages(prev => prev.map(m =>
                                                                                                m.id === msg.id ? { ...m, emojiSearchQuery: query } : m
                                                                                            ));
                                                                                        }}
                                                                                        className="w-full bg-[#252525] text-white text-sm pl-9 pr-4 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#4a4a4a] placeholder-gray-500"
                                                                                        autoFocus
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Category Icons - INCLUDING recently */}
                                                                            <div className="flex items-center gap-1 px-3 py-2 border-b border-[#2a2a2a] overflow-x-auto bg-[#1e1e1e]" style={{ scrollbarWidth: 'none' }}>
                                                                                {Object.entries(emojiCategories).map(([key, cat]) => (
                                                                                    <button
                                                                                        key={key}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setMessages(prev => prev.map(m =>
                                                                                                m.id === msg.id ? { ...m, emojiCategory: key, emojiSearchQuery: '' } : m
                                                                                            ));
                                                                                        }}
                                                                                        className={`flex-shrink-0 p-2 rounded-lg transition-all ${currentCategory === key
                                                                                            ? 'bg-[#2e2e2e] ring-1 ring-[#444]'
                                                                                            : 'hover:bg-[#2a2a2a]'
                                                                                            }`}
                                                                                        title={cat.label}
                                                                                    >
                                                                                        <span className="text-xl">{cat.icon}</span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>

                                                                            {/* Emoji Grid with Scrolling */}
                                                                            <div
                                                                                className="p-4 overflow-y-auto"
                                                                                style={{
                                                                                    height: '370px',
                                                                                    scrollbarWidth: 'thin',
                                                                                    scrollbarColor: '#3b3b3b #1a1a1a'
                                                                                }}
                                                                            >
                                                                                {/* Recent Emojis Row - Only show when recently tab is active */}
                                                                                {!searchQuery && currentCategory === 'recently' && recentlyUsedEmojis.length > 0 && (
                                                                                    <div className="mb-4">
                                                                                        <h4 className="text-xs font-semibold text-gray-400 mb-3">Recent reactions</h4>
                                                                                        <div className="flex items-center gap-2 flex-wrap mb-4">
                                                                                            {recentlyUsedEmojis.map((emoji, idx) => (
                                                                                                <button
                                                                                                    key={`recent-${emoji}-${idx}`}
                                                                                                    onMouseDown={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        addReaction(msg.id, emoji);
                                                                                                        setMessages(prev => prev.map(m => ({ ...m, showReactionPicker: false })));
                                                                                                    }}
                                                                                                    className="text-3xl hover:bg-[#2a2a2a] rounded p-1 transition-all hover:scale-125 cursor-pointer"
                                                                                                    title={emoji}
                                                                                                >
                                                                                                    {emoji}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Show ALL categories when Recently is active, or just the selected category */}
                                                                                {!searchQuery && currentCategory === 'recently' ? (
                                                                                    // Show ALL emoji categories in one scrollable list
                                                                                    Object.entries(emojiCategories)
                                                                                        .filter(([key]) => key !== 'recently')
                                                                                        .map(([key, cat]) => (
                                                                                            <div key={key} className="mb-6">
                                                                                                <h4 className="text-xs font-semibold text-gray-400 mb-3">{cat.label}</h4>
                                                                                                <div className="grid grid-cols-8 gap-1">
                                                                                                    {cat.emojis.map((emoji, idx) => (
                                                                                                        <button
                                                                                                            key={`${key}-${emoji}-${idx}`}
                                                                                                            onMouseDown={(e) => {
                                                                                                                e.preventDefault();
                                                                                                                e.stopPropagation();
                                                                                                                addReaction(msg.id, emoji);
                                                                                                                setMessages(prev => prev.map(m => ({ ...m, showReactionPicker: false })));
                                                                                                            }}
                                                                                                            className="text-3xl hover:bg-[#2a2a2a] rounded p-1 transition-all hover:scale-125 cursor-pointer"
                                                                                                            title={emoji}
                                                                                                        >
                                                                                                            {emoji}
                                                                                                        </button>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))
                                                                                ) : (
                                                                                    // Show selected category or search results
                                                                                    <>
                                                                                        {!searchQuery && (
                                                                                            <div className="mb-2">
                                                                                                <h4 className="text-xs font-semibold text-gray-400 mb-3">
                                                                                                    {emojiCategories[currentCategory].label}
                                                                                                </h4>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="grid grid-cols-8 gap-1">
                                                                                            {displayEmojis.map((emoji, idx) => (
                                                                                                <button
                                                                                                    key={`${emoji}-${idx}`}
                                                                                                    onMouseDown={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        addReaction(msg.id, emoji);
                                                                                                        setMessages(prev => prev.map(m => ({
                                                                                                            ...m,
                                                                                                            showReactionBar: false,
                                                                                                            showReactionPicker: false
                                                                                                        })));
                                                                                                    }}
                                                                                                    className="text-3xl hover:bg-[#2a2a2a] rounded p-1 transition-all hover:scale-125 cursor-pointer"
                                                                                                    title={emoji}
                                                                                                >
                                                                                                    {emoji}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>,
                                                                    document.body
                                                                );
                                                            })()}

                                                            {/* Full Emoji Picker Modal - Opens from "React" menu option */}
                                                            {msg.showFullEmojiPicker && (
                                                                <div
                                                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                                                    onClick={() => setMessages(prev => prev.map(m => ({ ...m, showFullEmojiPicker: false })))}
                                                                >
                                                                    <div
                                                                        className="bg-[#2b2b2b] border border-[#3b3b3b] rounded-xl p-4 max-w-md w-full mx-4 animate-[scaleIn_0.2s_ease-out]"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <h3 className="text-lg font-semibold text-white">Choose Reaction</h3>
                                                                            <button
                                                                                onClick={() => setMessages(prev => prev.map(m => ({ ...m, showFullEmojiPicker: false })))}
                                                                                className="text-gray-400 hover:text-white"
                                                                            >
                                                                                <FaTimes />
                                                                            </button>
                                                                        </div>
                                                                        <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                                                                            {['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '💯', '✅', '💪', '🙌', '😍', '🤔', '😊', '😎', '🤩', '😇', '🥰', '😘', '🥺', '😭', '😡', '🤬', '🙄', '😴', '🤐', '🤫', '🤭', '🤗', '🤓', '😈', '👻', '🤡', '👀', '💀', '☠️', '👽', '🤖', '💩'].map(emoji => (
                                                                                <button
                                                                                    key={emoji}
                                                                                    onClick={() => {
                                                                                        addReaction(msg.id, emoji);
                                                                                        setMessages(prev => prev.map(m => ({ ...m, showFullEmojiPicker: false })));
                                                                                    }}
                                                                                    className="text-3xl hover:bg-[#3b3b3b] p-3 rounded-lg transition-all hover:scale-125"
                                                                                >
                                                                                    {emoji}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}


                                                            {/* Display existing reactions - WhatsApp style (single container) */}
                                                            {(() => {
                                                                // Debug reactions
                                                                if (msg.reactions) {
                                                                }

                                                                // Check if reactions exist and is a valid array
                                                                const hasReactions = Array.isArray(msg.reactions) && msg.reactions.length > 0;

                                                                if (!hasReactions) return null;

                                                                const totalReactions = msg.reactions.reduce((sum, r) => sum + parseInt(r.count || 0), 0);
                                                                const firstThreeEmojis = msg.reactions.slice(0, 3).map(r => r.emoji).join('');

                                                                return (
                                                                    <div className="mt-1">
                                                                        <span
                                                                            className="inline-flex items-center gap-1.5 text-sm bg-[#3b3b3b] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#4b4b4b] transition-colors border border-[#4b4b4b]"
                                                                            onClick={() => {
                                                                                setSelectedMessageReactions(msg);
                                                                                setReactionsModalTab('all');
                                                                                setShowReactionsModal(true);
                                                                            }}
                                                                            title="Click to see who reacted"
                                                                        >
                                                                            <span>{firstThreeEmojis}</span>
                                                                            <span className="text-gray-300 font-medium text-xs">{totalReactions}</span>
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    });
                                })()
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-[#3b3b3b]">
                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <div className="mb-2 p-3 bg-[#2b2b2b] rounded-lg border border-[#3b3b3b]">
                                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                        {EMOJI_LIST.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => addEmoji(emoji)}
                                                className="text-xl hover:bg-[#3b3b3b] p-1 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reply Preview - WhatsApp Style with Advanced Effects */}
                            {replyingTo && (
                                <div className="mb-3 bg-gradient-to-r from-[#1a1a1a] to-[#252525] rounded-xl overflow-hidden flex items-stretch shadow-lg shadow-black/20 border border-[#333] animate-slideIn">
                                    {/* Animated gradient left border */}
                                    <div className="w-1.5 bg-gradient-to-b from-green-400 via-green-500 to-emerald-600 flex-shrink-0"></div>

                                    {/* Content */}
                                    <div className="flex-1 p-3 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Sender name */}
                                            <div className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-1.5">
                                                <span>{replyingTo.sender_id === auth.user?.id ? 'You' : replyingTo.sender_name}</span>
                                            </div>

                                            {/* Content preview based on type */}
                                            <div className="text-sm text-gray-400 flex items-center gap-2">
                                                {(() => {
                                                    // Check for direct file properties first (most common case)
                                                    const fileUrl = replyingTo.file_url;
                                                    const fileName = replyingTo.file_name || '';
                                                    const fileType = replyingTo.file_type || '';

                                                    // Also check attachments array
                                                    const attachments = replyingTo.attachments || [];
                                                    const hasDirectFile = fileUrl && fileType;
                                                    const hasAttachment = attachments.length > 0;

                                                    if (hasDirectFile) {
                                                        const isImage = fileType.startsWith('image/');
                                                        const isVideo = fileType.startsWith('video/');
                                                        const isPdf = fileType === 'application/pdf' || /\.pdf$/i.test(fileName);

                                                        if (isImage) {
                                                            return (
                                                                <>
                                                                    <FaImage className="text-blue-400" />
                                                                    <span className="text-gray-300">Photo</span>
                                                                </>
                                                            );
                                                        } else if (isVideo) {
                                                            return (
                                                                <>
                                                                    <FaVideo className="text-purple-400" />
                                                                    <span className="text-gray-300">Video</span>
                                                                </>
                                                            );
                                                        } else if (isPdf) {
                                                            return (
                                                                <>
                                                                    <FaFilePdf className="text-red-400" />
                                                                    <span className="truncate text-gray-300">{fileName}</span>
                                                                </>
                                                            );
                                                        } else {
                                                            return (
                                                                <>
                                                                    <FaFile className="text-gray-400" />
                                                                    <span className="truncate text-gray-300">{fileName}</span>
                                                                </>
                                                            );
                                                        }
                                                    } else if (hasAttachment) {
                                                        const attachment = attachments[0];
                                                        const attFileName = attachment.name || attachment.original_name || '';
                                                        const attFileType = attachment.type || attachment.mime_type || '';
                                                        const isImage = attFileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attFileName);
                                                        const isVideo = attFileType?.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(attFileName);
                                                        const isPdf = attFileType === 'application/pdf' || /\.pdf$/i.test(attFileName);

                                                        if (isImage) {
                                                            return (
                                                                <>
                                                                    <FaImage className="text-blue-400" />
                                                                    <span className="text-gray-300">Photo</span>
                                                                </>
                                                            );
                                                        } else if (isVideo) {
                                                            return (
                                                                <>
                                                                    <FaVideo className="text-purple-400" />
                                                                    <span className="text-gray-300">Video</span>
                                                                </>
                                                            );
                                                        } else if (isPdf) {
                                                            return (
                                                                <>
                                                                    <FaFilePdf className="text-red-400" />
                                                                    <span className="truncate text-gray-300">{attFileName}</span>
                                                                </>
                                                            );
                                                        } else {
                                                            return (
                                                                <>
                                                                    <FaFile className="text-gray-400" />
                                                                    <span className="truncate text-gray-300">{attFileName}</span>
                                                                </>
                                                            );
                                                        }
                                                    }

                                                    // Text message
                                                    return <span className="truncate text-gray-300">{replyingTo.content}</span>;
                                                })()}
                                            </div>
                                        </div>

                                        {/* Thumbnail for images/videos */}
                                        {(() => {
                                            const fileUrl = replyingTo.file_url;
                                            const fileType = replyingTo.file_type || '';
                                            const attachments = replyingTo.attachments || [];

                                            // Check direct file
                                            if (fileUrl && fileType) {
                                                const isImage = fileType.startsWith('image/');
                                                const isVideo = fileType.startsWith('video/');

                                                if (isImage) {
                                                    return (
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-[#444]">
                                                            <img
                                                                src={fileUrl}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    );
                                                } else if (isVideo) {
                                                    return (
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 relative shadow-md border border-[#444]">
                                                            <video
                                                                src={fileUrl}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                <FaPlay className="text-white text-sm" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            }

                                            // Check attachments
                                            if (attachments.length > 0) {
                                                const attachment = attachments[0];
                                                const fileName = attachment.name || attachment.original_name || '';
                                                const attFileType = attachment.type || attachment.mime_type || '';
                                                const attFileUrl = attachment.url || attachment.path;
                                                const isImage = attFileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                                const isVideo = attFileType?.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(fileName);

                                                if (isImage && attFileUrl) {
                                                    return (
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-[#444]">
                                                            <img
                                                                src={attFileUrl.startsWith('http') ? attFileUrl : `${import.meta.env.VITE_API_URL || ''}${attFileUrl}`}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    );
                                                } else if (isVideo && attFileUrl) {
                                                    return (
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 relative shadow-md border border-[#444]">
                                                            <video
                                                                src={attFileUrl.startsWith('http') ? attFileUrl : `${import.meta.env.VITE_API_URL || ''}${attFileUrl}`}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                <FaPlay className="text-white text-sm" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Close button with hover effect */}
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="px-4 text-gray-500 hover:text-white hover:bg-white/5 transition-all self-stretch flex items-center"
                                    >
                                        <FaTimes className="text-lg" />
                                    </button>
                                </div>
                            )}

                            {/* Edit Mode */}
                            {editingMessage && (
                                <div className="mb-2 p-3 bg-[#2b2b2b] rounded-lg border border-[#3b3b3b]">
                                    <div className="text-xs text-gray-400 mb-2">Editing message</div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleEditMessage()}
                                            className="flex-1 px-3 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded text-white focus:outline-none focus:border-purple-500"
                                            autoFocus
                                        />
                                        <button type="button" onClick={handleEditMessage} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white">
                                            Save
                                        </button>
                                        <button type="button" onClick={() => { setEditingMessage(null); setEditContent(''); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="relative">
                                {/* Mention Dropdown */}
                                {showMentionDropdown && allUsers.length > 0 && (
                                    <div className="absolute bottom-full left-0 w-64 bg-[#2b2b2b] border border-[#3b3b3b] rounded-lg mb-2 max-h-48 overflow-y-auto z-50">
                                        <p className="text-xs text-gray-500 px-3 py-2 border-b border-[#3b3b3b]">Mention someone</p>
                                        {allUsers.filter(u => !mentionQuery || u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5).map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => {
                                                    const mentionText = `@${user.name} `;
                                                    setNewMessage(prev => prev.replace(/@\w*$/, mentionText));
                                                    setShowMentionDropdown(false);
                                                    setMentionQuery('');
                                                }}
                                                className="p-2 hover:bg-[#3b3b3b] cursor-pointer flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
                                                    {user.name[0]}
                                                </div>
                                                <span className="text-sm text-gray-200">{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="bg-gradient-to-r from-[#1f1f1f] via-[#252525] to-[#1f1f1f] rounded-2xl border border-[#3b3b3b] focus-within:border-purple-500/50 focus-within:shadow-lg focus-within:shadow-purple-500/10 transition-all duration-300">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewMessage(val);
                                            // Check for @mention
                                            const match = val.match(/@(\w*)$/);
                                            if (match) {
                                                setShowMentionDropdown(true);
                                                setMentionQuery(match[1]);
                                            } else {
                                                setShowMentionDropdown(false);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && newMessage.trim() && !showMentionDropdown) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                            if (e.key === 'Escape') {
                                                setShowMentionDropdown(false);
                                            }
                                        }}
                                        placeholder={`Type a message... Use @ to mention`}
                                        className="w-full px-5 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none text-[15px]"
                                    />
                                    <div className="flex items-center justify-between px-3 pb-3">
                                        <div className="flex items-center gap-0.5">
                                            <InputButton icon={<FaAt />} onClick={() => { setNewMessage(prev => prev + '@'); setShowMentionDropdown(true); }} title="Mention" />
                                            <InputButton icon={<FaBold />} onClick={() => setNewMessage(prev => prev + '**text**')} title="Bold" />
                                            <InputButton icon={<FaItalic />} onClick={() => setNewMessage(prev => prev + '_text_')} title="Italic" />
                                            <InputButton icon={<FaSmile />} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji" active={showEmojiPicker} />
                                            <InputButton icon={<FaImage />} onClick={() => fileInputRef.current?.click()} title="Image" />
                                            <InputButton icon={<FaPaperclip />} onClick={() => fileInputRef.current?.click()} title="Attach" />
                                            <InputButton icon={<FaLink />} onClick={() => setNewMessage(prev => prev + '[link](url)')} title="Link" />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="p-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:shadow-none"
                                        >
                                            <FaPaperPlane className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                />
                            </form>
                        </div>
                    </>
                )
                }
            </div >


            {/* ========== CREATE GROUP MODAL ========== */}
            {
                showCreateGroup && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !creatingGroup && setShowCreateGroup(false)}>
                        <div className="bg-[#2b2b2b] rounded-xl w-full max-w-md h-[80vh] max-h-[600px] flex flex-col border border-[#3b3b3b] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                            {/* Fixed Header */}
                            <div className="flex-shrink-0 p-4 border-b border-[#3b3b3b] bg-[#2b2b2b]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">Create New Group</h3>
                                    <button
                                        onClick={() => !creatingGroup && setShowCreateGroup(false)}
                                        className="p-2 hover:bg-[#3b3b3b] rounded-lg text-gray-400 hover:text-white transition-colors"
                                        disabled={creatingGroup}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                {/* Group Name Input */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Group Name *</label>
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="e.g. Project Alpha, Marketing Team"
                                            className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:border-green-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Initial Channel Name */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">First Channel</label>
                                        <input
                                            type="text"
                                            value={newGroupInitialChannel}
                                            onChange={(e) => setNewGroupInitialChannel(e.target.value)}
                                            placeholder="e.g. General, Announcements"
                                            className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:border-green-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Selected Members - Fixed area, doesn't scroll */}
                            {newGroupMembers.length > 0 && (
                                <div className="flex-shrink-0 px-4 py-3 border-b border-[#3b3b3b] bg-[#1f1f1f]">
                                    <p className="text-xs text-gray-500 mb-2">Selected ({newGroupMembers.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {newGroupMembers.map(m => (
                                            <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-300 rounded-full text-xs">
                                                {m.name?.split(' ')[0]}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setNewGroupMembers(newGroupMembers.filter(x => x.id !== m.id)); }}
                                                    className="hover:text-white"
                                                >
                                                    <FaTimes className="text-[10px]" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Scrollable Content Area - Only users list scrolls */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                <div className="px-4 py-3 border-b border-[#3b3b3b] sticky top-0 bg-[#2b2b2b] z-10">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Search people to add..."
                                            value={userSearch}
                                            onChange={(e) => searchUsers(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Users List */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-2 bg-[#1f1f1f] sticky top-0">
                                        {userSearch ? 'Search Results' : 'All People'}
                                    </p>
                                    {(searchResults.length > 0 ? searchResults : allUsers).map(user => {
                                        const isSelected = newGroupMembers.find(m => m.id === user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setNewGroupMembers(newGroupMembers.filter(m => m.id !== user.id));
                                                    } else {
                                                        setNewGroupMembers([...newGroupMembers, user]);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-green-600/10' : 'hover:bg-[#3b3b3b]'}`}
                                            >
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-green-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                                                    {isSelected ? '✓' : user.name?.[0] || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{user.email || user.role}</p>
                                                </div>
                                                {isSelected && (
                                                    <span className="text-xs text-green-400 flex-shrink-0">Added</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {allUsers.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">No users found</p>
                                    )}
                                </div>
                            </div>

                            {/* Fixed Footer - Always visible */}
                            <div className="flex-shrink-0 p-4 border-t border-[#3b3b3b] bg-[#2b2b2b] flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-400 flex-shrink-0">
                                    {newGroupMembers.length} member{newGroupMembers.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCreateGroup(false)}
                                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                        disabled={creatingGroup}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName.trim() || creatingGroup}
                                        className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                    >
                                        {creatingGroup ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Group'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* ========== TEAM SETTINGS MODAL ========== */}
            {
                showTeamSettings && (
                    <Modal onClose={() => setShowTeamSettings(false)} title="Team Settings">
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
                                    onClick={handleUpdateTeam}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleDeleteTeam}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                            <div className="pt-4 border-t border-[#3b3b3b]">
                                <button
                                    onClick={() => { setShowTeamSettings(false); setShowAddMember(true); }}
                                    className="w-full px-4 py-2 bg-[#3b3b3b] hover:bg-[#4b4b4b] text-white rounded-lg flex items-center justify-center gap-2"
                                >
                                    <FaPlus /> Add Members
                                </button>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {/* ========== CREATE CHANNEL MODAL ========== */}
            {
                showCreateChannel && (
                    <Modal onClose={() => setShowCreateChannel(false)} title="Create New Channel">
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">Channel Name</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">#</span>
                                    <input
                                        type="text"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        placeholder="new-channel"
                                        className="flex-1 px-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateChannel}
                                disabled={!newChannelName.trim()}
                                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg"
                            >
                                Create Channel
                            </button>
                        </div>
                    </Modal>
                )
            }

            {/* ========== EDIT CHANNEL MODAL ========== */}
            {
                showEditChannel && editingChannel && (
                    <Modal onClose={() => { setShowEditChannel(false); setEditingChannel(null); setEditingChannelName(''); }} title="Edit Channel">
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
                                onClick={handleEditChannel}
                                disabled={!editingChannelName.trim()}
                                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </Modal>
                )
            }

            {/* ========== ADD MEMBER MODAL ========== */}
            {
                showAddMember && (
                    <Modal onClose={() => setShowAddMember(false)} title="Add Members">
                        <div className="py-4 max-h-[400px] overflow-y-auto">
                            {allUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => handleAddMember(user.id)}
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
                )
            }

            {/* ========== FORWARD MESSAGE MODAL ========== */}
            {
                showForwardModal && (
                    <Modal onClose={() => { setShowForwardModal(false); setSelectedForwardUsers([]); setForwardSearch(''); }} title="Forward Message">
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
                                        user.id !== auth.user?.id &&
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
                                    onClick={() => { setShowForwardModal(false); setSelectedForwardUsers([]); setForwardSearch(''); }}
                                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendForward}
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
                )
            }

            {/* ========== DELETE CONFIRMATION MODAL ========== */}
            {
                showDeleteModal && messageToDelete && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999]" onClick={() => { setShowDeleteModal(false); setMessageToDelete(null); }}>
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
                                {messageToDelete.sender_id === auth.user?.id && (
                                    <button
                                        onClick={() => handleDeleteMessage(messageToDelete.id, true)}
                                        className="w-full px-4 py-4 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-b border-[#3b3b3b] flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <FaUsers className="text-sm" />
                                        <span>Delete for everyone</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteMessage(messageToDelete.id, false)}
                                    className="w-full px-4 py-4 text-sm text-white hover:bg-white/5 transition-colors border-b border-[#3b3b3b] flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <FaUser className="text-sm" />
                                    <span>Delete for me</span>
                                </button>
                                <button
                                    onClick={() => { setShowDeleteModal(false); setMessageToDelete(null); }}
                                    className="w-full px-4 py-4 text-sm text-gray-400 hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ========== REACTIONS MODAL ========== */}
            {
                showReactionsModal && selectedMessageReactions && (() => {
                    const closeReactionsModal = () => {
                        setShowReactionsModal(false);
                        lastFetchedReactionMessageIdRef.current = null;
                    };
                    return (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeReactionsModal}>
                            <div className="bg-[#2b2b2b] rounded-xl w-full max-w-md shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                {/* Header with Tabs */}
                                <div className="border-b border-[#3b3b3b]">
                                    {/* Close button */}
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <h3 className="text-lg font-semibold text-white">Reactions</h3>
                                        <button
                                            onClick={closeReactionsModal}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            <FaTimes size={20} />
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
                                        {/* All Tab */}
                                        <button
                                            onClick={() => setReactionsModalTab('all')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${reactionsModalTab === 'all'
                                                ? 'bg-[#3b3b3b] text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                                }`}
                                        >
                                            All {selectedMessageReactions.reactions?.reduce((sum, r) => sum + parseInt(r.count || 0), 0) || 0}
                                        </button>

                                        {/* Individual Emoji Tabs */}
                                        {selectedMessageReactions.reactions?.map((reaction, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setReactionsModalTab(reaction.emoji)}
                                                className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${reactionsModalTab === reaction.emoji
                                                    ? 'bg-[#3b3b3b] text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                                    }`}
                                            >
                                                <span>{reaction.emoji}</span>
                                                <span>{reaction.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Users List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {reactionDetails.length > 0 ? (
                                        reactionDetails
                                            .filter(reaction => reactionsModalTab === 'all' || reaction.emoji === reactionsModalTab)
                                            .map((reaction, idx) => {
                                                const isOwnReaction = reaction.user_id === auth.user?.id;
                                                return (
                                                    <div key={idx} className="flex items-center gap-3 p-3 hover:bg-[#333] rounded-lg transition-colors">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                            {reaction.user_name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-medium truncate">
                                                                {reaction.user_name || 'User'}
                                                                {isOwnReaction && <span className="text-xs text-gray-400 ml-2">(You)</span>}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{reaction.user_email || ''}</p>
                                                        </div>
                                                        <div
                                                            className={`text-2xl ${isOwnReaction ? 'cursor-pointer hover:opacity-60 transition-opacity' : ''}`}
                                                            onClick={() => {
                                                                if (isOwnReaction && selectedMessageReactions?.id) {
                                                                    removeReaction(selectedMessageReactions.id, reaction.emoji);
                                                                    // Close modal if no more reactions
                                                                    if (reactionDetails.length <= 1) {
                                                                        closeReactionsModal();
                                                                    }
                                                                }
                                                            }}
                                                            title={isOwnReaction ? "Click to remove your reaction" : ""}
                                                        >
                                                            {reaction.emoji}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-center text-gray-400 py-8">
                                            <p className="text-sm">No reactions yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* ========== CONTACT INFO SIDEBAR ========== */}
            {
                showContactInfo && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowContactInfo(false)}>
                        <div
                            className="w-full max-w-md bg-[#1f1f1f] h-full overflow-y-auto animate-[slideInRight_0.3s_ease-out]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-[#1f1f1f] px-4 py-3 flex items-center gap-3 border-b border-[#3b3b3b]">
                                <button
                                    onClick={() => setShowContactInfo(false)}
                                    className="text-white hover:text-gray-300"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                                <h2 className="flex-1 text-lg font-normal text-white">Contact info</h2>
                                <button className="text-white hover:text-gray-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="overflow-y-auto">
                                {/* Profile Section */}
                                <div className="flex flex-col items-center text-center bg-[#1f1f1f] py-8 px-6">
                                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-7xl font-bold mb-4">
                                        {selectedChat ? selectedChat.other_user_name?.[0] : selectedChannel?.name?.[0]}
                                    </div>
                                    <h3 className="text-2xl font-normal text-white mb-2">
                                        {selectedChat ? selectedChat.other_user_name : selectedChannel?.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {selectedChat?.other_user_email || '+91 97777 86943'}
                                    </p>
                                </div>

                                {/* Search Button */}
                                <div className="bg-[#1f1f1f] px-6 pb-4">
                                    <button className="w-full bg-[#2b2b2b] hover:bg-[#3b3b3b] rounded-lg py-3 flex items-center justify-center gap-2 text-white transition-colors">
                                        <FaSearch className="text-gray-400" />
                                        <span>Search</span>
                                    </button>
                                </div>

                                {/* About Section */}
                                <div className="bg-[#1f1f1f] px-6 py-4 mt-2">
                                    <p className="text-gray-500 text-xs mb-2">About</p>
                                    <p className="text-white text-sm">Hey there! I am using WhatsApp.</p>
                                </div>

                                {/* Media, Links and Docs */}
                                <div className="bg-[#1f1f1f] px-6 py-4 mt-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-white">Media, links and docs</span>
                                        </div>
                                        <span className="text-gray-500 text-sm">79 &gt;</span>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-20 h-20 bg-[#2b2b2b] rounded flex items-center justify-center flex-shrink-0">
                                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Starred Messages - ONLY ONE */}
                                <div className="bg-[#1f1f1f] mt-2">
                                    <button
                                        onClick={() => {
                                            setShowStarredView(true);
                                            setShowContactInfo(false);
                                        }}
                                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors"
                                    >
                                        <FaStar className="text-gray-400" />
                                        <span className="flex-1 text-left text-white">Starred messages</span>
                                        <span className="text-gray-500 text-sm">&gt;</span>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="h-2 bg-[#0d0d0d] mt-2"></div>

                                {/* More Options */}
                                <div className="bg-[#1f1f1f]">
                                    <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <div className="flex-1 text-left">
                                            <p className="text-white">Mute notifications</p>
                                            <p className="text-xs text-gray-500">Off</p>
                                        </div>
                                    </button>
                                    <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1 text-left">
                                            <p className="text-white">Disappearing messages</p>
                                            <p className="text-xs text-gray-500">Off</p>
                                        </div>
                                    </button>
                                    <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-[#2b2b2b] transition-colors">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <div className="flex-1 text-left">
                                            <p className="text-white">Encryption</p>
                                            <p className="text-xs text-gray-500">Messages are end-to-end encrypted. Click to verify.</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="h-2 bg-[#0d0d0d] mt-2"></div>

                                {/* Danger Zone */}
                                <div className="bg-[#1f1f1f] pb-8">
                                    <button className="w-full px-6 py-4 text-left text-red-400 hover:bg-[#2b2b2b] transition-colors">
                                        Block {selectedChat?.other_user_name || 'contact'}
                                    </button>
                                    <button className="w-full px-6 py-4 text-left text-red-400 hover:bg-[#2b2b2b] transition-colors">
                                        Report contact
                                    </button>
                                    {selectedChat && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this chat? This cannot be undone.')) {
                                                    setSelectedChat(null);
                                                    setMessages([]);
                                                    setShowContactInfo(false);
                                                    toast.success('Chat deleted');
                                                }
                                            }}
                                            className="w-full px-6 py-4 text-left text-red-400 hover:bg-[#2b2b2b] transition-colors"
                                        >
                                            Delete chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ========== STARRED MESSAGES FULL VIEW ========== */}
                        {showStarredView && (
                            <div className="fixed inset-0 bg-[#1b1b1b] z-50 flex flex-col">
                                {/* Header */}
                                <div className="bg-[#2b2b2b] px-4 py-4 flex items-center gap-3 border-b border-[#3b3b3b]">
                                    <button
                                        onClick={() => setShowStarredView(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h2 className="text-lg font-semibold text-white">Starred messages</h2>
                                    <button className="ml-auto text-gray-400 hover:text-white">
                                        <FaEllipsisV />
                                    </button>
                                </div>

                                {/* Starred Messages List */}
                                <div className="flex-1 overflow-y-auto">
                                    {starredMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                            <FaStar className="text-6xl text-gray-600 mb-4" />
                                            <p className="text-gray-400 mb-2">No starred messages</p>
                                            <p className="text-sm text-gray-500">
                                                Tap and hold on any message to star it
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 p-4">
                                            {starredMessages.map((msg, idx) => {
                                                const isMe = msg.sender_id === auth.user?.id;
                                                const msgDate = msg.created_at ? new Date(msg.created_at) : new Date();
                                                const timeDisplay = format(msgDate, 'MMM d, h:mm a');

                                                return (
                                                    <div key={msg.id || idx} className="bg-[#2b2b2b] rounded-lg p-3 border border-[#3b3b3b]">
                                                        {/* Sender info */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isMe ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-orange-500 to-pink-500'
                                                                } text-white flex-shrink-0`}>
                                                                {msg.sender_name?.[0] || '?'}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-white font-medium text-sm">{msg.sender_name || 'Unknown'}</p>
                                                                <p className="text-xs text-gray-500">{timeDisplay}</p>
                                                            </div>
                                                            <FaStar className="w-4 h-4 text-yellow-400" />
                                                        </div>

                                                        {/* Message content */}
                                                        <div className="text-gray-200 text-sm pl-10">
                                                            {msg.content}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex gap-2 mt-2 pl-10">
                                                            <button
                                                                onClick={() => {
                                                                    // Unstar message
                                                                    setStarredMessages(prev => prev.filter(m => m.id !== msg.id));
                                                                    toast.info('Message unstarred');
                                                                }}
                                                                className="text-xs text-gray-400 hover:text-yellow-400"
                                                            >
                                                                Unstar
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setShowStarredView(false);
                                                                    // Scroll to message
                                                                    setTimeout(() => {
                                                                        const element = document.getElementById(`msg-${msg.id}`);
                                                                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                    }, 300);
                                                                }}
                                                                className="text-xs text-gray-400 hover:text-purple-400"
                                                            >
                                                                Jump to message
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                        }

                        {/* ========== COMING SOON MODAL ========== */}
                        {
                            showComingSoon && (
                                <Modal onClose={() => setShowComingSoon(false)} title="Coming Soon">
                                    <div className="text-center py-8">
                                        <div className="text-6xl mb-4">🚀</div>
                                        <h3 className="text-xl font-bold text-white mb-2">{comingSoonFeature}</h3>
                                        <p className="text-gray-400">This feature is coming soon!</p>
                                        <p className="text-sm text-gray-500 mt-2">We're working hard to bring you the best experience.</p>
                                        <button
                                            onClick={() => setShowComingSoon(false)}
                                            className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                                        >
                                            Got it!
                                        </button>
                                    </div>
                                </Modal>
                            )
                        }
                    </div>
                )

            }

            {/* Media Preview Modal - WhatsApp Style */}
            {
                imagePreview && (() => {
                    // Get all images AND videos from messages
                    const allMedia = messages.filter(m => m.file_url && (
                        m.file_type?.startsWith('image/') ||
                        m.file_type?.startsWith('video/') ||
                        m.file_url?.startsWith('data:image/')
                    ));

                    // Use messageId for reliable matching, fallback to URL
                    let currentIndex = -1;
                    if (imagePreview.messageId) {
                        currentIndex = allMedia.findIndex(m => m.id === imagePreview.messageId);
                    }
                    if (currentIndex === -1) {
                        currentIndex = allMedia.findIndex(m => m.file_url === imagePreview.url);
                    }

                    const currentMessage = currentIndex >= 0 ? allMedia[currentIndex] : null;

                    const goToPrevious = () => {
                        if (currentIndex > 0) {
                            const prevMsg = allMedia[currentIndex - 1];
                            setImagePreview({ url: prevMsg.file_url, name: prevMsg.file_name, messageId: prevMsg.id });
                        }
                    };

                    const goToNext = () => {
                        if (currentIndex < allMedia.length - 1) {
                            const nextMsg = allMedia[currentIndex + 1];
                            setImagePreview({ url: nextMsg.file_url, name: nextMsg.file_name, messageId: nextMsg.id });
                        }
                    };

                    return (
                        <div className="fixed inset-0 bg-black z-[99999] flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setImagePreview(null)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                    >
                                        <FaTimes className="text-white text-xl" />
                                    </button>
                                    {currentMessage && (
                                        <div>
                                            <div className="text-white font-medium">{currentMessage.sender_name}</div>
                                            <div className="text-gray-400 text-xs">{new Date(currentMessage.created_at).toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                    {/* Star */}
                                    <button
                                        onClick={() => {
                                            if (currentMessage) {
                                                if (starredMessages.some(m => m.id === currentMessage.id)) {
                                                    setStarredMessages(prev => prev.filter(m => m.id !== currentMessage.id));
                                                    toast.info('Removed from starred');
                                                } else {
                                                    setStarredMessages(prev => [...prev, currentMessage]);
                                                    toast.success('Added to starred');
                                                }
                                            }
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                        title="Star"
                                    >
                                        <FaStar className={`text-xl ${currentMessage && starredMessages.some(m => m.id === currentMessage.id) ? 'text-yellow-400' : 'text-white'}`} />
                                    </button>

                                    {/* Forward */}
                                    <button
                                        onClick={() => {
                                            if (currentMessage) {
                                                handleForwardMessage(currentMessage);
                                                setImagePreview(null);
                                            }
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                        title="Forward"
                                    >
                                        <FaShare className="text-white text-xl" />
                                    </button>

                                    {/* Reply */}
                                    <button
                                        onClick={() => {
                                            if (currentMessage) {
                                                setReplyingTo(currentMessage);
                                                setImagePreview(null);
                                            }
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                        title="Reply"
                                    >
                                        <FaReply className="text-white text-xl" />
                                    </button>

                                    {/* Download */}
                                    <a
                                        href={imagePreview.url}
                                        download={imagePreview.name || 'image'}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                        title="Download"
                                    >
                                        <FaDownload className="text-white text-xl" />
                                    </a>

                                    {/* Delete */}
                                    {currentMessage && (
                                        <button
                                            onClick={() => {
                                                setMessageToDelete(currentMessage);
                                                setShowDeleteModal(true);
                                                setImagePreview(null);
                                            }}
                                            className="p-2 hover:bg-red-500/20 rounded-full transition-colors cursor-pointer"
                                            title="Delete"
                                        >
                                            <FaTrash className="text-red-400 text-xl" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Media Area */}
                            <div className="flex-1 relative flex items-center justify-center p-4">
                                {/* Previous Button */}
                                {currentIndex > 0 && (
                                    <button
                                        onClick={goToPrevious}
                                        className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 cursor-pointer"
                                    >
                                        <FaChevronLeft className="text-white text-2xl" />
                                    </button>
                                )}

                                {/* Image or Video based on type */}
                                {(() => {
                                    const isVideo = currentMessage?.file_type?.startsWith('video/') ||
                                        imagePreview.url?.match(/\.(mp4|mov|avi|webm)$/i);

                                    if (isVideo) {
                                        return <CustomVideoPlayer url={imagePreview.url} />;
                                    }

                                    return (
                                        <img
                                            src={imagePreview.url}
                                            alt={imagePreview.name || 'Preview'}
                                            className="max-w-full max-h-full object-contain"
                                            style={{ maxHeight: 'calc(100vh - 180px)' }}
                                        />
                                    );
                                })()}

                                {/* Next Button */}
                                {currentIndex < allMedia.length - 1 && (
                                    <button
                                        onClick={goToNext}
                                        className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 cursor-pointer"
                                    >
                                        <FaChevronRight className="text-white text-2xl" />
                                    </button>
                                )}
                            </div>

                            {/* Thumbnail Carousel */}
                            {allMedia.length > 1 && (
                                <div className="bg-[#1a1a1a] px-4 py-3">
                                    <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar justify-center">
                                        {allMedia.map((msg) => {
                                            const isVideoThumb = msg.file_type?.startsWith('video/') || msg.file_url?.match(/\.(mp4|mov|avi|webm)$/i);
                                            const isSelected = msg.id === imagePreview.messageId || msg.file_url === imagePreview.url;
                                            return (
                                                <button
                                                    key={msg.id}
                                                    onClick={() => setImagePreview({ url: msg.file_url, name: msg.file_name, messageId: msg.id })}
                                                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all relative ${isSelected ? 'border-2 border-white' : 'border-2 border-transparent opacity-50 hover:opacity-100'}`}
                                                >
                                                    {isVideoThumb ? (
                                                        <>
                                                            <video
                                                                src={msg.file_url}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                                preload="metadata"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                <FaPlay className="text-white text-[8px]" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <img
                                                            src={msg.file_url}
                                                            alt={msg.file_name || 'Thumbnail'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="text-center text-gray-500 text-xs mt-1">
                                        {currentIndex + 1} / {allMedia.length}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()
            }
        </div >
    )           // ========== SUB-COMPONENTS ==========

    function NavItem({ icon, label, active, onClick, badge }) {
        return (
            <button
                onClick={onClick}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-md mb-1 transition-colors relative ${active ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:bg-[#3b3b3b] hover:text-white'
                    }`}
            >
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] mt-0.5">{label}</span>
                {badge && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {badge}
                    </span>
                )}
            </button>
        );
    }

    function TabButton({ children, active, onClick, badge }) {
        return (
            <button
                onClick={onClick}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors relative ${active ? 'bg-[#3b3b3b] text-white' : 'text-gray-400 hover:bg-[#2b2b2b] hover:text-white'
                    }`}
            >
                {children}
                {badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {badge}
                    </span>
                )}
            </button>
        );
    }

    function QuickAction({ icon, label, onClick, count }) {
        return (
            <button
                onClick={onClick}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2b2b] transition-colors"
            >
                <span className="text-purple-400">{icon}</span>
                <span className="text-sm flex-1 text-left">{label}</span>
                {count > 0 && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{count}</span>
                )}
            </button>
        );
    }

    function ChatItem({ chat, selected, onClick, currentUserId }) {
        const isMyLastMessage = chat.last_sender_id === currentUserId;

        return (
            <div
                onClick={onClick}
                className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${selected ? 'bg-[#4a4a6a]' : 'hover:bg-[#2b2b2b]'
                    }`}
            >
                <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                        {chat.other_user_name?.[0] || '?'}
                    </div>
                    {chat.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{chat.other_user_name}</p>
                    <div className="flex items-center gap-1">
                        {/* Show ticks for any message (text or file) from current user */}
                        {(chat.last_message || chat.last_message_file_type) && isMyLastMessage && (
                            <span className="text-[10px]">
                                {chat.last_message_read ? (
                                    <span className="text-blue-400">✓✓</span>
                                ) : chat.last_message_delivered ? (
                                    <span className="text-gray-300">✓✓</span>
                                ) : (
                                    <span className="text-gray-400">✓</span>
                                )}
                            </span>
                        )}
                        <p className="text-xs text-gray-500 truncate flex-1">
                            {(() => {
                                // Smart preview based on message content and file type
                                // Only show file icons if there's actually a file type AND no text content
                                // This ensures text messages after files show correctly
                                const hasText = chat.last_message && chat.last_message.trim().length > 0;
                                const hasFileType = chat.last_message_file_type;

                                // If there's text content, always show it (even if file_type exists from old message)
                                if (hasText) {
                                    return chat.last_message;
                                }

                                // No text content - check if it's a file message
                                if (hasFileType) {
                                    const isImage = chat.last_message_file_type.startsWith('image/');
                                    const isVideo = chat.last_message_file_type.startsWith('video/');
                                    const isPDF = chat.last_message_file_type.includes('pdf');
                                    const isDoc = !isImage && !isVideo && !isPDF;

                                    if (isImage) {
                                        return (
                                            <span className="flex items-center gap-1">
                                                <FaImage className="text-[10px]" />
                                                <span>Photo</span>
                                            </span>
                                        );
                                    }

                                    if (isVideo) {
                                        return (
                                            <span className="flex items-center gap-1">
                                                <FaVideo className="text-[10px]" />
                                                <span>Video</span>
                                            </span>
                                        );
                                    }

                                    if (isPDF) {
                                        return (
                                            <span className="flex items-center gap-1">
                                                <FaFile className="text-[10px] text-red-400" />
                                                <span>PDF</span>
                                            </span>
                                        );
                                    }

                                    if (isDoc) {
                                        return (
                                            <span className="flex items-center gap-1">
                                                <FaFile className="text-[10px]" />
                                                <span>Document</span>
                                            </span>
                                        );
                                    }
                                }

                                // No message at all
                                return 'No messages yet';
                            })()}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {chat.last_message && chat.last_message_at && (
                        <span className={`text-[10px] ${chat.unread_count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                            {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: false })}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    function HeaderButton({ icon, label, onClick, dataAttr }) {
        const buttonProps = {};
        if (dataAttr) {
            buttonProps[dataAttr] = '';
        }

        return (
            <button
                onClick={onClick}
                {...buttonProps}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-300 hover:bg-[#3b3b3b] rounded-md text-sm transition-colors"
            >
                {icon}
                {label && <span>{label}</span>}
            </button>
        );
    }

    function InputButton({ icon, onClick, title, active }) {
        return (
            <button
                type="button"
                onClick={onClick}
                title={title}
                className={`p-2 rounded transition-colors ${active ? 'text-purple-400 bg-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-[#3b3b3b]'}`}
            >
                {icon}
            </button>
        );
    }

}

// Modal component moved OUTSIDE TeamsPage to prevent re-renders causing focus loss
function Modal({ onClose, title, children }) {
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
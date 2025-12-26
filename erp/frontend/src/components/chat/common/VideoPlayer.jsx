// frontend/src/components/chat/VideoPlayer.jsx
import { useState, useEffect, useRef } from 'react';
import {
    FaPlay, FaPause, FaBackward, FaForward, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress
} from 'react-icons/fa';

export default function CustomVideoPlayer({ url }) {
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

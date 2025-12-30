import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { useAuth } from './AuthContext';
import { TEAMS_SOCKET_URL } from '../config/env';
import { Buffer } from 'buffer';

// Polyfill for simple-peer in Vite
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = { env: { DEBUG: undefined }, version: '' };
    window.Buffer = Buffer;
}

const CallContext = createContext();

// Sound Effects
const DIAL_TONE = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Silent check
// Actual short ring loop for incoming call
const INCOMING_RING = "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg";
const OUTGOING_RING = "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg";

export const CallProvider = ({ children }) => {
    const { auth } = useAuth();

    // Call State
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [call, setCall] = useState({}); // { isReceivingCall, from, name, signal }
    const [me, setMe] = useState('');
    const [isCalling, setIsCalling] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Multi-Peer State (Group Calls)
    const [peers, setPeers] = useState([]); // [{ peerID, peer, stream }]

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const socketRef = useRef();
    const streamRef = useRef();
    const peersRef = useRef([]); // Keep track of peers ref for callbacks

    const ringAudio = useRef(new Audio(INCOMING_RING));
    const dialAudio = useRef(new Audio(OUTGOING_RING));

    // Initialize Socket
    useEffect(() => {
        if (!auth?.token) return;

        ringAudio.current.loop = true;
        dialAudio.current.loop = true;

        socketRef.current = io(TEAMS_SOCKET_URL, {
            auth: { token: auth.token },
            transports: ['polling', 'websocket'],
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            setMe(socket.id);
        });

        socket.on('call-made', ({ from, name, signal }) => {
            setCall({ isReceivingCall: true, from, name, signal });
            ringAudio.current.play().catch(e => console.log("Audio play error", e));
        });

        socket.on('call-answered', ({ signal }) => {
            setCallAccepted(true);
            dialAudio.current.pause();
            dialAudio.current.currentTime = 0;

            if (connectionRef.current) {
                connectionRef.current.signal(signal);
            }
        });

        socket.on('ice-candidate', ({ candidate }) => {
            if (connectionRef.current) {
                connectionRef.current.signal(candidate);
            }
        });

        socket.on('end-call', () => {
            leaveCall();
        });

        return () => {
            ringAudio.current.pause();
            dialAudio.current.pause();
            socket.disconnect();
        };
    }, [auth?.token]);

    // Setup Media Stream
    const getMedia = async (video = true, audio = true) => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video, audio });
            setStream(currentStream);
            streamRef.current = currentStream;
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }
            return currentStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            if (video) { // Audio-only fallback
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    setStream(audioStream);
                    streamRef.current = audioStream;
                    if (myVideo.current) myVideo.current.srcObject = audioStream;
                    return audioStream;
                } catch (err) { console.error('Audio fallback failed', err); }
            }
        }
    };

    const answerCall = async () => {
        setCallAccepted(true);
        ringAudio.current.pause();
        ringAudio.current.currentTime = 0;

        const currentStream = await getMedia();

        const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

        peer.on('signal', (data) => {
            socketRef.current.emit('answer-call', { signal: data, to: call.from });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
            }
        });

        peer.signal(call.signal);

        connectionRef.current = peer;
    };

    const callUser = async (id, name) => {
        setIsCalling(true);
        dialAudio.current.play().catch(e => console.log("Audio play error", e));

        const currentStream = await getMedia();

        const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

        peer.on('signal', (data) => {
            socketRef.current.emit('call-user', {
                userToCall: id,
                signalData: data,
                from: auth.user.id,
                name: auth.user.name
            });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
            }
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        ringAudio.current.pause();
        ringAudio.current.currentTime = 0;
        dialAudio.current.pause();
        dialAudio.current.currentTime = 0;

        if (connectionRef.current) {
            connectionRef.current.destroy();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        setStream(null);
        setCall({});
        setCallAccepted(false);
        setIsCalling(false);
        setIsScreenSharing(false);

        // Notify other user
        if (call.from) {
            socketRef.current.emit('end-call', { to: call.from });
        }
        // Force refresh to clear simple-peer memory properly
        window.location.reload();
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    // Add User to existing call (Pseudo-Group)
    // Actually simpler: We just end current call and ask user to start a group call or channel call.
    // Implementing dynamic mesh add is complex for this step.
    // We will support "Group Call" initially from Channel Header.

    return (
        <CallContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name: me,
            setName: setMe,
            callEnded,
            me,
            callUser,
            leaveCall,
            answerCall,
            isCalling,
            toggleVideo,
            toggleAudio,
            isVideoEnabled,
            isAudioEnabled,
            // shareScreen, // kept from prev
            isScreenSharing
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);

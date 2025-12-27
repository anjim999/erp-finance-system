// src/hooks/useSocket.js - Socket.io React Hook for ERP Frontend
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Socket.io connects directly to ERP backend
const SOCKET_URL = import.meta.env.VITE_ERP_SOCKET_URL;

console.log('[ERPSocket] SOCKET_URL:', SOCKET_URL);

export function useSocket() {
    const { auth } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastNotification, setLastNotification] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        // Only connect if authenticated
        if (!auth?.token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Avoid creating multiple connections
        if (socketRef.current?.connected) {
            return;
        }

        try {
            const socket = io(SOCKET_URL, {
                auth: { token: auth.token },
                transports: ['polling', 'websocket'],  // Polling first = fewer warnings
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000,
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ Socket connected');
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setIsConnected(false);
            });

            socket.on('connect_error', (error) => {
                console.warn('Socket connection error (will retry):', error.message);
                setIsConnected(false);
            });

            socket.on('notification:new', (notification) => {
                setLastNotification(notification);
                setNotificationCount(prev => prev + 1);
            });

            socket.on('notification:count', ({ count }) => {
                setNotificationCount(count);
            });

            return () => {
                socket.disconnect();
            };
        } catch (err) {
            console.error('Socket initialization error:', err);
        }
    }, [auth?.token]);

    const subscribe = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
            return () => socketRef.current?.off(event, callback);
        }
        return () => { };
    }, []);

    const emit = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);

    const markNotificationRead = useCallback((notificationId) => {
        emit('notification:read', notificationId);
        setNotificationCount(prev => Math.max(0, prev - 1));
    }, [emit]);

    const markAllRead = useCallback(() => {
        emit('notification:read-all');
        setNotificationCount(0);
    }, [emit]);

    return {
        isConnected,
        socket: socketRef.current,
        subscribe,
        emit,
        lastNotification,
        notificationCount,
        setNotificationCount,
        markNotificationRead,
        markAllRead,
    };
}

export default useSocket;

// src/utils/socketService.js - Real-time WebSocket Service
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

let io = null;

// Store connected users: { odledo: [socket1, socket2, ...] }
const connectedUsers = new Map();

// Initialize Socket.io
export function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins to prevent CORS errors
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.userId;
            socket.companyId = decoded.companyId;
            socket.role = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.userId;

        // Add user to connected users
        if (!connectedUsers.has(userId)) {
            connectedUsers.set(userId, []);
        }
        connectedUsers.get(userId).push(socket);

        // Join company room if user belongs to a company
        if (socket.companyId) {
            socket.join(`company:${socket.companyId}`);
        } else {
            console.warn(`⚠️ User ${userId} has no companyId, cannot join company room`);
        }

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Handle disconnect
        socket.on('disconnect', () => {
            const userSockets = connectedUsers.get(userId) || [];
            const index = userSockets.indexOf(socket);
            if (index > -1) {
                userSockets.splice(index, 1);
            }
            if (userSockets.length === 0) {
                connectedUsers.delete(userId);
            }
        });

        // Handle read notification
        socket.on('notification:read', async (notificationId) => {
            // Will be handled by notification route
        });

        // Handle read all notifications
        socket.on('notification:read-all', async () => {
            // Will be handled by notification route
        });
        // Handle receive message (if client emits it directly, though usually via API)
        socket.on('chat:message', (data) => {
            // Logic to forward message if needed, but we use API for persistence
        });

        // ============================================
        // WEBRTC SIGNALING (1:1 & MESH GROUP CALLS)
        // ============================================

        socket.on("call-user", ({ userToCall, signalData, from, name }) => {
            io.to(`user:${userToCall}`).emit("call-made", {
                signal: signalData,
                from,
                name
            });
        });

        socket.on("answer-call", ({ signal, to }) => {
            io.to(`user:${to}`).emit("call-answered", {
                signal,
                from: userId
            });
        });

        socket.on("ice-candidate", ({ target, candidate }) => {
            io.to(`user:${target}`).emit("ice-candidate", {
                candidate,
                from: userId
            });
        });

        socket.on("end-call", ({ to }) => {
            if (to) {
                io.to(`user:${to}`).emit("end-call", { from: userId });
            }
        });

        // ============================================
        // GROUP CALL ROOMS
        // ============================================

        socket.on("join-call-room", (roomId) => {
            socket.join(`call:${roomId}`);
            // Notify others in room that a user connected (so they can initiate P2P)
            socket.to(`call:${roomId}`).emit("user-connected-to-call", { userId, name: socket.userName || 'User' });

            // Send back list of users in room? 
            // In Mesh, the new user waits for offers, OR initiates offers to everyone.
            // Simpler: Existing users call the new user.
        });

        socket.on("leave-call-room", (roomId) => {
            socket.leave(`call:${roomId}`);
            socket.to(`call:${roomId}`).emit("user-left-call", { userId });
        });

    });

    return io;
}

// Get Socket.io instance
export function getIO() {
    return io;
}

// Check if user is online
export function isUserOnline(userId) {
    return connectedUsers.has(userId) && connectedUsers.get(userId).length > 0;
}

// Get online users count
export function getOnlineUsersCount() {
    return connectedUsers.size;
}

// ============================================
// NOTIFICATION EMITTERS
// ============================================

// Send notification to specific user
export function sendToUser(userId, event, data) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

// Send notification to all users in a company
export function sendToCompany(companyId, event, data) {
    if (io) {
        io.to(`company:${companyId}`).emit(event, data);
    } else {
        console.error('❌ [SOCKET] sendToCompany failed - io is null');
    }
}

// Send notification to all users
export function broadcast(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

// ============================================
// SPECIFIC NOTIFICATION TYPES
// ============================================

// New notification
export function emitNewNotification(userId, notification) {
    sendToUser(userId, 'notification:new', notification);
}

// Notification count update
export function emitNotificationCount(userId, count) {
    sendToUser(userId, 'notification:count', { count });
}

// Leave request update (for HR)
export function emitLeaveRequestUpdate(companyId, leaveRequest) {
    sendToCompany(companyId, 'leave:update', leaveRequest);
}

// New employee added
export function emitNewEmployee(companyId, employee) {
    sendToCompany(companyId, 'employee:new', employee);
}

// Invoice status change
export function emitInvoiceUpdate(companyId, invoice) {
    sendToCompany(companyId, 'invoice:update', invoice);
}

// Project update
export function emitProjectUpdate(companyId, project) {
    sendToCompany(companyId, 'project:update', project);
}

// Stock alert
export function emitStockAlert(companyId, product) {
    sendToCompany(companyId, 'inventory:low-stock', product);
}

// Company approval (for platform admin)
export function emitCompanyApprovalUpdate(userId, request) {
    sendToUser(userId, 'company-request:update', request);
}

export default {
    initializeSocket,
    getIO,
    isUserOnline,
    getOnlineUsersCount,
    sendToUser,
    sendToCompany,
    broadcast,
    emitNewNotification,
    emitNotificationCount,
    emitLeaveRequestUpdate,
    emitNewEmployee,
    emitInvoiceUpdate,
    emitProjectUpdate,
    emitStockAlert,
    emitCompanyApprovalUpdate
};

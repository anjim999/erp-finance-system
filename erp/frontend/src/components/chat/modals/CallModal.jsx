import React from 'react';
import { useCall } from '../../../context/CallContext';
import {
    FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash,
    FaVideoSlash, FaDesktop, FaTimes, FaPhoneSlash
} from 'react-icons/fa';

const CallModal = () => {
    const {
        callAccepted, callEnded, stream, call, answerCall, leaveCall,
        myVideo, userVideo, toggleVideo, toggleAudio, // shareScreen,
        isVideoEnabled, isAudioEnabled, isScreenSharing, isCalling
    } = useCall();

    // Only show if there is an active call, incoming call, or we are calling
    const shouldShow = call.isReceivingCall || callAccepted || isCalling;

    if (!shouldShow || callEnded) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col p-4">

                {/* Header */}
                <div className="flex justify-between items-center mb-4 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FaVideo />
                        {callAccepted ? 'Call in Progress' : 'Calling...'}
                    </h2>
                    {call.name && <span className="text-gray-300">with {call.name}</span>}
                </div>

                {/* Main Video Area */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800">

                    {/* Remote Video (Big) */}
                    {callAccepted && (
                        <div className="flex-1 relative flex items-center justify-center bg-black">
                            <video
                                playsInline
                                ref={userVideo}
                                autoPlay
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                                {call.name || 'Remote User'}
                            </div>
                        </div>
                    )}

                    {!callAccepted && isCalling && (
                        <div className="flex-1 flex items-center justify-center flex-col text-white animate-pulse">
                            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-4xl">
                                {call.name?.[0] || <FaVideo />}
                            </div>
                            <h3 className="text-2xl font-bold">Calling...</h3>
                            <p className="text-gray-400">Waiting for response</p>
                        </div>
                    )}

                    {/* Incoming Call Overlay */}
                    {call.isReceivingCall && !callAccepted && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center shadow-2xl">
                                <h1 className="text-3xl text-white font-bold mb-2">{call.name || 'Someone'} is calling...</h1>
                                <p className="text-gray-400 mb-8">Incoming Video Call</p>
                                <div className="flex gap-8 justify-center">
                                    <button
                                        onClick={answerCall}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg group-hover:bg-green-600 transition-all animate-bounce">
                                            <FaPhone />
                                        </div>
                                        <span className="text-green-400">Answer</span>
                                    </button>
                                    <button
                                        onClick={leaveCall}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg group-hover:bg-red-600 transition-all">
                                            <FaTimes />
                                        </div>
                                        <span className="text-red-400">Decline</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Local Video (Small Overlay) */}
                    {stream && (
                        <div className={`absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl transition-all hover:scale-105 z-10 ${!callAccepted ? 'top-4 right-4 w-64 h-48' : ''}`}>
                            <video
                                playsInline
                                muted
                                ref={myVideo}
                                autoPlay
                                className="w-full h-full object-cover mirror"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-white text-xs">
                                You
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="bg-gray-900 mt-4 p-4 rounded-xl flex justify-center items-center gap-6 shadow-lg border border-gray-800">
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full transition-all ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                        title={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
                    >
                        {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                        title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                    >
                        {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                    </button>

                    {/* <button
                        onClick={shareScreen}
                        className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                        title="Share Screen"
                    >
                        <FaDesktop />
                    </button> */}

                    <button
                        onClick={leaveCall}
                        className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-110 transition-all"
                        title="End Call"
                    >
                        <FaPhoneSlash size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallModal;

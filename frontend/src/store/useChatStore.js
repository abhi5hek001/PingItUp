import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthstore";
import Peer from "simple-peer/simplepeer.min.js"; // Import simple-peer

export const useChatStore = create((set, get) => ({
    messages:[],
    users:[],
    selectedUser:null,
    isUserLoading:false,
    isMessagesLoading:false,
    
    // WebRTC State
    peer: null,
    localStream: null,
    remoteStream: null,
    isCalling: false,

    // --- Core Chat Functions ---
    getUsers:async()=>{
    set({isUserLoading:true})
    try{
        const res=await axiosInstance.get("/messages/users")
        set({users:res.data})
    }
    catch(error){
        // FIX: Suppress toast for 401/403 errors, as this is expected if a user is not logged in
        if (error.response?.status !== 401 && error.response?.status !== 403) {
            toast.error(error.response?.data?.message || "Failed to fetch users.");
        }
    }
    finally{
        set({isUserLoading:false})
    }
    },
    getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages.");
    } finally {
      set({ isMessagesLoading: false });
    }
    },
    sendMessage:async(messageData)=>{
        const {selectedUser,messages}=get()
        try{
            const res=await axiosInstance.post(`/messages/send/${selectedUser._id}`,messageData)
            set({messages:[...messages,res.data]})
        }
        catch(error){
            toast.error(error.response?.data?.message || "Failed to send message.");
        }

    },
// ... (rest of the file is unchanged)
    subscribeToMessages:()=>{
        const {selectedUser}=get()
        if (!selectedUser) return ;

        const socket=useAuthStore.getState().socket;

        socket.on('newMessage',(newMessage)=>{
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            set({messages:[...get().messages,newMessage]})
        })
        
        // --- Added WebRTC Signal Receiver ---
        socket.on("signal", get().handleSignal);
        socket.on("incomingCall", get().handleIncomingCall);
        socket.on("callEnded", get().handleCallEnded);
    },

    unsubscribeFromMessages:()=>{
        const socket=useAuthStore.getState().socket;
        socket.off('newMessage');
        // --- Clean up WebRTC listeners ---
        socket.off("signal");
        socket.off("incomingCall");
        socket.off("callEnded");
    },
    
    setSelectedUser:(selectedUser)=>set({selectedUser, isCalling: false, remoteStream: null, localStream: null, peer: null}),


    // --- WebRTC Call Logic ---

    // 1. Initiate Call
    startCall: async (receiverId) => {
        if (get().isCalling) {
            toast.error("Already in a call.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: stream, isCalling: true });

            // Create a new Peer (initiator: true)
            const peer = new Peer({
                initiator: true,
                trickle: false, // Use trickle: true for better performance, but false is simpler for testing
                stream: stream,
                config: {
                    // NOTE: You MUST replace this with your own STUN/TURN server config for production
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }
                    ]
                }
            });

            // Signaling event: send SDP offer/answer/candidates via Socket.IO
            peer.on('signal', data => {
                useAuthStore.getState().socket.emit('signal', {
                    to: receiverId,
                    signalData: data,
                });
            });

            // Stream event: remote stream received
            peer.on('stream', remoteStream => {
                set({ remoteStream });
                toast.success(`Connected to ${get().selectedUser.fullName}!`);
            });

            peer.on('close', get().endCall);
            peer.on('error', (err) => {
                console.error('Peer error', err);
                toast.error("Call failed or disconnected.");
                get().endCall();
            });

            set({ peer });

            // Notify the selected user about the incoming call
            useAuthStore.getState().socket.emit('callUser', {
                userToCall: receiverId,
                from: useAuthStore.getState().authUser._id,
                fromName: useAuthStore.getState().authUser.fullName,
            });

            toast.success(`Calling ${get().selectedUser.fullName}...`);

        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Failed to access camera/microphone. Please check permissions.");
            set({ isCalling: false });
        }
    },

    // 2. Handle Incoming Call
    handleIncomingCall: async ({ from, fromName }) => {
        if (get().isCalling) {
            useAuthStore.getState().socket.emit('rejectCall', { to: from });
            return;
        }
        
        // Check if the caller is the currently selected user
        if (get().selectedUser?._id !== from) {
            // For simplicity, we only handle calls from the currently selected chat partner
            toast(`Incoming call from ${fromName}! Open chat to accept/reject.`);
            return; 
        }

        if (window.confirm(`Incoming call from ${fromName}. Accept?`)) {
            get().answerCall(from);
        } else {
            useAuthStore.getState().socket.emit('rejectCall', { to: from });
        }
    },

    // 3. Answer Call
    answerCall: async (callerId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: stream, isCalling: true });

            // Create a new Peer (initiator: false)
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: stream,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }
                    ]
                }
            });

            // Signaling event
            peer.on('signal', data => {
                useAuthStore.getState().socket.emit('signal', {
                    to: callerId,
                    signalData: data,
                });
            });

            // Stream event: remote stream received
            peer.on('stream', remoteStream => {
                set({ remoteStream });
                toast.success("Call connected!");
            });

            peer.on('close', get().endCall);
            peer.on('error', (err) => {
                console.error('Peer error', err);
                toast.error("Call failed or disconnected.");
                get().endCall();
            });

            set({ peer });
            // The first signal (offer) is received in handleSignal, where it will be processed.

        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Failed to access camera/microphone. Check permissions.");
            get().endCall();
        }
    },

    // 4. Signal Exchange Handler
    handleSignal: ({ from, signalData }) => {
        const { peer, selectedUser, answerCall } = get();
        const socket = useAuthStore.getState().socket;

        if (from === selectedUser?._id) {
            if (!peer) {
                // If the peer is not initialized, we cannot signal.
                return;
            }
            // Signal the peer with the received data (offer or answer)
            if (peer && !peer.destroyed) {
                peer.signal(signalData);
            }
        }
    },

    // 5. End Call
    endCall: (sendSignal = true) => {
        const { peer, localStream, selectedUser } = get();
        
        if (peer && !peer.destroyed) {
            peer.destroy();
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        if (sendSignal && selectedUser) {
            useAuthStore.getState().socket.emit('endCall', { to: selectedUser._id });
        }
        
        set({ 
            peer: null, 
            localStream: null, 
            remoteStream: null, 
            isCalling: false 
        });
        toast.success("Call ended.");
    },

    // 6. Handle Remote Call End
    handleCallEnded: () => {
        // Automatically end call when remote party hangs up
        get().endCall(false); // don't send endCall signal back
        toast.info(`${get().selectedUser?.fullName} ended the call.`);
    }

}));

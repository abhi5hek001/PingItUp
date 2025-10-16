import { X, Globe } from "lucide-react"; // Added Globe icon
import { useAuthStore } from "../store/useAuthstore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-4 border-b border-base-300 bg-base-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-12 rounded-full relative ring ring-primary ring-offset-base-200 ring-offset-1">
              <img 
                src={selectedUser.profilePic || "/avatar.png"} 
                alt={selectedUser.fullName} 
                className="object-cover"
              />
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-success 
                  rounded-full ring-2 ring-base-200"
                />
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-semibold text-lg">{selectedUser.fullName}</h3>
            <div className={`text-sm flex items-center gap-1 ${isOnline ? "text-success" : "text-base-content/70"}`}>
                <Globe className="size-3"/>
                <p>{isOnline ? "Active Now" : "Offline"}</p>
            </div>
          </div>
        </div>

        {/* Close button - now a sleek button */}
        <button 
            onClick={() => setSelectedUser(null)} 
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Close Chat"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
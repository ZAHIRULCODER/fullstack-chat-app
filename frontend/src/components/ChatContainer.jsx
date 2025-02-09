import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

// Tick Icons
const GrayTick = () => (
  <svg className="size-4 text-gray-500" viewBox="0 0 24 24">
    <path
      d="M2 12l6 6L22 4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const GrayDoubleTick = () => (
  <svg className="size-4 text-gray-500" viewBox="0 0 24 24">
    <path
      d="M2 12l6 6L22 4M8 12l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const BlueDoubleTick = () => (
  <svg className="size-4 text-blue-500" viewBox="0 0 24 24">
    <path
      d="M2 12l6 6L22 4M8 12l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}>
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}

              {/* ✅ Tick Icons for Message Status */}
              <div className="flex justify-end items-center space-x-1 mt-1">
                {message.senderId === authUser._id && (
                  <>
                    {message.status === "sent" && <GrayTick />}
                    {message.status === "delivered" && <GrayDoubleTick />}
                    {message.status === "seen" && <BlueDoubleTick />}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;

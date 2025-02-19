import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  notifications: [], // Store unread messages
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // Clear notifications for this user when messages are loaded
      set((state) => ({
        notifications: state.notifications.filter(
          (n) => n.sender._id !== userId
        ),
      }));

      await axiosInstance.post(`/messages/seen/${userId}`);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // subscribeToMessages: () => {
  //   const { selectedUser } = get();
  //   const socket = useAuthStore.getState().socket;

  //   socket.on("newMessage", ({ message, sender }) => {
  //     const isCurrentChat = selectedUser && sender._id === selectedUser._id;

  //     if (isCurrentChat) {
  //       set({ messages: [...get().messages, message] });
  //     } else {
  //       set((state) => ({
  //         notifications: [
  //           ...state.notifications,
  //           { sender, message, timestamp: new Date() },
  //         ],
  //       }));
  //     }
  //   });
  // },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", ({ message, sender }) => {
      const { selectedUser, messages } = get();
      const isCurrentChat = selectedUser && sender._id === selectedUser._id;

      if (isCurrentChat) {
        set({ messages: [...messages, message] });

        // Mark as seen when chat is open
        axiosInstance.post(`/messages/seen/${sender._id}`);
      } else {
        set((state) => ({
          notifications: [...state.notifications, { sender, message }],
        }));
      }
    });

    socket.on("messageStatus", ({ senderId, status }) => {
      if (status === "seen") {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.senderId === senderId ? { ...msg, status: "seen" } : msg
          ),
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

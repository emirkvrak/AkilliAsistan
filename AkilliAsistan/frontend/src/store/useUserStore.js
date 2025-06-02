// frontend/src/store/useUserStore.js

import { create } from 'zustand';

export const useUserStore = create((set) => ({
  userEmail: "",
  isAuthenticated: false,
  aktifChatRoomId: null,
  isUploading: false, // ✅ EKLENDİ

  setUserEmail: (email) => set({ userEmail: email }),
  setIsAuthenticated: (status) => set({ isAuthenticated: status }),
  setAktifChatRoomId: (id) => set({ aktifChatRoomId: id }),
  setIsUploading: (value) => set({ isUploading: value }), // ✅ EKLENDİ
}));

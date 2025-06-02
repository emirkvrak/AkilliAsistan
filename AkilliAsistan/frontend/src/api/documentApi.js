// file: frontend/src/api/documentApi.js

import axiosInstance from './axiosInstance';
import i18n from '../locales/i18n';

export const uploadDocumentAndGetSummary = async (file, aktifChatRoomId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatroom_id', aktifChatRoomId);
    formData.append('preferred_lang', i18n.language);

    const response = await axiosInstance.post('/chat/upload-and-chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
      summary: response.data.summary, // (opsiyonel)
      filename: response.data.filename,
      original_name: response.data.original_name,
      raw_text: response.data.raw_text
    };
  } catch (error) {
    console.error("📛 uploadDocumentAndGetSummary error:", error?.response?.data || error.message);
    throw error; // 🔥 çağıran bileşen tarafından try/catch ile yakalanmalı
  }
};

export const getUserDocuments = async () => {
  const response = await axiosInstance.get("/documents/user");
  return response.data.documents;
};

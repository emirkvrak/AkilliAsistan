/* file: frontend/src/features/chat/Controls.jsx */

import { useState, useCallback } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styles from "./Controls.module.css";
import { SendIcon } from "../../components/Icons";
import { useTranslation } from "react-i18next";
import { memo } from "react";
import { toast } from "react-toastify";

const ControlsComponent = ({ onSend, isAiTyping, aktifChatRoomId, uploadedFiles }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ✅ Yalnızca raw_text içeren dosyaları geçerli say
  const validFiles = uploadedFiles.filter(file => file.raw_text && file.raw_text.trim());

  const handleContentChange = useCallback((event) => {
      setContent(event.target.value);
    }, []);

    const handleContentSend = useCallback(async () => {
    if (isSending) return;
    if (!content.trim()) return;

    if (!aktifChatRoomId && validFiles.length === 0) {
      toast.info(t("you_must_upload_document_first"));
      return;
    }

    if (!aktifChatRoomId) {
      toast.info(t("chatroom_required_before_chat"));
      return;
    }

    if (validFiles.length === 0) {
      toast.info(t("you_must_upload_document_first"));
      return;
    }

    // ✅ SADECE checkbox ile seçilen dosyaları al
    const selectedFiles = validFiles
      .filter(file => file.selected)
      .map(file => file.filename);

    if (selectedFiles.length === 0) {
      toast.info(t("please_select_documents"));
      return;
    }

    try {
      setIsSending(true);
      await onSend(content.trim(), selectedFiles); // ✅ seçilen dosyaları ilet
      setContent("");
    } catch (e) {
      console.error("Mesaj gönderim hatası:", e);
      toast.error(t("message_send_failed"));
    } finally {
      setIsSending(false);
    }
  }, [content, isSending, onSend, aktifChatRoomId, validFiles, t]);

  const handleEnterPress = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleContentSend();
    }
  }, [handleContentSend]);

  // ✅ Dinamik placeholder
  const getPlaceholder = () => {
    if (isAiTyping) return t("waiting_for_response");
    if (uploadedFiles.some(file => file.isPending)) return t("document_upload_in_progress");
    if (validFiles.length === 0) return t("please_upload_document_first");
    return t("chat_input_placeholder");
  };

  return (
    <div className={styles.Controls}>
      <div className={styles.TextAreaContainer}>
        <TextareaAutosize
          className={styles.TextArea}
          placeholder={getPlaceholder()}
          value={content}
          minRows={1}
          maxRows={4}
          onChange={handleContentChange}
          onKeyDown={handleEnterPress}
          disabled={isAiTyping || !aktifChatRoomId || validFiles.length === 0}
        />
      </div>
      <button
        className={styles.Button}
        onClick={handleContentSend}
        disabled={
          isSending ||
          !content.trim() ||
          isAiTyping ||
          !aktifChatRoomId ||
          validFiles.length === 0
        }
        aria-label={t("send")}
      >
        <SendIcon />
      </button>
    </div>
  );
};

export const Controls = memo(ControlsComponent);

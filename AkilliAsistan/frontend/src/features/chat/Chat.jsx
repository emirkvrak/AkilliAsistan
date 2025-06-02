// file: frontend/src/features/chat/Chat.jsx

import { memo, useEffect, useRef } from "react";
import styles from "./Chat.module.css";
import { useTranslation } from "react-i18next";
import ChatMessage from "./ChatMessage"; // ✅ eklendi

const ChatComponent = ({ messages, isAiTyping }) => {
  const { t } = useTranslation();
  const bottomRef = useRef(null);

  const displayedMessages =
    messages.length > 0
      ? messages
      : isAiTyping
      ? []
      : [{ role: "assistant", content: t("welcome_message_ai") }];

  function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className={styles.Chat}>
      {displayedMessages.map((message, index) => (
        <div
          key={`${message.created_at || index}-${message.role}`}
          className={styles.Message}
          data-role={message.role || message.sender}
        >
          {message.typing ? (
            <div className={styles.TypingAnimation}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          ) : (
            <>
              <ChatMessage role={message.role} content={message.content} />{" "}
              {/* ✅ eklendi */}
              {message.created_at && (
                <div className={styles.Timestamp}>
                  {formatTime(message.created_at)}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {isAiTyping && (
        <div className={styles.Message} data-role="assistant">
          <div className={styles.TypingAnimation}>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export const Chat = memo(ChatComponent);

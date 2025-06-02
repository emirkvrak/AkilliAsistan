import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatMessage.module.css";

const ChatMessage = ({ content }) => {
  return (
    <div className={styles.chatMessage}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ node, children }) {
            // Eğer paragraf yalnızca tablo içeriyorsa <p> sarmalamasını kaldır
            const hasOnlyTable = node.children.length === 1 && node.children[0].tagName === "table";
            if (hasOnlyTable) return <>{children}</>;

            return <p>{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMessage;

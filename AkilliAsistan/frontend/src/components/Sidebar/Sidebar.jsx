// file: frontend/src/components/Sidebar/Sidebar.jsx

import instance from "../../api/axiosInstance";
import { DropdownMenu } from "./DropdownMenu";
import { useState, useCallback, memo } from "react";
import styles from "./Sidebar.module.css";
import { useTranslation } from "react-i18next";
import { Button } from "../Shared/Button";
import { FolderIcon, ChatRoomIcon } from "../Icons";
import { toast } from "react-toastify";
import { useUserStore } from "../../store/useUserStore";

const SidebarComponent = ({
  chatRooms,
  toggleSidebar,
  isSidebarOpen,
  onNewChat,
  onSelectChatRoom,
  setChatRooms,
  aktifChatRoomId,
  setAktifChatRoomId,
  setMessages,
  setUploadedFiles,
  uploadedFiles,
}) => {
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");
  const { t } = useTranslation();
  const isUploading = useUserStore((state) => state.isUploading);

  const validFiles =
    uploadedFiles?.filter((file) => file.raw_text && file.raw_text.trim()) ||
    [];

  const handleNewChatButton = () => {
    if (chatRooms.length === 0 && validFiles.length === 0) {
      toast.warn(t("empty_chat_warning"));
      return;
    }

    if (validFiles.length === 0) {
      toast.info(t("you_must_upload_document_first"));
      return;
    }

    onNewChat();
  };

  const handleDeleteChatRoom = useCallback(
    async (roomId) => {
      const pendingList = JSON.parse(
        localStorage.getItem("pendingResources") || "[]"
      );
      const isUploading = useUserStore.getState().isUploading;

      const hasPendingForThisRoom = uploadedFiles.some(
        (file) => file && file.filename && pendingList.includes(file.filename)
      );
      const rightSidebarPending = document.querySelectorAll(".SpinnerText");
      const hasAnyPendingResource = uploadedFiles.some(
        (file) => file.isPending
      );

      if (
        aktifChatRoomId === roomId &&
        (hasPendingForThisRoom ||
          isUploading ||
          hasAnyPendingResource ||
          rightSidebarPending.length > 0)
      ) {
        toast.warn(t("cannot_delete_during_upload"));
        return;
      }

      try {
        const res = await instance.post("/chat/delete-room", {
          room_id: roomId,
        });

        if (res.data.success) {
          setChatRooms((prevRooms) => {
            const updatedRooms = prevRooms.filter(
              (room) => room._id !== roomId
            );

            if (aktifChatRoomId === roomId) {
              if (updatedRooms.length > 0) {
                const fallbackRoom = updatedRooms[0];
                setAktifChatRoomId(fallbackRoom._id);
                localStorage.setItem("active_chat_room_id", fallbackRoom._id);

                // Yeni aktif oda için mesajları getir
                instance
                  .get(`/chat/fetch-messages?room_id=${fallbackRoom._id}`)
                  .then((res) => {
                    if (res.data.success) {
                      setMessages(res.data.data.messages || []);
                    } else {
                      setMessages([]);
                    }
                  })
                  .catch((err) => {
                    console.error("Mesajlar alınamadı:", err);
                    setMessages([]);
                  });
              } else {
                setAktifChatRoomId(null);
                setMessages([]);
                localStorage.removeItem("active_chat_room_id");
              }

              setUploadedFiles([]);
            }

            return updatedRooms;
          });
        } else {
          toast.error(t("room_delete_failed") + ": " + res.data.message);
        }
      } catch (error) {
        toast.error(t("room_delete_error"));
      }
    },
    [
      aktifChatRoomId,
      uploadedFiles,
      setChatRooms,
      setAktifChatRoomId,
      setMessages,
      setUploadedFiles,
      t,
    ]
  );

  const handleRenameChatRoom = useCallback(
    async (roomId) => {
      if (!newRoomName.trim()) return;

      try {
        const res = await instance.post("/chat/rename-room", {
          room_id: roomId,
          new_name: newRoomName.trim(),
        });

        if (res.data.success) {
          setChatRooms((prevRooms) =>
            prevRooms.map((room) =>
              room._id === roomId
                ? { ...room, room_name: newRoomName.trim() }
                : room
            )
          );
          setEditingRoomId(null);
          setNewRoomName("");
        } else {
          toast.error(t("room_rename_failed") + ": " + res.data.message);
        }
      } catch (error) {
        toast.error(t("room_rename_error"));
      }
    },
    [newRoomName, setChatRooms, t]
  );

  function groupChatRoomsByDate(chatRooms) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    chatRooms.forEach((room) => {
      const roomDate = new Date(room.created_at || Date.now());
      const isToday = roomDate.toDateString() === today.toDateString();
      const isYesterday = roomDate.toDateString() === yesterday.toDateString();
      const diffInDays = Math.floor((today - roomDate) / (1000 * 60 * 60 * 24));

      if (isToday) groups.today.push(room);
      else if (isYesterday) groups.yesterday.push(room);
      else if (diffInDays <= 7) groups.thisWeek.push(room);
      else groups.older.push(room);
    });

    return groups;
  }

  function renderGroup(title, rooms) {
    if (rooms.length === 0) return null;

    const translatedTitle = t(title.toLowerCase().replace(/\s/g, "_"));

    return (
      <div key={title}>
        <h3 className={styles.SectionTitle}>{translatedTitle}</h3>
        {rooms.map((room) => (
          <div key={room._id} className={styles.ChatItemContainer}>
            {editingRoomId === room._id ? (
              <input
                className={styles.EditInput}
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onBlur={() => handleRenameChatRoom(room._id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleRenameChatRoom(room._id)
                }
                autoFocus
              />
            ) : (
              <div
                className={`${styles.ChatItem} ${
                  aktifChatRoomId === room._id ? styles.ActiveRoom : ""
                }`}
              >
                <div
                  className={styles.ChatItemLabel}
                  onClick={() => onSelectChatRoom(room._id)}
                >
                  {room.room_name}
                </div>
                <DropdownMenu
                  onRename={() => {
                    setEditingRoomId(room._id);
                    setNewRoomName(room.room_name);
                  }}
                  onDelete={() => handleDeleteChatRoom(room._id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const groupedRooms = groupChatRoomsByDate(chatRooms);

  return (
    <div
      className={`${styles.Sidebar} ${
        !isSidebarOpen ? styles.SidebarClosed : ""
      }`}
    >
      <div className={styles.Header}>
        <img className={styles.Logo} src="/assistant.png" alt="Logo" />
        <h2 className={styles.Title}>{t("app_title")}</h2>
        <button className={styles.ToggleButton} onClick={toggleSidebar}>
          <ChatRoomIcon size={24} fill="#e3e3e3" />
        </button>
      </div>

      {isSidebarOpen && (
        <>
          <div className={styles.ChatHistory}>
            {renderGroup("Today", groupedRooms.today)}
            {renderGroup("Yesterday", groupedRooms.yesterday)}
            {renderGroup("This Week", groupedRooms.thisWeek)}
            {renderGroup("Older", groupedRooms.older)}
          </div>

          <Button className={styles.NewChat} onClick={handleNewChatButton}>
            {t("new_chat")} <FolderIcon size={24} fill="#000000" />
          </Button>
        </>
      )}
    </div>
  );
};

export const Sidebar = memo(SidebarComponent);

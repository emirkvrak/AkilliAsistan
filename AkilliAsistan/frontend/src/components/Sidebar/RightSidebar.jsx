// file: frontend/src/components/Sidebar/RightSidebar.jsx

import instance from "../../api/axiosInstance";
import { uploadDocumentAndGetSummary } from "../../api/documentApi";
import {
  useRef,
  useState,
  useReducer,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import styles from "./RightSidebar.module.css";
import { useTranslation } from "react-i18next";
import i18n from "../../locales/i18n";

import { useUserStore } from "../../store/useUserStore";

import { toast } from "react-toastify";
import { Button } from "../Shared/Button";
import {
  CollapseIcon,
  InfoIcon,
  MoreVertIcon,
  EditIcon,
  TrashIcon,
} from "../Icons";

const initialState = {
  resources: [],
  selectedResources: [],
  menuOpenId: null,
  renamingId: null,
  newName: "",
  urlInput: "",
  isLoading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_RESOURCES":
      return { ...state, resources: action.payload };
    case "SET_SELECTED":
      return { ...state, selectedResources: action.payload };
    case "SET_MENU_OPEN":
      return { ...state, menuOpenId: action.payload };
    case "SET_RENAMING":
      return { ...state, renamingId: action.payload };
    case "SET_NEW_NAME":
      return { ...state, newName: action.payload };
    case "SET_URL_INPUT":
      return { ...state, urlInput: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "UPDATE_RESOURCE":
      return {
        ...state,
        resources: state.resources.map((r) =>
          r.filename === action.payload.filename
            ? { ...r, ...action.payload.data }
            : r
        ),
      };
    case "APPEND_RESOURCE":
      return {
        ...state,
        resources: [...state.resources, action.payload],
        selectedResources: [...state.selectedResources, action.payload],
      };
    default:
      return state;
  }
}

function RightSidebarComponent({
  isRightSidebarOpen,
  toggleRightSidebar,
  aktifChatRoomId,
  setAktifChatRoomId,
  chatRooms,
  setChatRooms,
  uploadedFiles,
  setUploadedFiles,
  onSummaryReceived,
  onAutoSummarize,
  isAiTyping,
}) {
  const { t, i18n } = useTranslation();
  const setIsUploading = useUserStore((state) => state.setIsUploading);
  const isUploading = useUserStore((state) => state.isUploading);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [hoveredResource, setHoveredResource] = useState(null);
  const tooltipRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isDuplicateUpload = (filenameOrUrl) => {
    const allPending = JSON.parse(
      localStorage.getItem("pendingResources") || "[]"
    );

    return (
      state.resources.some(
        (r) => r.filename === filenameOrUrl || r.displayName === filenameOrUrl
      ) ||
      uploadedFiles.some(
        (f) => f.filename === filenameOrUrl || f.displayName === filenameOrUrl
      ) ||
      allPending.includes(filenameOrUrl)
    );
  };

  const determineLinkType = (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes("youtube.com") || hostname.includes("youtu.be"))
        return "youtube";
      const newsSources = [
        "cnn",
        "ntv",
        "hurriyet",
        "bbc",
        "nytimes",
        "washingtonpost",
        "aljazeera",
        "reuters",
      ];
      if (newsSources.some((source) => hostname.includes(source)))
        return "news";
      return "web";
    } catch (e) {
      return "web";
    }
  };

  // *** ÖNEMLİ: Sayfa yenilendiğinde uploadedFiles boşsa pendingResources'u yükle
  useEffect(() => {
    if (
      (!uploadedFiles || uploadedFiles.length === 0) &&
      localStorage.getItem("pendingResources")
    ) {
      const pending = JSON.parse(localStorage.getItem("pendingResources"));

      if (pending.length > 0) {
        const pendingFilesAsObjects = pending.map((filename) => ({
          filename,
          displayName: filename,
          raw_text: "",
          isPending: true,
        }));

        setUploadedFiles(pendingFilesAsObjects);
      }
    }
  }, []);

  // uploadedFiles veya localStorage'daki pendingResources'u state.resources ve selectedResources'a set et
  useEffect(() => {
    const pending = JSON.parse(
      localStorage.getItem("pendingResources") || "[]"
    );

    const mergedResources = [];
    const filenamesSeen = new Set();

    (uploadedFiles || []).forEach((file) => {
      if (!file?.filename) return;
      filenamesSeen.add(file.filename);

      mergedResources.push({
        filename: file.filename,
        displayName: file.displayName || file.original_name || "Unnamed",
        raw_text: file.raw_text || "",
        isPending: !!file.isPending,
        selected: file.selected === true, // sadece doğruysa ata
      });
    });

    pending.forEach((name) => {
      if (!filenamesSeen.has(name)) {
        mergedResources.push({
          filename: name,
          displayName: name,
          raw_text: "",
          isPending: true,
        });
        filenamesSeen.add(name);
      }
    });

    dispatch({ type: "SET_RESOURCES", payload: mergedResources });
    dispatch({
      type: "SET_SELECTED",
      payload: mergedResources.filter((r) =>
        uploadedFiles.find((f) => f.filename === r.filename && f.selected)
      ),
    });
  }, [uploadedFiles, aktifChatRoomId]);

  useEffect(() => {
    const currentPending = JSON.parse(
      localStorage.getItem("pendingResources") || "[]"
    );

    const stillPending = uploadedFiles
      .filter((file) => file.isPending)
      .map((file) => file.filename);

    const updated = currentPending.filter((name) =>
      stillPending.includes(name)
    );

    localStorage.setItem("pendingResources", JSON.stringify(updated));
  }, [uploadedFiles, aktifChatRoomId]);

  const groupedResources = useMemo(() => {
    const groups = {
      pdf: [],
      docx: [],
      pptx: [],
      mp3: [],
      mp4: [],
      link: [],
      other: [],
    };
    state.resources.forEach((res) => {
      const name = res.filename || "";
      const ext = name.startsWith("http")
        ? "link"
        : name.split(".").pop()?.toLowerCase() || "other";
      if (groups[ext]) groups[ext].push(res);
      else groups.other.push(res);
    });
    return groups;
  }, [state.resources]);

  const handleFileUpload = async (event) => {
    setIsUploading(true);

    if (!event?.target?.files?.length) return;

    let chatRoomIdToUse = aktifChatRoomId;
    if (!chatRoomIdToUse) {
      try {
        const res = await instance.post("/chat/new-chat", {
          room_name: t("new_chat"),
        });

        if (res.data.success) {
          const { room_id, room_name, created_at } = res.data.data;
          chatRoomIdToUse = room_id;

          setAktifChatRoomId(room_id);
          setChatRooms((prev) => [
            { _id: room_id, room_name, created_at, uploaded_files: [] },
            ...prev,
          ]);
          localStorage.setItem("active_chat_room_id", room_id);
          toast.success(t("chat_created_successfully"));
        } else {
          toast.error(t("chat_creation_failed"));
          return;
        }
      } catch (err) {
        toast.error(t("chat_creation_failed"));
        return;
      }
    }

    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILES_PER_ROOM = 5;

    const files = Array.from(event.target.files);
    const totalAfterUpload = state.resources.length + files.length;

    if (
      state.resources.length >= MAX_FILES_PER_ROOM ||
      totalAfterUpload > MAX_FILES_PER_ROOM
    ) {
      toast.error(t("max_file_limit_reached", [MAX_FILES_PER_ROOM]));
      return;
    }

    const pendingList = JSON.parse(
      localStorage.getItem("pendingResources") || "[]"
    );

    for (const file of files) {
      const sizeMB = file.size / (1024 * 1024);

      if (sizeMB > MAX_FILE_SIZE_MB) {
        toast.error(t("file_too_large", [MAX_FILE_SIZE_MB]));
        continue;
      }

      if (isDuplicateUpload(file.name)) {
        toast.warn(t("file_already_uploaded"));
        continue;
      }

      toast.info(`${t("file_upload_in_progress")}: ${file.name}`);

      // Geçici kaynak ekle
      const tempResource = {
        filename: file.name,
        displayName: file.name,
        raw_text: "",
        isPending: true,
        selected: true,
      };

      localStorage.setItem(
        "pendingResources",
        JSON.stringify([...pendingList, file.name])
      );

      try {
        const { summary, filename, original_name, raw_text } =
          await uploadDocumentAndGetSummary(file, chatRoomIdToUse);

        if (setUploadedFiles && raw_text && raw_text.trim()) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              filename,
              original_name: original_name || filename,
              displayName: original_name || filename,
              raw_text,
              isPending: false,
              selected: true,
            },
          ]);
        }

        dispatch({
          type: "UPDATE_RESOURCE",
          payload: {
            filename: file.name,
            data: {
              filename,
              displayName: original_name || filename || "Unnamed",
              raw_text,
              isPending: false,
            },
          },
        });

        const updatedPending = pendingList.filter((name) => name !== file.name);
        localStorage.setItem(
          "pendingResources",
          JSON.stringify(updatedPending)
        );
      } catch (error) {
        toast.error(
          t("file_upload_failed") +
            ": " +
            (error.response?.data?.message || error.message)
        );
      }
    }

    setIsUploading(false);
  };

  const handleDeleteResource = useCallback(
    async (filename) => {
      if (!aktifChatRoomId || !filename) {
        toast.error(t("file_delete_missing_info"));
        return;
      }

      const isPendingInResources = state.resources.find(
        (r) => r.filename === filename
      )?.isPending;
      const isPendingInUploaded = uploadedFiles?.find(
        (f) => f.filename === filename
      )?.isPending;

      if (isPendingInResources || isPendingInUploaded) {
        toast.error(t("cannot_delete_during_upload"));
        return;
      }

      try {
        const res = await instance.post("/chat/delete-file", {
          filename,
          chatroom_id: aktifChatRoomId,
        });

        if (res.data.success) {
          dispatch({
            type: "SET_RESOURCES",
            payload: state.resources.filter((r) => r.filename !== filename),
          });
          dispatch({
            type: "SET_SELECTED",
            payload: state.selectedResources.filter(
              (r) => r.filename !== filename
            ),
          });
          dispatch({ type: "SET_MENU_OPEN", payload: null });

          // ✅ uploadedFiles listesinden de çıkar
          setUploadedFiles((prev) =>
            prev.filter((file) => file.filename !== filename)
          );

          toast.success(t("file_deleted_success"));
        } else {
          toast.error(t("file_delete_failed") + ": " + res.data.message);
        }
      } catch (error) {
        toast.error(
          t("file_delete_failed") +
            ": " +
            (error.response?.data?.message || error.message)
        );
      }
    },
    [
      aktifChatRoomId,
      state.resources,
      state.selectedResources,
      uploadedFiles,
      t,
      setUploadedFiles, // ✅ unutma
    ]
  );

  const handleCheckboxChange = useCallback(
    (resource) => {
      const isSelected = state.selectedResources.some(
        (r) => r.filename === resource.filename
      );

      const newSelectedResources = isSelected
        ? state.selectedResources.filter(
            (r) => r.filename !== resource.filename
          )
        : [...state.selectedResources, resource];

      dispatch({ type: "SET_SELECTED", payload: newSelectedResources });

      // ✅ uploadedFiles içindeki `selected` bayrağını da güncelle
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.filename === resource.filename
            ? { ...file, selected: !isSelected }
            : file
        )
      );

      // ✅ state.resources içinde de selected alanını güncelle ki render senkron olsun
      dispatch({
        type: "UPDATE_RESOURCE",
        payload: {
          filename: resource.filename,
          data: {
            selected: !isSelected,
          },
        },
      });
    },
    [state.selectedResources, setUploadedFiles]
  );

  const handleRenameResource = useCallback(
    (filename) => {
      dispatch({ type: "SET_RENAMING", payload: filename });
      const full = state.resources.find((r) => r.filename === filename);
      if (!full) return;
      const dotIndex = full.displayName.lastIndexOf(".");
      dispatch({
        type: "SET_NEW_NAME",
        payload: full.displayName.substring(0, dotIndex),
      });
      dispatch({ type: "SET_MENU_OPEN", payload: null });
    },
    [state.resources]
  );

  const handleSaveRename = useCallback(
    async (filename) => {
      const old = state.resources.find((r) => r.filename === filename);
      if (!old || !state.newName.trim()) return;

      const dotIndex = old.displayName.lastIndexOf(".");
      const ext = dotIndex !== -1 ? old.displayName.substring(dotIndex) : "";
      const newDisplayName = state.newName.trim() + ext;

      if (!aktifChatRoomId) {
        toast.error(t("file_rename_missing_info"));
        return;
      }

      try {
        const res = await instance.post("/chat/rename-file", {
          old_filename: old.filename,
          new_filename: old.filename,
          new_original_name: newDisplayName,
          chatroom_id: aktifChatRoomId,
        });

        if (res.data.success) {
          dispatch({
            type: "UPDATE_RESOURCE",
            payload: {
              filename: old.filename,
              data: {
                displayName: newDisplayName,
              },
            },
          });

          toast.success(t("file_rename_success"));
        } else {
          toast.error(t("file_rename_failed") + ": " + res.data.message);
        }
      } catch (error) {
        toast.error(t("file_rename_failed") + ": " + error.message);
      }

      dispatch({ type: "SET_RENAMING", payload: null });
    },
    [state.resources, state.newName, aktifChatRoomId, t]
  );

  const toggleMenu = useCallback(
    (filename, e) => {
      e.stopPropagation();
      dispatch({
        type: "SET_MENU_OPEN",
        payload: state.menuOpenId === filename ? null : filename,
      });
    },
    [state.menuOpenId]
  );

  const handleLinkUpload = async () => {
    setIsUploading(true);

    const url = state.urlInput.trim();
    if (!url) return toast.error(t("invalid_link_input"));

    if (isDuplicateUpload(url)) {
      toast.warn(t("file_already_uploaded"));
      return;
    }

    const pending = JSON.parse(
      localStorage.getItem("pendingResources") || "[]"
    );
    if (pending.includes(url)) {
      toast.warn(t("file_already_uploaded"));
      return;
    }

    let chatRoomIdToUse = aktifChatRoomId;

    if (!chatRoomIdToUse) {
      try {
        const res = await instance.post("/chat/new-chat", {
          room_name: t("new_chat"),
        });

        if (res.data.success) {
          const { room_id, room_name, created_at } = res.data.data;
          chatRoomIdToUse = room_id;
          setAktifChatRoomId(room_id);
          setChatRooms((prev) => [
            { _id: room_id, room_name, created_at, uploaded_files: [] },
            ...prev,
          ]);
          localStorage.setItem("active_chat_room_id", room_id);
          toast.success(t("chat_created_successfully"));
        } else {
          toast.error(t("chat_creation_failed"));
          return;
        }
      } catch (err) {
        toast.error(t("chat_creation_failed"));
        return;
      }
    }

    const type = determineLinkType(url);

    const tempResource = {
      filename: url,
      displayName: url,
      raw_text: "",
      isPending: true,
    };

    localStorage.setItem("pendingResources", JSON.stringify([...pending, url]));

    dispatch({
      type: "SET_RESOURCES",
      payload: [...state.resources, tempResource],
    });
    dispatch({
      type: "SET_SELECTED",
      payload: [...state.selectedResources, tempResource],
    });
    dispatch({ type: "SET_LOADING", payload: true });

    instance
      .post("/chat/upload-link-and-chat", {
        url,
        type,
        chatroom_id: chatRoomIdToUse,
        preferred_lang: i18n.language,
      })
      .then((res) => {
        const raw_text = res.data.raw_text?.trim() || "";

        dispatch({
          type: "UPDATE_RESOURCE",
          payload: {
            filename: url,
            data: {
              raw_text,
              isPending: false,
            },
          },
        });

        const updatedPending = pending.filter((name) => name !== url);
        localStorage.setItem(
          "pendingResources",
          JSON.stringify(updatedPending)
        );

        if (!raw_text) {
          toast.warn(t("no_content_available"));
        } else {
          toast.success(t("link_upload_success"));
        }

        if (raw_text && setUploadedFiles) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              filename: url,
              original_name: url,
              displayName: url,
              raw_text,
              isPending: false, // DÜZENLENDİ: yükleme tamamlandıysa false olmalı
            },
          ]);
        }
      })
      .catch((error) => {
        toast.error(
          t("link_upload_failed") +
            ": " +
            (error.response?.data?.message || error.message)
        );
      })
      .finally(() => {
        setIsUploading(false);
        dispatch({ type: "SET_LOADING", payload: false });
        dispatch({ type: "SET_URL_INPUT", payload: "" });
      });
  };

  return (
    <div
      className={`${styles.RightSidebar} ${
        isDragOver ? styles.RightSidebarDragOver : ""
      } ${!isRightSidebarOpen ? styles.RightSidebarClosed : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const syntheticEvent = { target: { files } };
        handleFileUpload(syntheticEvent);
      }}
    >
      {/* Drag&Drop overlay */}
      {isDragOver && (
        <div className={styles.DragOverlay}>
          <div className={styles.DragText}>📂 {t("drop_file_here")}</div>
        </div>
      )}

      <div className={styles.Header}>
        <h2 className={styles.Title}>{t("resources")}</h2>
        <button className={styles.ToggleButton} onClick={toggleRightSidebar}>
          <CollapseIcon size={24} fill="#e3e3e3" />
        </button>
      </div>

      {isRightSidebarOpen && (
        <>
          <label className={styles.UploadButton}>
            <span>{t("add_resource")}</span>
            <input
              type="file"
              multiple
              accept=".pdf,.mp4,.mp3,.docx,.pptx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className={styles.FileInput}
            />
          </label>

          <div className={styles.UploadLinkContainer}>
            <input
              type="text"
              className={styles.UploadLinkInput}
              placeholder={t("paste_link_placeholder")}
              value={state.urlInput}
              onChange={(e) =>
                dispatch({ type: "SET_URL_INPUT", payload: e.target.value })
              }
            />
            <button
              className={styles.UploadLinkButton}
              onClick={handleLinkUpload}
            >
              {state.isLoading ? "⏳" : t("upload")}
            </button>
          </div>

          {state.resources.length === 0 && (
            <div className={styles.InfoText}>
              <InfoIcon size={24} fill="#aaa" className={styles.InfoIcon} />
              <p>{t("resource_info_text")}</p>
            </div>
          )}

          {state.resources.length > 0 && (
            <div className={styles.ResourceList}>
              <div className={styles.SelectAll}>
                <input
                  type="checkbox"
                  checked={
                    state.resources.length > 0 &&
                    state.selectedResources.length === state.resources.length
                  }
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const newSelected = isChecked ? [...state.resources] : [];

                    dispatch({
                      type: "SET_SELECTED",
                      payload: newSelected,
                    });

                    // ✅ uploadedFiles içinde selected alanını güncelle
                    setUploadedFiles((prev) =>
                      prev.map((file) => ({
                        ...file,
                        selected: isChecked,
                      }))
                    );

                    // ✅ state.resources içinde selected alanı güncellenmeli
                    state.resources.forEach((resource) => {
                      dispatch({
                        type: "UPDATE_RESOURCE",
                        payload: {
                          filename: resource.filename,
                          data: {
                            selected: isChecked,
                          },
                        },
                      });
                    });
                  }}
                />

                <span>{t("select_all_resources")}</span>
              </div>

              {Object.entries(groupedResources).map(
                ([type, items]) =>
                  items.length > 0 && (
                    <div className={styles.DocumentGroup} key={type}>
                      <h5 className={styles.GroupTitle}>
                        {t(`file_group_${type}`)}
                      </h5>
                      {items.map((resource, index) => (
                        <div
                          key={`${resource.filename}_${index}`}
                          className={styles.ResourceItem}
                          onMouseEnter={() => {
                            if (!resource.isPending) {
                              setHoveredResource(resource.filename);
                            }
                          }}
                          onMouseLeave={() => setHoveredResource(null)}
                        >
                          {state.renamingId === resource.filename ? (
                            <div className={styles.RenameContainer}>
                              <input
                                type="text"
                                value={state.newName}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_NEW_NAME",
                                    payload: e.target.value,
                                  })
                                }
                                className={styles.RenameInput}
                                autoFocus
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleSaveRename(resource.filename)
                                }
                                onBlur={() =>
                                  handleSaveRename(resource.filename)
                                }
                              />
                            </div>
                          ) : (
                            <div className={styles.ResourceItemContent}>
                              <div className={styles.ResourceInfo}>
                                <input
                                  type="checkbox"
                                  checked={state.selectedResources.some(
                                    (r) => r.filename === resource.filename
                                  )}
                                  onChange={() =>
                                    handleCheckboxChange(resource)
                                  }
                                />
                                <span className={styles.ResourceName}>
                                  {resource.isPending ? (
                                    <span className={styles.SpinnerText}>
                                      ⏳ {t("uploading")}
                                    </span>
                                  ) : (
                                    resource.displayName
                                  )}
                                </span>
                              </div>
                              <div className={styles.MenuContainer}>
                                <Button
                                  className={styles.MenuButton}
                                  onClick={(e) => {
                                    if (!resource.isPending)
                                      toggleMenu(resource.filename, e);
                                  }}
                                  disabled={resource.isPending}
                                >
                                  <MoreVertIcon size={16} fill="#0d0d0d" />
                                </Button>
                                {!resource.isPending &&
                                  state.menuOpenId === resource.filename && (
                                    <div className={styles.Menu}>
                                      <Button
                                        className={styles.MenuItem}
                                        onClick={() =>
                                          handleRenameResource(
                                            resource.filename
                                          )
                                        }
                                      >
                                        <EditIcon size={16} fill="#0d0d0d" />
                                        {t("rename_resource")}
                                      </Button>
                                      <Button
                                        className={styles.MenuItem}
                                        onClick={() =>
                                          handleDeleteResource(
                                            resource.filename
                                          )
                                        }
                                        disabled={resource.isPending}
                                      >
                                        <TrashIcon size={16} fill="#0d0d0d" />
                                        {t("delete_resource")}
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}

                          {!resource.isPending &&
                            hoveredResource === resource.filename && (
                              <div
                                ref={tooltipRef}
                                className={`${styles.TooltipFixed} ${styles.Bottom}`}
                              >
                                <div className={styles.TooltipHeader}>
                                  🧾 {resource.displayName}
                                </div>
                                <div className={styles.TooltipBody}>
                                  <strong>{t("full_content")}:</strong>
                                  <div className={styles.TooltipScrollContent}>
                                    {resource.raw_text ||
                                      t("no_content_available")}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )
              )}
              <Button
                className={styles.SummarizeButton}
                disabled={isUploading || isAiTyping}
                title={t("summarize_documents_tooltip")}
                onClick={() => {
                  const validSelectedFiles = uploadedFiles
                    .filter((file) => file.selected && file.raw_text?.trim())
                    .map((file) => file.filename);

                  if (validSelectedFiles.length === 0) {
                    toast.info(t("please_select_documents"));
                    return;
                  }

                  if (!aktifChatRoomId) {
                    toast.error(t("chatroom_required_before_chat"));
                    return;
                  }

                  const prompt = t("auto_summary_prompt");
                  onAutoSummarize(prompt, validSelectedFiles); // 👈 otomatik prompt
                }}
              >
                {t("summarize_documents")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const RightSidebar = memo(RightSidebarComponent);

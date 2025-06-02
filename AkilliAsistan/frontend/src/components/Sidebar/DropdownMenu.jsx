import { useState, useRef, useEffect, memo } from "react";
import styles from "./DropdownMenu.module.css";
import { useTranslation } from "react-i18next";
import { MoreVertIcon, EditIcon, TrashIcon } from "../Icons";
import { Button } from "../Shared/Button";

const DropdownMenuComponent = ({ onRename, onDelete }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const { t } = useTranslation();

  const toggleMenu = () => setOpen(!open);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Eğer ref tanımlıysa ve dışarı tıklanmışsa menüyü kapat
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    // capture fazında daha erken yakalanır, çakışmalar engellenir
    document.addEventListener("pointerdown", handleClickOutside, true);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
    };
  }, []);

  return (
    <div className={styles.DropdownContainer} ref={menuRef}>
      <Button className={styles.MenuButton} onClick={toggleMenu}>
        <MoreVertIcon size={16} fill="#0d0d0d" />
      </Button>
      {open && (
        <div className={styles.Menu}>
          <div className={styles.MenuItem} onClick={onRename}>
            <EditIcon size={16} fill="#0d0d0d" />
            {t("rename_resource")}
          </div>
          <div className={styles.MenuItem} onClick={onDelete}>
            <TrashIcon size={16} fill="#0d0d0d" />
            {t("delete_resource")}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownMenu = memo(DropdownMenuComponent);

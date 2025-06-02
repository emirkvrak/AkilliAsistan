import styles from "./shared.module.css";
import { memo } from "react";

const ButtonComponent = ({
  children,
  onClick,
  type = "button",
  className = "",
  loading = false,
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${styles.button} ${className}`}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
};

export const Button = memo(ButtonComponent);

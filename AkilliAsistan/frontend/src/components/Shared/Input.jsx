import styles from "./shared.module.css";
import { memo } from "react";

const InputComponent = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  className = "",
  required = false,
  ...rest
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      onChange={onChange}
      className={`${styles.input} ${className}`}
      required={required}
      {...rest}
    />
  );
};

export const Input = memo(InputComponent);

export function MinimizeIcon({ size = 24, fill = "#e3e3e3", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      viewBox="0 -960 960 960"
      fill={fill}
      {...props}
    >
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520...Zm80-80h400v320H280Z" />
    </svg>
  );
}

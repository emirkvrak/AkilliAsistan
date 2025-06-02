export function TrashAltIcon({ size = 24, fill = "#e3e3e3", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      viewBox="0 -960 960 960"
      fill={fill}
      {...props}
    >
      <path d="M760-120H200q-33 0-56.5-23.5T120-200v-560...v560h280Z" />
    </svg>
  );
}

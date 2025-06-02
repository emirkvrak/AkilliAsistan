export function CheckIcon({ size = 24, fill = "#e3e3e3", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      viewBox="0 -960 960 960"
      fill={fill}
      {...props}
    >
      <path d="M200-200h57l391-391-57-57-391 391v57Z...Zm-141 85-28-29 57 57-29-28Z" />
    </svg>
  );
}

// src/components/Icons/EditIcon.jsx
export function EditIcon({ size = 24, fill = "#0d0d0d", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={`${size}px`}
      width={`${size}px`}
      viewBox="0 -960 960 960"
      fill={fill}
      {...props}
    >
      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 31q0 16-5.5 30.5T817-728L290-200H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
    </svg>
  );
}

// components/ui/folder-icon.tsx
export function FolderIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Peeking document — sits behind everything */}
      <path
        d="M28 42 L28 20 C28 18 30 16 32 16 L74 16 L82 24 L82 42 Z"
        fill="#fff0f3"
        stroke="#f5b8c8"
        strokeWidth="1"
      />
      {/* Folded corner on doc */}
      <path
        d="M74 16 L74 24 L82 24"
        fill="none"
        stroke="#f5b8c8"
        strokeWidth="1"
      />

      {/* Back tab — overlaps top of doc (slightly bigger) */}
      <path
        d="M12 34 C12 29 14 24 18 24 L44 24 L54 37 L108 37 L108 42 L12 42 Z"
        fill="#fce8ee"
        stroke="#f5b8c8"
        strokeWidth="1"
      />

      {/* Folder body — overlaps bottom of doc */}
      <path
        d="M10 38 C10 34 13 32 17 32 L103 32 C107 32 110 34 110 38 L110 96 C110 100 107 103 103 103 L17 103 C13 103 10 100 10 96 Z"
        fill="#fce8ee"
        stroke="#f5b8c8"
        strokeWidth="1"
      />

      {/* Subtle inner shelf line */}
      <path
        d="M10 46 L110 46"
        stroke="#f5b8c8"
        strokeWidth="0.75"
        opacity="0.5"
      />
    </svg>
  );
}

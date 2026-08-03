export default function IconButton({ children, label, onClick }) {
  return (
    <button
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-container"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

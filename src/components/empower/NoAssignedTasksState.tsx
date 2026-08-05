export function NoAssignedTasksState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-[#D1D5DB] bg-white px-6 py-10">
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="19" cy="19" r="12" />
        <line x1="28" y1="28" x2="38" y2="38" />
        <path d="M16 15.5a3 3 0 1 1 3.9 2.9c-.6.2-.9.7-.9 1.3v.8" />
        <line x1="19" y1="23.5" x2="19" y2="23.6" />
      </svg>
      <p className="text-sm text-[#6B7280]">
        You don&apos;t currently have any pending tasks assigned to you
      </p>
    </div>
  )
}

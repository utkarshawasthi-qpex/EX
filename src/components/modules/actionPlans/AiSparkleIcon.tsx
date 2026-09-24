import { cn } from '@/lib/utils'

export function AiSparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-5 shrink-0 text-violet-600', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 2l1.2 4.2L17 7l-3.8 1.2L12 12l-1.2-3.8L7 7l3.8-.8L12 2z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M19 11l.7 2.3L22 14l-2.3.7L19 17l-.7-2.3L16 14l2.3-.7L19 11z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M5 15l.9 3.1L9 19l-3.1.9L5 23l-.9-3.1L1 19l3.1-.9L5 15z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  )
}

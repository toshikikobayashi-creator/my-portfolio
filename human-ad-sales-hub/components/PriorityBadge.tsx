import { LeadPriority, PRIORITY_COLORS } from '@/lib/types'

export default function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  )
}

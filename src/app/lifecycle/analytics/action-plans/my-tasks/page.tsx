import { redirect } from 'next/navigation'
import { ACTION_PLANS_OVERVIEW } from '@/lib/actionPlans/paths'

/** Tasks live on the Action plans home — keep legacy URL working. */
export default function MyTasksRedirectPage() {
  redirect(ACTION_PLANS_OVERVIEW)
}

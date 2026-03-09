import { redirect } from 'next/navigation'
import { getCurrentOrNextRace } from '@/lib/f1Calendar'

export default function DashboardRedirect() {
  const race = getCurrentOrNextRace()
  redirect(`/${race.slug}`)
}

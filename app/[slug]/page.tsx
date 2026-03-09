import { redirect } from 'next/navigation'
import { getRaceBySlug, getCurrentOrNextRace } from '@/lib/f1Calendar'
import LiveDashboard from '@/app/dashboard/LiveDashboard'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function RaceDashboardPage({ params }: PageProps) {
  const { slug } = await params

  if (slug === 'dashboard') {
    redirect(`/${getCurrentOrNextRace().slug}`)
  }

  const race = getRaceBySlug(slug)
  if (!race) {
    redirect('/')
  }

  return <LiveDashboard />
}

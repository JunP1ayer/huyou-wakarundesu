import Settings from '@/components/settings/Settings'
import AuthGuard from '@/components/auth/AuthGuard'

export default function SettingsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <Settings />
    </AuthGuard>
  )
}
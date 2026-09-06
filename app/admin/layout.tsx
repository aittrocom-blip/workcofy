import Link from 'next/link'
import { AdminTabs } from '@/components/admin/AdminTabs'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
          <AdminTabs />
          <Link href="/espacios" className="text-sm font-medium text-gray-400 hover:text-black">
            Volver al sitio
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}

'use client'

import { MessageSquare, UserPlus, DollarSign, Send } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/currency'

export default function DashboardPage() {
  const auth = useAuth()
  const defaultCurrency = auth?.defaultCurrency || 'USD'

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-slate-400">Welcome to WACRM</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={MessageSquare}
            label="Daily Messages"
            value="0"
            trend="+0%"
          />
          <MetricCard
            icon={UserPlus}
            label="New Contacts"
            value="0"
            trend="+0%"
          />
          <MetricCard
            icon={DollarSign}
            label="Pipeline Value"
            value={formatCurrency(0, defaultCurrency)}
            trend="+0%"
          />
          <MetricCard
            icon={Send}
            label="Avg Response Time"
            value="—"
            trend="—"
          />
        </div>

        <div className="mt-8">
          <QuickActions />
        </div>

        <div className="mt-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Getting Started</h2>
            <p className="mt-2 text-slate-400">
              Your account is set up and ready to use. Visit the Contacts, Pipelines, and Automations sections to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { CheckSquare, Calendar, Timer, Target, Droplets, Utensils, Dumbbell, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return <DashboardContent />
}

function DashboardContent() {
  const quickLinks = [
    { href: '/tasks', icon: CheckSquare, label: 'Tasks', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { href: '/calendar', icon: Calendar, label: 'Calendar', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { href: '/timers', icon: Timer, label: 'Timers', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { href: '/habits', icon: Target, label: 'Habits', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { href: '/hydration', icon: Droplets, label: 'Hydration', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { href: '/food', icon: Utensils, label: 'Food', color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { href: '/workouts', icon: Dumbbell, label: 'Workouts', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  ]

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Here's what's happening with your life today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Tasks Today" value="0" subtitle="Nothing yet" trend="+0%" />
        <StatCard title="Active Habits" value="0" subtitle="Start building" trend="+0%" />
        <StatCard title="Water Intake" value="0L" subtitle="Stay hydrated" trend="+0%" />
        <StatCard title="Workout Streak" value="0" subtitle="days" trend="+0%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your events and appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>No events scheduled for today</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to your features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link key={link.href} href={link.href}>
                  <Button variant="ghost" className="w-full justify-start group">
                      <div className={`w-8 h-8 rounded-lg ${link.bgColor} flex items-center justify-center mr-3`}>
                        <Icon className={`w-4 h-4 ${link.color}`} />
                      </div>
                      <span className="flex-1 text-left font-medium">{link.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend 
}: { 
  title: string
  value: string
  subtitle: string
  trend: string
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <span className="text-xs text-muted-foreground">{trend}</span>
        </div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}


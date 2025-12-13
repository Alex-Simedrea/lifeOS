'use client'

import { SignInButton } from '@clerk/nextjs'
import { 
  Activity, 
  Calendar, 
  CheckSquare, 
  Droplets, 
  Timer, 
  TrendingUp,
  Utensils,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LandingPage() {
  const features = [
    { icon: CheckSquare, title: 'Tasks', description: 'Organize and track your daily tasks' },
    { icon: Calendar, title: 'Calendar', description: 'Plan your days and events' },
    { icon: Timer, title: 'Timers', description: 'Track time spent on activities' },
    { icon: Target, title: 'Habits', description: 'Build and maintain good habits' },
    { icon: Droplets, title: 'Hydration', description: 'Monitor your water intake' },
    { icon: Utensils, title: 'Food Logging', description: 'Track your meals and nutrition' },
    { icon: Activity, title: 'Workouts', description: 'Log and track your exercises' },
    { icon: TrendingUp, title: 'Analytics', description: 'Visualize your progress' },
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted">
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">LifeOS</span>
            </div>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Your Life,{' '}
              <span className="bg-linear-to-r from-primary via-chart-1 to-chart-3 bg-clip-text text-transparent">
                Organized
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A comprehensive platform to track, manage, and optimize every aspect of your daily life.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </SignInButton>
          </div>

          <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} LifeOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


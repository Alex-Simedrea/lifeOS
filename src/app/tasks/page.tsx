'use client'

import { Authenticated } from 'convex/react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AppLayout } from '@/components/app-layout'
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical,
  Calendar as CalendarIcon,
  Flag,
  Timer,
  Edit,
  Tag as TagIcon,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export default function TasksPage() {
  return (
    <Authenticated>
      <AppLayout>
        <TasksContent />
      </AppLayout>
    </Authenticated>
  )
}

function TasksContent() {
  const tasks = useQuery(api.tasks.list, {})
  const tags = useQuery(api.tags.list, {})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const todoTasks = tasks?.filter(t => t.status === 'todo') ?? []
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') ?? []
  const completedTasks = tasks?.filter(t => t.status === 'completed') ?? []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tasks</h1>
            <p className="text-muted-foreground">
              Organize and track your daily tasks
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTask(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <TaskForm 
                task={editingTask}
                tags={tags ?? []}
                onClose={() => {
                  setDialogOpen(false)
                  setEditingTask(null)
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskColumn 
            title="To Do" 
            tasks={todoTasks} 
            tags={tags ?? []}
            icon={<Circle className="w-5 h-5 text-muted-foreground" />}
            count={todoTasks.length}
            emptyMessage="No tasks to do"
            onEdit={(task) => {
              setEditingTask(task)
              setDialogOpen(true)
            }}
          />
          <TaskColumn 
            title="In Progress" 
            tasks={inProgressTasks}
            tags={tags ?? []}
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            count={inProgressTasks.length}
            emptyMessage="No tasks in progress"
            onEdit={(task) => {
              setEditingTask(task)
              setDialogOpen(true)
            }}
          />
          <TaskColumn 
            title="Completed" 
            tasks={completedTasks}
            tags={tags ?? []}
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
            count={completedTasks.length}
            emptyMessage="No completed tasks"
            onEdit={(task) => {
              setEditingTask(task)
              setDialogOpen(true)
            }}
          />
        </div>
      </div>
    </div>
  )
}

function TaskColumn({ 
  title, 
  tasks, 
  tags,
  icon, 
  count,
  emptyMessage,
  onEdit
}: { 
  title: string
  tasks: any[]
  tags: any[]
  icon: React.ReactNode
  count: number
  emptyMessage: string
  onEdit: (task: any) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground text-sm">
              {emptyMessage}
            </p>
          </Card>
        ) : (
          tasks.map((task) => <TaskCard key={task._id} task={task} tags={tags} onEdit={onEdit} />)
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, tags, onEdit }: { task: any; tags: any[]; onEdit: (task: any) => void }) {
  const toggleStatus = useMutation(api.tasks.toggleStatus)
  const deleteTask = useMutation(api.tasks.remove)
  const updateTask = useMutation(api.tasks.update)

  const priorityConfig = {
    low: { label: 'Low', color: 'text-gray-500', variant: 'outline' as const },
    medium: { label: 'Medium', color: 'text-blue-500', variant: 'secondary' as const },
    high: { label: 'High', color: 'text-orange-500', variant: 'default' as const },
    urgent: { label: 'Urgent', color: 'text-red-500', variant: 'destructive' as const },
  }

  const handleToggle = () => {
    toggleStatus({ id: task._id })
  }

  const handleDelete = () => {
    deleteTask({ id: task._id })
  }

  const handleStatusChange = (newStatus: 'todo' | 'in_progress' | 'completed' | 'cancelled') => {
    updateTask({ id: task._id, status: newStatus })
  }

  const config = priorityConfig[task.priority as keyof typeof priorityConfig]
  const taskTags = task.tags.map((tagId: Id<"tags">) => tags.find(t => t._id === tagId)).filter(Boolean)

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="mt-1 hover:opacity-70 transition-opacity flex-shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : task.status === 'in_progress' ? (
            <Clock className="w-5 h-5 text-blue-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-medium leading-tight ${
              task.status === 'completed' 
                ? 'line-through text-muted-foreground' 
                : ''
            }`}>
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                  Set as To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  Set as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  Mark Complete
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.notes && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.notes}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge variant={config.variant} className="text-xs">
              <Flag className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            
            {task.dueAt && (
              <Badge variant="outline" className="text-xs">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {new Date(task.dueAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Badge>
            )}
            
            {task.duration && (
              <Badge variant="outline" className="text-xs">
                <Timer className="w-3 h-3 mr-1" />
                {task.duration}m
              </Badge>
            )}

            {taskTags.map((tag: any) => (
              <Badge 
                key={tag._id} 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                <span className="mr-1">{tag.emoji}</span>
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function TaskForm({ task, tags, onClose }: { task: any; tags: any[]; onClose: () => void }) {
  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const createTag = useMutation(api.tags.create)
  
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '')
  const [duration, setDuration] = useState(task?.duration?.toString() ?? '')
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>(task?.tags ?? [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [newTagEmoji, setNewTagEmoji] = useState('🏷️')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const taskData = {
        title: title.trim(),
        notes: notes.trim() || undefined,
        priority,
        dueAt: dueDate ? new Date(dueDate).getTime() : undefined,
        duration: duration ? parseInt(duration) : undefined,
        tags: selectedTags,
      }

      if (task) {
        await updateTask({
          id: task._id,
          ...taskData,
        })
      } else {
        await createTask(taskData)
      }
      
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    const tagId = await createTag({
      name: newTagName.trim(),
      color: newTagColor,
      emoji: newTagEmoji,
    })
    
    setSelectedTags([...selectedTags, tagId])
    setNewTagName('')
    setNewTagColor('#3b82f6')
    setNewTagEmoji('🏷️')
    setShowNewTag(false)
  }

  const toggleTag = (tagId: Id<"tags">) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogDescription>
          {task ? 'Update your task details.' : 'Add a new task to your list. Set priority, due date, and estimated duration.'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review project proposal"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-gray-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag._id}
                  variant={selectedTags.includes(tag._id) ? "default" : "outline"}
                  className="cursor-pointer"
                  style={selectedTags.includes(tag._id) ? { 
                    backgroundColor: tag.color, 
                    borderColor: tag.color 
                  } : { 
                    borderColor: tag.color, 
                    color: tag.color 
                  }}
                  onClick={() => toggleTag(tag._id)}
                >
                  <span className="mr-1">{tag.emoji}</span>
                  {tag.name}
                  {selectedTags.includes(tag._id) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
              
              <Popover open={showNewTag} onOpenChange={setShowNewTag}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <Plus className="w-3 h-3 mr-1" />
                    New Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Create New Tag</h4>
                    <div className="space-y-2">
                      <Label htmlFor="tagName">Name</Label>
                      <Input
                        id="tagName"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="e.g., Work"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tagEmoji">Emoji</Label>
                        <Input
                          id="tagEmoji"
                          value={newTagEmoji}
                          onChange={(e) => setNewTagEmoji(e.target.value)}
                          placeholder="🏷️"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagColor">Color</Label>
                        <Input
                          id="tagColor"
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleCreateTag} 
                      className="w-full"
                      type="button"
                      disabled={!newTagName.trim()}
                    >
                      Create Tag
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import InputColor from '@/components/ui/input-color'
import { 
  EmojiPicker, 
  EmojiPickerContent, 
  EmojiPickerFooter, 
  EmojiPickerSearch 
} from '@/components/ui/emoji-picker'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, Circle, Plus, X, Calendar as CalendarIcon, Flag } from 'lucide-react'

export function TaskForm({ task, tags, onClose }: { task: any; tags: any[]; onClose: () => void }) {
  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const createTag = useMutation(api.tags.create)
  
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task?.priority ?? 'medium')
  const [date, setDate] = useState<Date | undefined>(task?.dueAt ? new Date(task.dueAt) : undefined)
  const [duration, setDuration] = useState(task?.duration?.toString() ?? '')
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>(task?.tags ?? [])
  const [subtasks, setSubtasks] = useState<Array<{ id: string; text: string; completed: boolean }>>(
    task?.subtasks ?? []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isRecurring, setIsRecurring] = useState(!!task?.recurrence)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    task?.recurrence?.type ?? 'daily'
  )
  const [recurrenceInterval, setRecurrenceInterval] = useState(task?.recurrence?.interval?.toString() ?? '1')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(
    task?.recurrence?.endDate ? new Date(task.recurrence.endDate) : undefined
  )
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>(task?.recurrence?.daysOfWeek ?? [])
  const [dayOfMonth, setDayOfMonth] = useState(task?.recurrence?.dayOfMonth?.toString() ?? '1')
  
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [newTagEmoji, setNewTagEmoji] = useState('🏷️')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const recurrence = isRecurring ? {
        type: recurrenceType,
        interval: parseInt(recurrenceInterval) || 1,
        endDate: recurrenceEndDate ? recurrenceEndDate.getTime() : undefined,
        daysOfWeek: recurrenceType === 'weekly' && selectedDaysOfWeek.length > 0 
          ? selectedDaysOfWeek 
          : undefined,
        dayOfMonth: recurrenceType === 'monthly' 
          ? parseInt(dayOfMonth) || 1 
          : undefined,
      } : undefined

      const taskData = {
        title: title.trim(),
        notes: notes.trim() || undefined,
        priority,
        dueAt: date ? date.getTime() : undefined,
        duration: duration ? parseInt(duration) : undefined,
        tags: selectedTags,
        recurrence,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
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

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="dueDate"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recurring">Recurring Task</Label>
                <p className="text-sm text-muted-foreground">
                  Set this task to repeat on a schedule
                </p>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceType">Repeat</Label>
                    <Select value={recurrenceType} onValueChange={(value: any) => setRecurrenceType(value)}>
                      <SelectTrigger id="recurrenceType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval">Every</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>

                {recurrenceType === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Repeat on</Label>
                    <div className="flex gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={selectedDaysOfWeek.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="w-12"
                          onClick={() => toggleDayOfWeek(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrenceType === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfMonth">Day of Month</Label>
                    <Input
                      id="dayOfMonth"
                      type="number"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      min="1"
                      max="31"
                      placeholder="1"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="endDate"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : <span>Never ends</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {recurrenceEndDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRecurrenceEndDate(undefined)}
                      className="w-full"
                    >
                      Clear end date
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 rounded-md border bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSubtasks(subtasks.map(s =>
                        s.id === subtask.id ? { ...s, completed: !s.completed } : s
                      ))
                    }}
                    className="hover:opacity-70 transition-opacity shrink-0"
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <Input
                    value={subtask.text}
                    onChange={(e) => {
                      setSubtasks(subtasks.map(s =>
                        s.id === subtask.id ? { ...s, text: e.target.value } : s
                      ))
                    }}
                    className="h-8 text-sm flex-1"
                    placeholder="Subtask text"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSubtasks(subtasks.filter(s => s.id !== subtask.id))
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  setSubtasks([...subtasks, { id: newId, text: '', completed: false }])
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subtask
              </Button>
            </div>
          </div>

          <Separator />

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
                <PopoverContent className="w-96">
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

                    <div className="space-y-2">
                      <Label htmlFor="tagEmoji">Emoji</Label>
                      <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <span className="text-2xl mr-2">{newTagEmoji}</span>
                            Choose emoji
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <EmojiPicker
                            onEmojiSelect={(emoji) => {
                              setNewTagEmoji(emoji.emoji)
                              setEmojiPickerOpen(false)
                            }}
                          >
                            <EmojiPickerSearch placeholder="Search emoji..." />
                            <EmojiPickerContent className="h-[300px]" />
                            <EmojiPickerFooter />
                          </EmojiPicker>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <InputColor
                      label="Color"
                      value={newTagColor}
                      onChange={setNewTagColor}
                      onBlur={() => {}}
                      className="mt-0"
                    />

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


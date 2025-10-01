"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Edit2, Play, Volume2, Upload } from "lucide-react"
import { Square } from "lucide-react"

interface SoundButtonProps {
  id: string
  label: string
  color: "cyan" | "orange" | "green" | "purple"
  audioUrl?: string
  onLabelChange: (id: string, newLabel: string) => void
  onAudioChange: (id: string, audioUrl: string) => void
  onPlay: (id: string, audioUrl?: string) => void
  isEditMode: boolean
  className?: string
}

export function SoundButton({
  id,
  label,
  color,
  audioUrl,
  onLabelChange,
  onAudioChange,
  onPlay,
  isEditMode,
  className,
}: SoundButtonProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const colorFillClasses = {
    cyan: "bg-neon-cyan text-white hover:bg-neon-cyan/90 active:bg-neon-cyan/80 border-neon-cyan",
    orange: "bg-neon-orange text-white hover:bg-neon-orange/90 active:bg-neon-orange/80 border-neon-orange",
    green: "bg-neon-green text-white hover:bg-neon-green/90 active:bg-neon-green/80 border-neon-green",
    purple: "bg-neon-purple text-white hover:bg-neon-purple/90 active:bg-neon-purple/80 border-neon-purple",
  }

  const handleSave = () => {
    onLabelChange(id, editLabel)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditLabel(label)
    setIsEditing(false)
  }

  const handlePlay = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } finally {
          setIsPlaying(false)
        }
        return
      }

      setIsPlaying(true)
      audioRef.current.currentTime = 0
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.onended = () => setIsPlaying(false)
        })
        .catch(() => {
          setIsPlaying(false)
        })
    } else {
      setIsPlaying(true)
      onPlay(id, audioUrl)
      setTimeout(() => setIsPlaying(false), 1000)
    }
  }

  const convertAudioToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      try {
        const body = new FormData()
        body.append('file', file)
        body.append('label', editLabel || label)
        const res = await fetch('/api/upload-sound', { method: 'POST', body })
        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        if (data?.url) {
          onAudioChange(id, data.url)
          return
        }
        throw new Error('No URL returned')
      } catch (error) {
        console.error("Upload failed, falling back to base64/blob:", error)
        try {
          const base64Url = await convertAudioToBase64(file)
          onAudioChange(id, base64Url)
        } catch (_err) {
          const url = URL.createObjectURL(file)
          onAudioChange(id, url)
        }
      }
    }
  }

  const handleAudioButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  if (isEditing && isEditMode) {
    return (
      <div className={cn("relative space-y-2", className)}>
        <Input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") handleCancel()
          }}
          className="h-16 text-center font-bold text-sm bg-card border-2"
          maxLength={25}
          autoFocus
          placeholder="Button label"
        />
        <div className="flex gap-2">
          <Button
            onMouseDown={handleAudioButtonClick}
            size="sm"
            variant="outline"
            className="flex-1 text-xs bg-transparent"
            type="button"
          >
            <Upload className="h-3 w-3 mr-1" />
            {audioUrl ? "Change Audio" : "Add Audio"}
          </Button>
          <Button onClick={handleSave} size="sm" variant="default" className="text-xs">
            Save
          </Button>
          <Button onClick={handleCancel} size="sm" variant="ghost" className="text-xs">
            Cancel
          </Button>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative group", className)}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <Button
        onClick={handlePlay}
        className={cn(
          "h-20 w-full font-extrabold text-sm transition-all duration-200 border-2",
          "hover:scale-[1.03] active:scale-95",
          colorFillClasses[color],
          isPlaying && "ring-4 ring-white/50",
        )}
        variant="default"
      >
        <div className="flex items-center justify-center gap-2">
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="text-balance leading-tight">{label}</span>
        </div>
      </Button>

      {isEditMode && (
        <Button
          onClick={() => setIsEditing(true)}
          size="sm"
          variant="ghost"
          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 backdrop-blur-sm"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

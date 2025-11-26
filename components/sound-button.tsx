"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SHOW_URL } from "@/lib/constants"
import { Edit2, Play, Square, Upload } from "lucide-react"

interface SoundMeta {
  country?: "US" | "UK"
  showUrl?: string
  episodeUrl?: string
  seasonEpisode?: string
  actors?: Array<"Ellyn" | "Daisy" | "Nick" | "Vanessa" | "Cast">
  nsfw?: boolean
}

interface SoundButtonProps {
  id: string
  label: string
  color: "cyan" | "orange" | "green" | "purple"
  audioUrl?: string
  meta?: SoundMeta
  onLabelChange: (id: string, newLabel: string) => void
  onAudioChange: (id: string, audioUrl: string) => void
  onMetaChange?: (id: string, meta: Partial<SoundMeta>) => void
  onPlay: (id: string, audioUrl?: string) => void
  onStop?: () => void
  isEditMode: boolean
  className?: string
  isSpeechActive?: boolean
  forceEditMode?: boolean
  onStartEditing?: (id: string) => void
}

export function SoundButton({
  id,
  label,
  color,
  audioUrl,
  meta,
  onLabelChange,
  onAudioChange,
  onMetaChange,
  onPlay,
  onStop,
  isEditMode,
  className,
  isSpeechActive,
  forceEditMode,
  onStartEditing,
}: SoundButtonProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(label)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const colorFillClasses = {
    cyan: "bg-neon-cyan text-white hover:bg-neon-cyan/90 active:bg-neon-cyan/80 border-neon-cyan",
    orange: "bg-neon-orange text-white hover:bg-neon-orange/90 active:bg-neon-orange/80 border-neon-orange",
    green: "bg-neon-green text-white hover:bg-neon-green/90 active:bg-neon-green/80 border-neon-green",
    purple: "bg-neon-purple text-white hover:bg-neon-purple/90 active:bg-neon-purple/80 border-neon-purple",
  }

  const startEditing = useCallback(() => {
    setIsEditing(true)
    onStartEditing?.(id)
  }, [id, onStartEditing])

  useEffect(() => {
    if (forceEditMode && isEditMode && !isEditing) {
      startEditing()
    }
  }, [forceEditMode, isEditMode, isEditing, startEditing])

  const handleSave = () => {
    onLabelChange(id, editLabel)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditLabel(label)
    setIsEditing(false)
  }

  const handleToggle = () => {
    if (isSpeechActive) {
      onStop?.()
    } else {
      onPlay(id, audioUrl)
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
      <div className={cn("relative space-y-3", className)}>
        <Input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") handleCancel()
          }}
          className="h-14 text-center font-bold text-sm bg-card border-2"
          maxLength={40}
          autoFocus
          placeholder="Button label"
        />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="font-semibold mb-1">Country</div>
            <select
              defaultValue={meta?.country || "US"}
              onChange={(e) => onMetaChange?.(id, { country: e.target.value as any })}
              className="w-full rounded-md border px-2 py-1 bg-white"
            >
              <option value="US">US</option>
              <option value="UK">UK</option>
            </select>
          </div>
          <div>
            <div className="font-semibold mb-1">Season / Episode</div>
            <Input
              defaultValue={meta?.seasonEpisode || ""}
              onChange={(e) => onMetaChange?.(id, { seasonEpisode: e.target.value })}
              className="h-8"
              placeholder="S01 EP01"
            />
          </div>
          <div className="col-span-2">
            <div className="font-semibold mb-1">Show Link</div>
            <Input
              defaultValue={meta?.showUrl || SHOW_URL}
              onChange={(e) => onMetaChange?.(id, { showUrl: e.target.value })}
              className="h-8"
              placeholder="https://…"
            />
          </div>
          <div className="col-span-2">
            <div className="font-semibold mb-1">Episode Link</div>
            <Input
              defaultValue={meta?.episodeUrl || ""}
              onChange={(e) => onMetaChange?.(id, { episodeUrl: e.target.value })}
              className="h-8"
              placeholder="https://…"
            />
          </div>
          <div className="col-span-2">
            <div className="font-semibold mb-1">Featured</div>
            <div className="flex flex-wrap gap-3">
              {(["Ellyn","Daisy","Nick","Vanessa","Cast"] as const).map((name) => {
                const checked = (meta?.actors || []).includes(name)
                return (
                  <label key={name} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={checked}
                      onChange={(e) => {
                        const current = new Set(meta?.actors || [])
                        if (e.target.checked) current.add(name)
                        else current.delete(name)
                        onMetaChange?.(id, { actors: Array.from(current) as any })
                      }}
                    />
                    <span>{name}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={meta?.nsfw ?? true}
                onChange={(e) => onMetaChange?.(id, { nsfw: e.target.checked })}
              />
              NSFW
            </label>
          </div>
        </div>

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

      <Button
        onClick={handleToggle}
        className={cn(
          "h-20 w-full font-extrabold text-sm transition-all duration-200 border-2",
          "hover:scale-[1.03] active:scale-95",
          colorFillClasses[color],
        )}
        variant="default"
      >
        <div className="flex items-center justify-center gap-2">
          {isSpeechActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="text-balance leading-tight">{label}</span>
        </div>
      </Button>

      {isSpeechActive && (
        <div className="absolute left-1/2 bottom-full mb-3 w-full -translate-x-1/2 flex justify-center pointer-events-none z-10">
          <div className="relative w-48 max-w-[80vw] rounded-2xl border border-border bg-white/95 px-3 py-2 text-slate-900 shadow-lg text-xs pointer-events-none">
            <div className="mb-1 text-[10px] uppercase tracking-[0.35em] text-slate-500">Now playing</div>
            <div className="text-sm font-semibold leading-snug">{label}</div>
            <div className="mt-1">
              {meta?.episodeUrl ? (
                <a className="text-sm font-semibold text-blue-600 underline pointer-events-auto" href={meta.episodeUrl} target="_blank" rel="noreferrer">
                  Episode link
                </a>
              ) : (
                <a className="text-sm font-semibold text-blue-600 underline pointer-events-auto" href={meta?.showUrl || SHOW_URL} target="_blank" rel="noreferrer">
                  Go to Show
                </a>
              )}
            </div>
            <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-border bg-white/95" />
          </div>
        </div>
      )}

      {isEditMode && (
        <Button
          onClick={startEditing}
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

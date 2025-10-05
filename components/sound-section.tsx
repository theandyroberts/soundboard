"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SoundButton } from "./sound-button"
import { cn } from "@/lib/utils"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface SoundMeta {
  country?: "US" | "UK"
  showUrl?: string
  episodeUrl?: string
  seasonEpisode?: string
  actors?: Array<"Ellyn" | "Daisy" | "Nick" | "Vanessa" | "Cast">
  nsfw?: boolean
}

interface SoundData {
  id: string
  label: string
  audioUrl?: string
  meta?: SoundMeta
}

interface SoundSectionProps {
  id: string
  title: string
  color: "cyan" | "orange" | "green" | "purple"
  sounds: SoundData[]
  onTitleChange: (id: string, newTitle: string) => void
  onSoundLabelChange: (sectionId: string, soundId: string, newLabel: string) => void
  onSoundAudioChange: (sectionId: string, soundId: string, audioUrl: string) => void
  onAddSound: (sectionId: string) => void
  onRemoveSection: (id: string) => void
  onPlaySound: (soundId: string) => void
  isEditMode: boolean
  onSoundMetaChange?: (sectionId: string, soundId: string, meta: Partial<SoundMeta>) => void
}

export function SoundSection({
  id,
  title,
  color,
  sounds,
  onTitleChange,
  onSoundLabelChange,
  onSoundAudioChange,
  onAddSound,
  onRemoveSection,
  onPlaySound,
  isEditMode,
  onSoundMetaChange,
}: SoundSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  // Lighter section container; keep subtle colored title accent
  const titleColorClasses = {
    cyan: "text-neon-cyan",
    orange: "text-neon-orange",
    green: "text-neon-green",
    purple: "text-neon-purple",
  }

  const handleSaveTitle = () => {
    onTitleChange(id, editTitle)
    setIsEditingTitle(false)
  }

  const handleCancelTitle = () => {
    setEditTitle(title)
    setIsEditingTitle(false)
  }

  // Cycle per-button colors across red(=purple token), blue(cyan), yellow(orange), green
  const cycle: Array<"purple" | "cyan" | "orange" | "green"> = ["purple", "cyan", "orange", "green"]

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm")}> 
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle && isEditMode ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle()
              if (e.key === "Escape") handleCancelTitle()
            }}
            onBlur={handleSaveTitle}
            className="font-bold text-lg bg-transparent border-none p-0 h-auto text-foreground"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 group">
            <h2
              className={cn(
                "font-extrabold text-lg px-3 py-1 rounded-md bg-white border border-border",
                titleColorClasses[color],
              )}
            >
              {title}
            </h2>
            {isEditMode && (
              <Button
                onClick={() => setIsEditingTitle(true)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {isEditMode && (
          <Button
            onClick={() => onRemoveSection(id)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {sounds.map((sound, idx) => (
          <SoundButton
            key={sound.id}
            id={sound.id}
            label={sound.label}
            audioUrl={sound.audioUrl}
            color={cycle[idx % cycle.length] as any}
            onLabelChange={(soundId, newLabel) => onSoundLabelChange(id, soundId, newLabel)}
            onAudioChange={(soundId, audioUrl) => onSoundAudioChange(id, soundId, audioUrl)}
            onMetaChange={onSoundMetaChange ? (soundId, meta) => onSoundMetaChange(id, soundId, meta) : undefined}
            meta={sound.meta}
            onPlay={onPlaySound}
            isEditMode={isEditMode}
          />
        ))}
      </div>

      {isEditMode && (
        <Button
          onClick={() => onAddSound(id)}
          variant="outline"
          className={cn(
            "w-full border-dashed border-2 h-12 transition-all duration-200",
            "hover:scale-105 active:scale-95",
            titleColorClasses[color],
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sound Effect
        </Button>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SoundButton } from "./sound-button"
import { cn } from "@/lib/utils"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface SoundData {
  id: string
  label: string
  audioUrl?: string
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
}: SoundSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  const colorClasses = {
    cyan: "border-neon-cyan/30 bg-neon-cyan/5",
    orange: "border-neon-orange/30 bg-neon-orange/5",
    green: "border-neon-green/30 bg-neon-green/5",
    purple: "border-neon-purple/30 bg-neon-purple/5",
  }

  const titleColorClasses = {
    cyan: "text-neon-cyan drop-shadow-sm",
    orange: "text-neon-orange drop-shadow-sm",
    green: "text-neon-green drop-shadow-sm",
    purple: "text-neon-purple drop-shadow-sm",
  }

  const handleSaveTitle = () => {
    onTitleChange(id, editTitle)
    setIsEditingTitle(false)
  }

  const handleCancelTitle = () => {
    setEditTitle(title)
    setIsEditingTitle(false)
  }

  return (
    <div className={cn("rounded-lg border-2 p-4 backdrop-blur-sm", colorClasses[color])}>
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
                "font-bold text-lg px-3 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border/50",
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {sounds.map((sound) => (
          <SoundButton
            key={sound.id}
            id={sound.id}
            label={sound.label}
            audioUrl={sound.audioUrl}
            color={color}
            onLabelChange={(soundId, newLabel) => onSoundLabelChange(id, soundId, newLabel)}
            onAudioChange={(soundId, audioUrl) => onSoundAudioChange(id, soundId, audioUrl)}
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
            `border-${color === "cyan" ? "neon-cyan" : color === "orange" ? "neon-orange" : color === "green" ? "neon-green" : "neon-purple"}/50`,
            `hover:bg-${color === "cyan" ? "neon-cyan" : color === "orange" ? "neon-orange" : color === "green" ? "neon-green" : "neon-purple"}/10`,
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Sound Effect
        </Button>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SoundSection } from "@/components/sound-section"
import { Plus, Volume2, Edit, Eye } from "lucide-react"

interface SoundData {
  id: string
  label: string
  audioUrl?: string
}

interface Section {
  id: string
  title: string
  color: "cyan" | "orange" | "green" | "purple"
  sounds: SoundData[]
}

const initialSections: Section[] = [
  {
    id: "function",
    title: "Function",
    color: "cyan",
    sounds: [
      { id: "keynote", label: "Keynote" },
      { id: "social-shake", label: "Social Shake" },
      { id: "good-brother", label: "Good Brother" },
      { id: "bayonet", label: "Bayonet" },
    ],
  },
  {
    id: "special-effects",
    title: "Special Effects",
    color: "orange",
    sounds: [
      { id: "applause", label: "Applause" },
      { id: "laughter", label: "Laughter" },
      { id: "kiss", label: "Kiss" },
      { id: "thanks", label: "Thanks" },
      { id: "welcome", label: "Welcome" },
      { id: "hit-him", label: "Hit Him" },
      { id: "ouch", label: "Ouch" },
      { id: "too-hard", label: "Too Hard" },
      { id: "follow", label: "Follow" },
    ],
  },
  {
    id: "music-controls",
    title: "Music Controls",
    color: "green",
    sounds: [
      { id: "play-pause", label: "Play/Pause" },
      { id: "next-track", label: "Next Track" },
      { id: "previous", label: "Previous" },
      { id: "volume-up", label: "Volume Up" },
    ],
  },
]

const colors: Array<"cyan" | "orange" | "green" | "purple"> = ["cyan", "orange", "green", "purple"]

const STORAGE_KEY = "sound-effects-board-data"

const saveToLocalStorage = (sections: Section[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

const loadFromLocalStorage = (): Section[] | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error("Failed to load from localStorage:", error)
    return null
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

export default function SoundEffectsBoard() {
  const [sections, setSections] = useState<Section[]>(() => {
    if (typeof window !== "undefined") {
      const saved = loadFromLocalStorage()
      return saved || initialSections
    }
    return initialSections
  })
  const [isEditMode, setIsEditMode] = useState(true)

  useEffect(() => {
    saveToLocalStorage(sections)
  }, [sections])

  const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, title: newTitle } : section)))
  }

  const handleSoundLabelChange = (sectionId: string, soundId: string, newLabel: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              sounds: section.sounds.map((sound) => (sound.id === soundId ? { ...sound, label: newLabel } : sound)),
            }
          : section,
      ),
    )
  }

  const handleSoundAudioChange = (sectionId: string, soundId: string, audioUrl: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              sounds: section.sounds.map((sound) => (sound.id === soundId ? { ...sound, audioUrl } : sound)),
            }
          : section,
      ),
    )
  }

  const handleAddSound = (sectionId: string) => {
    const newSoundId = `sound-${Date.now()}`
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              sounds: [...section.sounds, { id: newSoundId, label: "New Sound" }],
            }
          : section,
      ),
    )
  }

  const handleAddSection = () => {
    const newSectionId = `section-${Date.now()}`
    const availableColors = colors.filter((color) => !sections.some((section) => section.color === color))
    const color = availableColors.length > 0 ? availableColors[0] : colors[sections.length % colors.length]

    const newSection: Section = {
      id: newSectionId,
      title: "New Section",
      color,
      sounds: [{ id: `${newSectionId}-sound-1`, label: "Sample Sound" }],
    }

    setSections((prev) => [...prev, newSection])
  }

  const handleRemoveSection = (sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId))
  }

  const handlePlaySound = (soundId: string, audioUrl?: string) => {
    console.log(`Playing sound: ${soundId}`)

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl)
        audio.play().catch((error) => {
          console.error("Failed to play audio:", error)
        })
        return
      } catch (error) {
        console.error("Failed to create audio element:", error)
      }
    }

    // Fallback to beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log("Audio playback not supported")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Volume2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Professional Sound Effects Board</h1>
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant="outline"
              size="sm"
              className="ml-4 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Production Mode
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              )}
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            Create, customize, and organize your sound effects with professional-grade controls
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <SoundSection
              key={section.id}
              id={section.id}
              title={section.title}
              color={section.color}
              sounds={section.sounds}
              onTitleChange={handleSectionTitleChange}
              onSoundLabelChange={handleSoundLabelChange}
              onSoundAudioChange={handleSoundAudioChange}
              onAddSound={handleAddSound}
              onRemoveSection={handleRemoveSection}
              onPlaySound={handlePlaySound}
              isEditMode={isEditMode}
            />
          ))}
        </div>

        {isEditMode && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleAddSection}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 text-lg transition-all duration-200 hover:scale-105 active:scale-95 neon-glow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Section
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

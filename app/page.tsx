"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SoundSection } from "@/components/sound-section"
import { Plus, Volume2, Edit, Eye } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

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

export default function SoundEffectsBoard() {
  const [sections, setSections] = useState<Section[]>([])
  const [isEditMode, setIsEditMode] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Load from Supabase (and seed if empty). If DB is not ready, fall back to local initialSections.
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)

      const { data: dbSections, error: secErr } = await supabase
        .from("sections")
        .select("id,title,color,created_at")
        .order("created_at", { ascending: true })

      if (secErr) {
        console.warn("Supabase not available or schema missing; falling back to local data.", secErr)
        setSections(initialSections)
        setIsLoading(false)
        return
      }

      if (!dbSections || dbSections.length === 0) {
        for (const s of initialSections) {
          const { data: ins, error } = await supabase
            .from("sections")
            .insert({ title: s.title, color: s.color })
            .select("id,title,color")
            .single()
          if (error || !ins) continue

          const soundsPayload = s.sounds.map((snd, idx) => ({
            label: snd.label,
            audio_url: snd.audioUrl ?? null,
            section_id: ins.id,
            position: idx,
          }))
          await supabase.from("sounds").insert(soundsPayload)
        }
      }

      const { data: sectionsData } = await supabase
        .from("sections")
        .select("id,title,color,created_at")
        .order("created_at", { ascending: true })

      const { data: soundsData } = await supabase
        .from("sounds")
        .select("id,section_id,label,audio_url,position,created_at")
        .order("position", { ascending: true })

      const composed: Section[] = (sectionsData || []).map((s) => ({
        id: s.id as unknown as string,
        title: s.title as string,
        color: s.color as Section["color"],
        sounds: (soundsData || [])
          .filter((snd) => snd.section_id === s.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((snd) => ({ id: snd.id as unknown as string, label: snd.label as string, audioUrl: (snd.audio_url as string | null) || undefined })),
      }))

      setSections(composed)
      setIsLoading(false)
    }

    load()
  }, [])

  const handleSectionTitleChange = async (sectionId: string, newTitle: string) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, title: newTitle } : section)))
    const { error } = await supabase.from("sections").update({ title: newTitle }).eq("id", sectionId)
    if (error) console.error("Failed to update section title:", error)
  }

  const handleSoundLabelChange = async (sectionId: string, soundId: string, newLabel: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, sounds: section.sounds.map((sound) => (sound.id === soundId ? { ...sound, label: newLabel } : sound)) }
          : section,
      ),
    )
    const { error } = await supabase.from("sounds").update({ label: newLabel }).eq("id", soundId)
    if (error) console.error("Failed to update sound label:", error)
  }

  const handleSoundAudioChange = async (sectionId: string, soundId: string, audioUrl: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, sounds: section.sounds.map((sound) => (sound.id === soundId ? { ...sound, audioUrl } : sound)) }
          : section,
      ),
    )
    const { error } = await supabase.from("sounds").update({ audio_url: audioUrl }).eq("id", soundId)
    if (error) console.error("Failed to update sound audio_url:", error)
  }

  const handleAddSound = async (sectionId: string) => {
    const { data, error } = await supabase
      .from("sounds")
      .insert({ section_id: sectionId, label: "New Sound", position: 9999 })
      .select("id,label,audio_url,position")
      .single()

    if (error || !data) {
      console.warn("Failed to add sound to Supabase; adding locally only.", error)
      const newSoundId = `local-${Date.now()}`
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, sounds: [...section.sounds, { id: newSoundId, label: "New Sound" }] }
            : section,
        ),
      )
      return
    }

    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              sounds: [...section.sounds, { id: data.id as unknown as string, label: data.label as string, audioUrl: (data.audio_url as string | null) || undefined }],
            }
          : section,
      ),
    )
  }

  const handleAddSection = async () => {
    const availableColors = colors.filter((color) => !sections.some((section) => section.color === color))
    const color = availableColors.length > 0 ? availableColors[0] : colors[sections.length % colors.length]

    const { data, error } = await supabase
      .from("sections")
      .insert({ title: "New Section", color })
      .select("id,title,color")
      .single()

    if (error || !data) {
      console.warn("Failed to add section to Supabase; adding locally only.", error)
      const newSectionId = `local-${Date.now()}`
      const newSection: Section = { id: newSectionId, title: "New Section", color, sounds: [] }
      setSections((prev) => [...prev, newSection])
      return
    }

    const newSection: Section = { id: data.id as unknown as string, title: data.title as string, color: data.color as Section["color"], sounds: [] }
    setSections((prev) => [...prev, newSection])
  }

  const handleRemoveSection = async (sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId))
    const { error } = await supabase.from("sections").delete().eq("id", sectionId)
    if (error) console.error("Failed to remove section:", error)
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
            <h1 className="text-4xl font-bold text-foreground">Ellyn & Daisy's Sound Effects Board</h1>
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

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading…</div>
        ) : (
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
        )}

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

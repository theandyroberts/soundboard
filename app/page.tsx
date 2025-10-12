"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { SoundSection } from "@/components/sound-section"
import { Plus, Volume2, Edit, Eye } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

const EDIT_PASSWORD = process.env.NEXT_PUBLIC_EDIT_PASSWORD || "Rockovoix02!"

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

interface Section {
  id: string
  title: string
  color: "cyan" | "orange" | "green" | "purple"
  sounds: SoundData[]
}

const initialSections: Section[] = [
  {
    id: "function",
    title: "Top Sounds",
    color: "cyan",
    sounds: [
      { id: "keynote", label: "Nobody Cares ppp" },
      { id: "welcome", label: "Welcome to our Podcast" },
      { id: "good-brother", label: "Good Brother" },
      { id: "bayonet", label: "Bayonet" },
    ],
  },
]

const colors: Array<"cyan" | "orange" | "green" | "purple"> = ["cyan", "orange", "green", "purple"]

type CountryFilter = "ALL" | "US" | "UK"

type Actor = "Ellyn" | "Daisy" | "Nick" | "Vanessa" | "Cast"

export default function SoundEffectsBoard() {
  const [sections, setSections] = useState<Section[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [filterCountry, setFilterCountry] = useState<CountryFilter>("ALL")
  const [filterActors, setFilterActors] = useState<Set<Actor>>(new Set())
  const [filterSFWOnly, setFilterSFWOnly] = useState(false)

  // Active row metadata panel state
  const [activeRow, setActiveRow] = useState<string | null>(null)
  const [activeSound, setActiveSound] = useState<SoundData | null>(null)
  const [isMetaHover, setIsMetaHover] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const [hasPlaybackEnded, setHasPlaybackEnded] = useState(false)

  const handleToggleMode = () => {
    if (!isEditMode) {
      try {
        const authorized = typeof window !== "undefined" && sessionStorage.getItem("edit-auth") === "1"
        if (!authorized) {
          const input = typeof window !== "undefined" ? window.prompt("Enter password to enable Edit Mode") : null
          if (input !== EDIT_PASSWORD) {
            if (typeof window !== "undefined") window.alert("Incorrect password")
            return
          }
          if (typeof window !== "undefined") sessionStorage.setItem("edit-auth", "1")
        }
      } catch {
        return
      }
    }
    setIsEditMode(!isEditMode)
  }

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
            meta: snd.meta ?? {},
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

      let { data: soundsData } = await supabase
        .from("sounds")
        .select("id,section_id,label,audio_url,meta,position,created_at")
        .order("position", { ascending: true })

      // If there are sections but no sounds, auto-seed from /api/sounds
      if ((sectionsData && sectionsData.length > 0) && (!soundsData || soundsData.length === 0)) {
        try {
          const res = await fetch("/api/sounds")
          const json = await res.json().catch(() => ({ items: [] }))
          const items: Array<{ name: string; url: string }> = json?.items || []

          if (items.length > 0) {
            const top = sectionsData.find((s) => s.title?.toLowerCase() === "top sounds") || sectionsData[0]
            const toLabel = (name: string) =>
              name
                .replace(/\.[^.]+$/, "")
                .replace(/[-_]+/g, " ")
                .replace(/\b\w/g, (m) => m.toUpperCase())

            const payload = items.map((it, idx) => ({
              section_id: top.id,
              label: toLabel(it.name),
              audio_url: it.url,
              meta: { nsfw: true },
              position: idx,
            }))
            await supabase.from("sounds").insert(payload)

            const refreshed = await supabase
              .from("sounds")
              .select("id,section_id,label,audio_url,meta,position,created_at")
              .order("position", { ascending: true })
            soundsData = refreshed.data || []
          }
        } catch (e) {
          console.warn("Auto-seed from /api/sounds failed", e)
        }
      }

      const composed: Section[] = (sectionsData || []).map((s) => ({
        id: s.id as unknown as string,
        title: s.title as string,
        color: s.color as Section["color"],
        sounds: (soundsData || [])
          .filter((snd) => snd.section_id === s.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((snd) => ({ id: snd.id as unknown as string, label: snd.label as string, audioUrl: (snd.audio_url as string | null) || undefined, meta: (snd.meta as any) || {} })),
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

  const handleSoundMetaChange = async (sectionId: string, soundId: string, meta: Partial<SoundMeta>) => {
    // Compute merged meta
    let merged: SoundMeta | undefined
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              sounds: section.sounds.map((sound) => {
                if (sound.id !== soundId) return sound
                merged = { ...(sound.meta || {}), ...meta }
                return { ...sound, meta: merged }
              }),
            }
          : section,
      ),
    )
    const { error } = await supabase.from("sounds").update({ meta: merged as any }).eq("id", soundId)
    if (error) console.error("Failed to update sound meta:", error)
  }

  const handleAddSound = async (sectionId: string) => {
    const { data, error } = await supabase
      .from("sounds")
      .insert({ section_id: sectionId, label: "New Sound", meta: { nsfw: true }, position: 9999 })
      .select("id,label,audio_url,meta,position")
      .single()

    if (error || !data) {
      console.warn("Failed to add sound to Supabase; adding locally only.", error)
      const newSoundId = `local-${Date.now()}`
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, sounds: [...section.sounds, { id: newSoundId, label: "New Sound", meta: { nsfw: true } }] }
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
              sounds: [...section.sounds, { id: data.id as unknown as string, label: data.label as string, audioUrl: (data.audio_url as string | null) || undefined, meta: (data.meta as any) || {} }],
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
    const section = sections.find((sec) => sec.sounds.some((s) => s.id === soundId))
    const sound = section?.sounds.find((s) => s.id === soundId) || null
    setActiveRow(section?.id || null)
    setActiveSound(sound)

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (audioUrl) {
      setHasPlaybackEnded(false)
      try {
        const audio = new Audio(audioUrl)
        audio.play().catch((error) => {
          console.error("Failed to play audio:", error)
        })
        audio.onended = () => {
          setHasPlaybackEnded(true)
          hideTimerRef.current = window.setTimeout(() => {
            if (!isMetaHover) setActiveRow(null)
          }, 2000)
        }
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

      setHasPlaybackEnded(true)
      hideTimerRef.current = window.setTimeout(() => {
        if (!isMetaHover) setActiveRow(null)
      }, 2000)
    } catch (error) {
      console.log("Audio playback not supported")
    }
  }

  const handleMetaMouseEnter = () => {
    setIsMetaHover(true)
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const handleMetaMouseLeave = () => {
    setIsMetaHover(false)
    if (hasPlaybackEnded) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      hideTimerRef.current = window.setTimeout(() => {
        if (!isMetaHover) setActiveRow(null)
      }, 2000)
    }
  }

  const handleCloseMetaPanel = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setActiveRow(null)
    setActiveSound(null)
  }

  // Derived filtered sections
  const filteredSections = useMemo<Section[]>(() => {
    const actorsSelected = Array.from(filterActors)
    const hasActorFilter = actorsSelected.length > 0
    return sections.map((sec) => ({
      ...sec,
      sounds: sec.sounds.filter((s) => {
        const m = s.meta || {}
        if (filterCountry !== "ALL" && m.country && m.country !== filterCountry) return false
        // SFW only: when active, exclude sounds marked NSFW
        if (filterSFWOnly && m.nsfw) return false
        if (hasActorFilter) {
          const inSound = new Set((m.actors || []) as Actor[])
          const any = actorsSelected.some((a) => inSound.has(a))
          if (!any) return false
        }
        return true
      }),
    }))
  }, [sections, filterCountry, filterActors, filterSFWOnly])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Volume2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Ellyn & Daisy's Sound Board</h1>
            <Button
              onClick={handleToggleMode}
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
            Create, customize, and organize sounds from STFU Nick Lachey, a Love Is Blind recap podcast
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Country:</span>
            {(["ALL","US","UK"] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={filterCountry === c ? "default" : "outline"}
                className={filterCountry === c ? "bg-amber-500 border-amber-500" : ""}
                onClick={() => setFilterCountry(c)}
              >
                {c}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Actors:</span>
            {(["Ellyn","Daisy","Nick","Vanessa","Cast"] as const).map((name) => {
              const active = filterActors.has(name)
              return (
                <Button
                  key={name}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className={active ? "bg-blue-600 border-blue-600" : ""}
                  onClick={() => {
                    setFilterActors((prev) => {
                      const next = new Set(prev)
                      if (next.has(name)) next.delete(name)
                      else next.add(name)
                      return next
                    })
                  }}
                >
                  {name}
                </Button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">SFW only:</span>
            <Button
              size="sm"
              variant={filterSFWOnly ? "default" : "outline"}
              className={filterSFWOnly ? "bg-green-600 border-green-600" : ""}
              onClick={() => setFilterSFWOnly((v) => !v)}
            >
              {filterSFWOnly ? "On" : "Off"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-6">
            {filteredSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <SoundSection
                  id={section.id}
                  title={section.title}
                  color={section.color}
                  sounds={section.sounds}
                  onTitleChange={handleSectionTitleChange}
                  onSoundLabelChange={handleSoundLabelChange}
                  onSoundAudioChange={handleSoundAudioChange}
                  onSoundMetaChange={handleSoundMetaChange}
                  onAddSound={handleAddSound}
                  onRemoveSection={handleRemoveSection}
                  onPlaySound={handlePlaySound}
                  isEditMode={isEditMode}
                />

                {activeRow === section.id && activeSound && (
                  <div
                    onMouseEnter={handleMetaMouseEnter}
                    onMouseLeave={handleMetaMouseLeave}
                    onClick={handleMetaMouseEnter}
                    className="w-full rounded-xl border-2 border-amber-400 bg-amber-50 text-amber-900 px-6 py-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xl font-extrabold">{activeSound.label}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs uppercase tracking-wide text-amber-700">
                          {activeSound.meta?.nsfw ? "NSFW" : "SFW"}
                        </div>
                        <Button size="sm" variant="ghost" onClick={handleCloseMetaPanel} className="h-7 px-2">
                          Close
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="font-semibold">Country</div>
                        <div>{activeSound.meta?.country || "—"}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Season / Episode</div>
                        <div>{activeSound.meta?.seasonEpisode || "—"}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Featured</div>
                        <div>{(activeSound.meta?.actors || []).join(", ") || "—"}</div>
                      </div>
                      <div className="md:col-span-3 flex flex-wrap gap-4 mt-1">
                        {activeSound.meta?.showUrl && (
                          <a className="text-blue-700 underline font-semibold" href={activeSound.meta.showUrl} target="_blank" rel="noreferrer">Show Link</a>
                        )}
                        {activeSound.meta?.episodeUrl && (
                          <a className="text-blue-700 underline font-semibold" href={activeSound.meta.episodeUrl} target="_blank" rel="noreferrer">Episode Link</a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isEditMode && (
          <div className="mt-8 text-center text-xs text-muted-foreground">Enter password to enable Edit Mode</div>
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

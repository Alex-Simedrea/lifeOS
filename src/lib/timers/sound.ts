let audioCtx: AudioContext | null = null

export function playTimerEndSound() {
  // WebAudio is the most reliable way to avoid shipping an asset.
  // Note: audio may be blocked until the user interacts with the page.
  try {
    if (typeof window === "undefined") return
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    if (!audioCtx) audioCtx = new Ctx()

    const ctx = audioCtx
    const o = ctx.createOscillator()
    const g = ctx.createGain()

    o.type = "sine"
    o.frequency.value = 880
    g.gain.value = 0.0001

    o.connect(g)
    g.connect(ctx.destination)

    const now = ctx.currentTime
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.2, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)

    o.start(now)
    o.stop(now + 0.26)
  } catch {
    // ignore
  }
}



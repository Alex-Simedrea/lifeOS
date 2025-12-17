export function getOrCreateTabId(storageKey = "lifeos.tabId") {
  if (typeof window === "undefined") return "server"
  try {
    const existing = window.sessionStorage.getItem(storageKey)
    if (existing) return existing
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.sessionStorage.setItem(storageKey, id)
    return id
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}



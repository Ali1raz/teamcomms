"use client"

// Title: Emoji Picker
// Description: Shadcn emoji picker with search, shortcodes, skin tones, frequently used and custom emoji, a category bar, a virtualized grid and 28 data languages.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import type {
  ComponentProps,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
  RefObject,
} from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClockIcon, SmileIcon, UserRoundIcon, LeafIcon, CoffeeIcon, CarIcon, VolleyballIcon, LightbulbIcon, HeartIcon, FlagIcon, SparklesIcon, SmilePlusIcon, SearchIcon, XIcon } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/** 0 is the default yellow; 1 to 5 run from light to dark. */
export type EmojiPickerSkinTone = 0 | 1 | 2 | 3 | 4 | 5

/** The Unicode categories, in their standard order. */
export type EmojiPickerCategory =
  | "smileys"
  | "people"
  | "nature"
  | "food"
  | "travel"
  | "activities"
  | "objects"
  | "symbols"
  | "flags"

export type EmojiPickerEmoji = {
  /** The hexcode of a Unicode emoji, like `1F44D`; the given id of a custom one. */
  id: string
  /** The native emoji at the default tone. Empty for a custom emoji. */
  emoji: string
  /** Lowercase name in the data's language, like `thumbs up`. */
  label: string
  /** Search keywords in the data's language. */
  tags: string[]
  /** Without colons, like `+1` and `thumbsup`. */
  shortcodes: string[]
  /** A category key, or a custom category id. */
  category: string
  /** The Emoji version that added it. 0 for a custom emoji. */
  version: number
  /** The five toned forms, light to dark, when the emoji takes a skin tone. */
  skins?: string[]
  /** The Emoji version that added the tones, when later than the emoji's own. */
  skinVersion?: number
  /** Image URL of a custom emoji. */
  src?: string
}

export type EmojiPickerCustomEmoji = {
  id: string
  label: string
  /** Image URL. A square image of 64px or more stays sharp at every size. */
  src: string
  tags?: string[]
  /** Defaults to the id. The first one makes the value: `:partyparrot:`. */
  shortcodes?: string[]
  /** A `customCategories` id. Defaults to `custom`. */
  category?: string
}

export type EmojiPickerCustomCategory = {
  id: string
  label: string
  /** Tab icon. Defaults to a sparkle. */
  icon?: ReactNode
}

export type EmojiPickerData = {
  locale: string
  emojis: EmojiPickerEmoji[]
  /** Category names in the data's language. */
  categories: Partial<Record<EmojiPickerCategory, string>>
}

/** What a pick hands back. */
export type EmojiPickerSelection = {
  /** The native emoji with the skin tone applied, or `:shortcode:` for a custom emoji. */
  value: string
  emoji: EmojiPickerEmoji
  skinTone: EmojiPickerSkinTone
}

/** One frequently used emoji, by base id. `count` orders the frequent mode. */
export type EmojiPickerRecentEntry = { id: string; count: number }

/** GitHub and Slack (`iamcal`) codes are English only; `emojibase` and `cldr` follow the locale. */
export type EmojiPickerShortcodePreset =
  | "github"
  | "iamcal"
  | "emojibase"
  | "cldr"

export type EmojiPickerSize = "sm" | "default" | "lg"

export type EmojiPickerDataStatus = "idle" | "loading" | "ready" | "error"

export type EmojiPickerLabels = {
  /** The trigger's name while there is no value. */
  trigger: string
  /** Names the popup and an inline panel. */
  panel: string
  /** Search placeholder and name. */
  search: string
  clearSearch: string
  /** Names the grid. */
  list: string
  /** Names the category tabs. */
  categories: string
  /** The recent section under `recentMode="frequent"`. */
  frequent: string
  /** The recent section under `recentMode="recent"`. */
  recent: string
  searchResults: string
  /** Custom emoji with no `customCategories` entry. */
  custom: string
  smileys: string
  people: string
  nature: string
  food: string
  travel: string
  activities: string
  objects: string
  symbols: string
  flags: string
  skinTone: string
  /** Default, then light to dark. */
  skinTones: [string, string, string, string, string, string]
  empty: string
  emptyHint: string
  loading: string
  error: string
  retry: string
  /** The preview while nothing is highlighted. */
  preview: string
}

export type EmojiPickerFunctions = {
  /** Announced after a search. */
  formatResultCount: (count: number) => string
  /** Announced after a pick that keeps the picker open. */
  formatSelected: (label: string) => string
  /** The display name, from the lowercase data label. */
  formatLabel: (label: string) => string
}

export type EmojiPickerI18nConfig = {
  labels: EmojiPickerLabels
  functions: EmojiPickerFunctions
}

/** One level deeper than `Partial`, so a single label can be overridden. */
export type EmojiPickerI18nOverrides = {
  labels?: Partial<EmojiPickerLabels>
  functions?: Partial<EmojiPickerFunctions>
}

export const DEFAULT_EMOJI_PICKER_I18N: EmojiPickerI18nConfig = {
  labels: {
    trigger: "Add emoji",
    panel: "Emoji picker",
    search: "Search emoji",
    clearSearch: "Clear search",
    list: "Emoji",
    categories: "Emoji categories",
    frequent: "Frequently used",
    recent: "Recently used",
    searchResults: "Search results",
    custom: "Custom",
    smileys: "Smileys & emotion",
    people: "People & body",
    nature: "Animals & nature",
    food: "Food & drink",
    travel: "Travel & places",
    activities: "Activities",
    objects: "Objects",
    symbols: "Symbols",
    flags: "Flags",
    skinTone: "Skin tone",
    skinTones: [
      "Default",
      "Light",
      "Medium-light",
      "Medium",
      "Medium-dark",
      "Dark",
    ],
    empty: "No emoji found",
    emptyHint: "Try another word or a shortcode",
    loading: "Loading emoji",
    error: "Couldn't load emoji",
    retry: "Try again",
    preview: "Pick an emoji",
  },
  functions: {
    formatResultCount: (count) =>
      count === 1 ? "1 emoji found" : `${count} emoji found`,
    formatSelected: (label) => `${label} selected`,
    formatLabel: (label) =>
      label.charAt(0).toLocaleUpperCase() + label.slice(1),
  },
}

/** Merges per section, so an override can carry one key without restating the rest. */
export function mergeEmojiPickerI18n(
  overrides?: EmojiPickerI18nOverrides
): EmojiPickerI18nConfig {
  if (!overrides?.labels && !overrides?.functions) {
    return DEFAULT_EMOJI_PICKER_I18N
  }
  return {
    labels: { ...DEFAULT_EMOJI_PICKER_I18N.labels, ...overrides.labels },
    functions: {
      ...DEFAULT_EMOJI_PICKER_I18N.functions,
      ...overrides.functions,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

/** The pinned emojibase-data release fetched by default. An exact version caches for good. */
export const EMOJI_PICKER_DATA_URL =
  "https://cdn.jsdelivr.net/npm/emojibase-data@17.0.0"

export const EMOJI_PICKER_CATEGORIES: EmojiPickerCategory[] = [
  "smileys",
  "people",
  "nature",
  "food",
  "travel",
  "activities",
  "objects",
  "symbols",
  "flags",
]

/* emojibase group numbers. Group 2 holds the bare tone and hair components. */
const GROUPS: Array<EmojiPickerCategory | null> = [
  "smileys",
  "people",
  null,
  "nature",
  "food",
  "travel",
  "activities",
  "objects",
  "symbols",
  "flags",
]

const MESSAGE_GROUPS: Record<string, EmojiPickerCategory> = {
  "smileys-emotion": "smileys",
  "people-body": "people",
  "animals-nature": "nature",
  "food-drink": "food",
  "travel-places": "travel",
  activities: "activities",
  objects: "objects",
  symbols: "symbols",
  flags: "flags",
}

const ENGLISH_ONLY_SHORTCODES = new Set(["github", "iamcal"])

/* The locale lands in a URL path, so only a BCP 47 shape gets through. */
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i

export type EmojiPickerDataOptions = {
  /** An emojibase locale: `en`, `de`, `ja`, `pt`, `zh-hant` and 23 more. */
  locale?: string
  /** Base URL of an emojibase-data copy, for self-hosting or a stricter CSP. */
  url?: string
  shortcodes?: EmojiPickerShortcodePreset | EmojiPickerShortcodePreset[] | false
}

type RawSkin = { emoji?: unknown; tone?: unknown; version?: unknown }
type RawEmoji = {
  label?: unknown
  hexcode?: unknown
  emoji?: unknown
  tags?: unknown
  group?: unknown
  order?: unknown
  version?: unknown
  skins?: unknown
}

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0

const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? [value]
      : []

/**
 * Turns emojibase's `data.json`, `messages.json` and shortcode files into
 * picker data. Entries it cannot read are dropped rather than trusted.
 */
export function normalizeEmojibaseData(
  raw: unknown,
  options: { locale?: string; messages?: unknown; shortcodes?: unknown[] } = {}
): EmojiPickerData {
  if (!Array.isArray(raw)) throw new Error("Unexpected emoji data")
  const locale = options.locale ?? "en"
  const codes = new Map<string, string[]>()
  for (const map of options.shortcodes ?? []) {
    if (!map || typeof map !== "object") continue
    for (const [hexcode, value] of Object.entries(map)) {
      const known = codes.get(hexcode) ?? []
      const added = asStrings(value).filter((code) => !known.includes(code))
      codes.set(hexcode, [...known, ...added])
    }
  }
  const sorted: Array<EmojiPickerEmoji & { order: number }> = []
  for (const item of raw as RawEmoji[]) {
    const category =
      typeof item?.group === "number" ? GROUPS[item.group] : undefined
    if (!category) continue
    if (typeof item.emoji !== "string" || typeof item.hexcode !== "string") {
      continue
    }
    /* Mixed tones in one sequence (two people, two tones) are left out: a
       single tone choice cannot reach them. */
    const skins: string[] = []
    let skinVersion = 0
    for (const skin of (Array.isArray(item.skins)
      ? item.skins
      : []) as RawSkin[]) {
      const tone = skin?.tone
      if (typeof tone !== "number" || tone < 1 || tone > 5) continue
      if (typeof skin.emoji !== "string") continue
      skins[tone - 1] = skin.emoji
      skinVersion = Math.max(skinVersion, asNumber(skin.version))
    }
    const version = asNumber(item.version)
    sorted.push({
      id: item.hexcode,
      emoji: item.emoji,
      label: typeof item.label === "string" ? item.label : "",
      tags: asStrings(item.tags),
      shortcodes: codes.get(item.hexcode) ?? [],
      category,
      version,
      order: asNumber(item.order),
      ...(skins.filter(Boolean).length === 5 && {
        skins,
        ...(skinVersion > version && { skinVersion }),
      }),
    })
  }
  sorted.sort((a, b) => a.order - b.order)
  const emojis = sorted.map(({ order: _order, ...emoji }) => emoji)

  const categories: EmojiPickerData["categories"] = {}
  const groups = (options.messages as { groups?: unknown } | undefined)?.groups
  for (const group of Array.isArray(groups) ? groups : []) {
    const key = MESSAGE_GROUPS[group?.key]
    if (key && typeof group.message === "string" && group.message) {
      categories[key] =
        group.message.charAt(0).toLocaleUpperCase(locale) +
        group.message.slice(1)
    }
  }
  return { locale, emojis, categories }
}

const dataCache = new Map<string, Promise<EmojiPickerData>>()
/* Settled loads, read while rendering so a second picker never flashes a
   loading state for data the page already has. */
const dataReady = new Map<string, EmojiPickerData>()

function presetsOf(shortcodes: EmojiPickerDataOptions["shortcodes"]) {
  return shortcodes === false ? [] : [shortcodes ?? "github"].flat()
}

function dataKey(options: EmojiPickerDataOptions) {
  const presets = presetsOf(options.shortcodes)
  return [
    options.url ?? EMOJI_PICKER_DATA_URL,
    options.locale ?? "en",
    presets.join("+"),
  ].join("|")
}

async function fetchEmojiPickerData(
  options: EmojiPickerDataOptions
): Promise<EmojiPickerData> {
  const locale = options.locale ?? "en"
  if (!LOCALE_PATTERN.test(locale)) {
    throw new Error(`Invalid emoji locale: ${locale}`)
  }
  const base = (options.url ?? EMOJI_PICKER_DATA_URL).replace(/\/+$/, "")
  const json = async (path: string) => {
    const response = await fetch(`${base}/${path}`)
    if (!response.ok) throw new Error(`${response.status} for ${path}`)
    return response.json() as Promise<unknown>
  }
  /* Only the emoji themselves are required; names and codes degrade. */
  const optional = (path: string) => json(path).catch(() => undefined)
  const [raw, messages, ...shortcodes] = await Promise.all([
    json(`${locale}/data.json`),
    optional(`${locale}/messages.json`),
    ...presetsOf(options.shortcodes).map((preset) =>
      optional(
        `${ENGLISH_ONLY_SHORTCODES.has(preset) ? "en" : locale}/shortcodes/${preset}.json`
      )
    ),
  ])
  return normalizeEmojibaseData(raw, { locale, messages, shortcodes })
}

/**
 * Fetches and normalizes emojibase data once per URL, locale and shortcode
 * set; every picker on the page shares the request. A failed load is
 * forgotten, so the next call retries.
 */
export function loadEmojiPickerData(
  options: EmojiPickerDataOptions = {}
): Promise<EmojiPickerData> {
  const key = dataKey(options)
  let pending = dataCache.get(key)
  if (!pending) {
    pending = fetchEmojiPickerData(options).then(
      (data) => {
        dataReady.set(key, data)
        return data
      },
      (error: unknown) => {
        dataCache.delete(key)
        throw error
      }
    )
    dataCache.set(key, pending)
  }
  return pending
}

export type UseEmojiPickerDataOptions = EmojiPickerDataOptions & {
  /** Data already in hand, bundled or loaded on the server. Skips the fetch. */
  data?: EmojiPickerData
  /** Holds the fetch until true. */
  enabled?: boolean
}

export type EmojiPickerDataState = {
  data: EmojiPickerData | null
  status: EmojiPickerDataStatus
  error: unknown
  retry: () => void
}

/** Loads emoji data for a custom surface: a shortcode autocomplete, a reaction bar. */
export function useEmojiPickerData(
  options: UseEmojiPickerDataOptions = {}
): EmojiPickerDataState {
  const { data: provided, enabled = true, locale = "en", url } = options
  /* A string, so an inline array does not refetch every render. */
  const presetKey = presetsOf(options.shortcodes).join("+")
  const key = dataKey({ locale, url, shortcodes: options.shortcodes })
  const [result, setResult] = useState<{
    key: string
    data?: EmojiPickerData
    error?: unknown
  } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const ready = dataReady.get(key)

  useEffect(() => {
    if (provided || !enabled || dataReady.has(key)) return
    let alive = true
    const shortcodes = presetKey
      ? (presetKey.split("+") as EmojiPickerShortcodePreset[])
      : false
    loadEmojiPickerData({ locale, url, shortcodes }).then(
      (data) => alive && setResult({ key, data }),
      (error: unknown) => alive && setResult({ key, error })
    )
    return () => {
      alive = false
    }
  }, [provided, enabled, key, locale, url, presetKey, attempt])

  const current = result?.key === key ? result : null
  const data = provided ?? current?.data ?? ready ?? null
  return {
    data,
    status: data
      ? "ready"
      : current?.error !== undefined
        ? "error"
        : enabled
          ? "loading"
          : "idle",
    error: current?.error,
    retry: () => {
      setResult(null)
      setAttempt((count) => count + 1)
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Support                                  */
/* -------------------------------------------------------------------------- */

/* Apple first, then Firefox's bundled Twemoji (it has flags on Windows, where
   Segoe UI Emoji does not), then Windows and Android. */
const EMOJI_FONT =
  '"Apple Color Emoji", "Twemoji Mozilla", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif'

type EmojiSupport = { version: number; flags: boolean }

const FULL_SUPPORT: EmojiSupport = { version: Infinity, flags: true }
const supportCache = new WeakMap<EmojiPickerEmoji[], EmojiSupport>()
const PROBE = 20

/* A color glyph ignores fillStyle, so red and blue draws match pixel for
   pixel; a missing glyph's box takes the color. A ZWJ sequence the font
   cannot join draws as several glyphs, wider than one. */
function drawsAsEmoji(context: CanvasRenderingContext2D, text: string) {
  const draw = (color: string) => {
    context.clearRect(0, 0, PROBE * 2, PROBE * 2)
    context.fillStyle = color
    context.fillText(text, 0, 0)
    return context.getImageData(0, 0, PROBE * 2, PROBE).data
  }
  const red = draw("#f00")
  const blue = draw("#00f")
  let ink = false
  for (let index = 3; index < red.length; index += 4) {
    if (!red[index] && !blue[index]) continue
    ink = true
    if (
      red[index - 3] !== blue[index - 3] ||
      red[index - 1] !== blue[index - 1]
    ) {
      return false
    }
  }
  return ink && context.measureText(text).width < PROBE * 1.6
}

/**
 * The newest Emoji version this device draws, probed with the first emoji of
 * each version in the data, newest first, plus a flag. A probe that fails
 * even the oldest version is unreliable (blocked or noised canvas), so it
 * reports full support rather than an empty grid.
 */
function detectSupport(emojis: EmojiPickerEmoji[]): EmojiSupport {
  const cached = supportCache.get(emojis)
  if (cached) return cached
  let support = FULL_SUPPORT
  const canvas =
    typeof document === "undefined" ? null : document.createElement("canvas")
  canvas?.setAttribute("width", String(PROBE * 2))
  canvas?.setAttribute("height", String(PROBE * 2))
  const context = canvas?.getContext("2d", { willReadFrequently: true })
  if (context) {
    context.font = `${PROBE}px ${EMOJI_FONT}`
    context.textBaseline = "top"
    const samples = new Map<number, string>()
    for (const emoji of emojis) {
      if (emoji.src || isRegionalFlag(emoji.emoji)) continue
      if (!samples.has(emoji.version)) samples.set(emoji.version, emoji.emoji)
    }
    const versions = [...samples.keys()].sort((a, b) => b - a)
    const found = versions.find((version) =>
      drawsAsEmoji(context, samples.get(version) as string)
    )
    if (found !== undefined) {
      support = {
        version: found === versions[0] ? Infinity : found,
        flags: drawsAsEmoji(context, "\u{1F1EA}\u{1F1FA}"),
      }
    }
  }
  supportCache.set(emojis, support)
  return support
}

/* Country flags (two regional indicators) and subdivision flags (black flag
   plus tag characters): what Windows draws as letters. */
function isRegionalFlag(text: string) {
  return /^(?:[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0060}-\u{E007F}]+)$/u.test(
    text
  )
}

const subscribeNothing = () => () => {}

/* Read through an external store: the server and the hydrating client both
   see full support, then the client re-renders once with what it can draw. */
function useEmojiSupport(
  data: EmojiPickerData | null,
  setting: number | "auto"
): EmojiSupport {
  const detected = useSyncExternalStore(
    subscribeNothing,
    () =>
      setting === "auto" && data ? detectSupport(data.emojis) : FULL_SUPPORT,
    () => FULL_SUPPORT
  )
  /* One identity per setting: a fresh object each render would re-filter the
     whole data set on every hover. */
  return useMemo(
    () => (setting === "auto" ? detected : { version: setting, flags: true }),
    [setting, detected]
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Search                                   */
/* -------------------------------------------------------------------------- */

/* Accents drop, and hiragana reads as katakana, so ねこ finds ネコ. */
const fold = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\u3041-\u3096]/g, (kana) =>
      String.fromCharCode(kana.charCodeAt(0) + 0x60)
    )

type SearchIndex = {
  label: string
  words: string[]
  tags: string[]
  shortcodes: string[]
}

const searchIndexCache = new WeakMap<EmojiPickerEmoji, SearchIndex>()

function searchIndexOf(emoji: EmojiPickerEmoji) {
  let index = searchIndexCache.get(emoji)
  if (!index) {
    const label = fold(emoji.label)
    index = {
      label,
      words: label.split(/[\s:,-]+/).filter(Boolean),
      tags: emoji.tags.map(fold),
      shortcodes: emoji.shortcodes.map(fold),
    }
    searchIndexCache.set(emoji, index)
  }
  return index
}

/* Best field match for one term: exact beats a prefix beats a substring, and
   a name or shortcode beats a keyword. */
function scoreTerm(index: SearchIndex, term: string) {
  let best = 0
  const take = (score: number) => {
    if (score > best) best = score
  }
  if (index.label === term) take(100)
  for (const code of index.shortcodes) {
    if (code === term) take(100)
    else if (code.startsWith(term)) take(80)
    else if (code.includes(term)) take(30)
  }
  if (index.label.startsWith(term)) take(75)
  for (const word of index.words) if (word.startsWith(term)) take(70)
  for (const tag of index.tags) {
    if (tag === term) take(60)
    else if (tag.startsWith(term)) take(50)
    else if (tag.includes(term)) take(20)
  }
  if (best === 0 && index.label.includes(term)) take(35)
  return best
}

/**
 * Ranks emoji against a query. Every word must match the name, a keyword or
 * a shortcode; colons around a shortcode are ignored, so `:thumbsup:` works.
 * Ties keep the input order.
 */
export function searchEmojis(
  emojis: EmojiPickerEmoji[],
  query: string,
  options: { limit?: number } = {}
): EmojiPickerEmoji[] {
  const terms = fold(query).replace(/:/g, " ").split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  const exact = query.trim()
  const scored: Array<{ emoji: EmojiPickerEmoji; score: number; at: number }> =
    []
  emojis.forEach((emoji, at) => {
    if (exact && isEmojiValue(emoji, exact)) {
      scored.push({ emoji, score: 1000, at })
      return
    }
    const index = searchIndexOf(emoji)
    let score = 0
    for (const term of terms) {
      const termScore = scoreTerm(index, term)
      if (termScore === 0) return
      score += termScore
    }
    scored.push({ emoji, score, at })
  })
  scored.sort((a, b) => b.score - a.score || a.at - b.at)
  const ranked = scored.map((entry) => entry.emoji)
  return options.limit === undefined ? ranked : ranked.slice(0, options.limit)
}

/** The value a pick stores: the toned native emoji, or `:shortcode:` for a custom one. */
export function getEmojiValue(
  emoji: EmojiPickerEmoji,
  skinTone: EmojiPickerSkinTone = 0
): string {
  if (emoji.src) return `:${emoji.shortcodes[0] ?? emoji.id}:`
  return (skinTone > 0 && emoji.skins?.[skinTone - 1]) || emoji.emoji
}

/* emojibase writes the fully qualified form (thumbs up with VS16), while
   stored text and older data often carry the bare one, so values compare
   without the selector. */
const bare = (text: string) => text.replace(/\uFE0F/g, "")

/** Whether a stored value is this emoji: any tone, with or without VS16. */
export function isEmojiValue(emoji: EmojiPickerEmoji, value: string) {
  const target = bare(value)
  return (
    bare(getEmojiValue(emoji)) === target ||
    !!emoji.skins?.some((skin) => bare(skin) === target)
  )
}

/** Finds the emoji a value came from, any tone, or a custom emoji's `:shortcode:`. */
export function findEmoji(
  emojis: EmojiPickerEmoji[],
  value: string | null | undefined
): EmojiPickerEmoji | undefined {
  if (!value) return undefined
  return emojis.find((emoji) => isEmojiValue(emoji, value))
}

/* -------------------------------------------------------------------------- */
/*                                   Storage                                  */
/* -------------------------------------------------------------------------- */

const storageListeners = new Map<string, Set<() => void>>()
/* Writes storage refused (private mode, quota, a blocked origin), kept for
   this page so the picker still remembers within the visit. */
const storageMemory = new Map<string, string>()

function readStored(key: string): string | null {
  if (storageMemory.has(key)) return storageMemory.get(key) as string
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
    storageMemory.delete(key)
  } catch {
    storageMemory.set(key, value)
  }
  storageListeners.get(key)?.forEach((listener) => listener())
}

function subscribeStored(key: string, listener: () => void) {
  let listeners = storageListeners.get(key)
  if (!listeners) {
    listeners = new Set()
    storageListeners.set(key, listeners)
  }
  listeners.add(listener)
  /* Another tab's write: drop this tab's copy and re-read. */
  const onStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return
    storageMemory.delete(key)
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/* One stored string, shared live by every picker and tab using the key. The
   server renders nothing stored, so markup never depends on the visitor. */
function useStored(key: string | null) {
  const subscribe = useCallback(
    (listener: () => void) => (key ? subscribeStored(key, listener) : () => {}),
    [key]
  )
  return useSyncExternalStore(
    subscribe,
    () => (key ? readStored(key) : null),
    () => null
  )
}

function parseRecent(raw: string | null): EmojiPickerRecentEntry[] | null {
  if (!raw) return null
  try {
    const list: unknown = JSON.parse(raw)
    if (!Array.isArray(list)) return null
    return list.flatMap((entry) =>
      entry && typeof entry.id === "string"
        ? [{ id: entry.id, count: Math.max(1, asNumber(entry.count)) }]
        : []
    )
  } catch {
    return null
  }
}

function parseTone(raw: string | null): EmojiPickerSkinTone | null {
  const tone = Number(raw)
  return raw !== null && Number.isInteger(tone) && tone >= 0 && tone <= 5
    ? (tone as EmojiPickerSkinTone)
    : null
}

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

/* The panel's padding: the search, the tabs, the section names, the first
   column of glyphs and the preview all start this far in, as the shadcn
   Command lines up its input, headings and items. */
const PADDING = 8

/* Pixel geometry the virtual grid computes with. Cells and headers are
   fixed-height on purpose: a measured row would cost a layout pass per row.
   Glyphs fill a bit over half their cell, so a dense grid still scans. The
   gutter is what is left of the padding once a cell's own slack is counted,
   so a hovered cell reaches past the padding the way a menu item does. */
const sizeOf = (cell: number, emoji: number, header: number) => ({
  cell,
  emoji,
  header,
  gutter: PADDING - (cell - emoji) / 2,
})

type SizeTokens = ReturnType<typeof sizeOf>

const SIZES: Record<EmojiPickerSize, SizeTokens> = {
  sm: sizeOf(26, 16, 28),
  default: sizeOf(30, 20, 28),
  lg: sizeOf(38, 26, 32),
}

const VISIBLE_ROWS = 7
const OVERSCAN = 4
const RECENT_CAP = 48
/* jsdom and an unmeasured first frame report 0; this keeps the window sane. */
const FALLBACK_HEIGHT = 320

type Section = {
  id: string
  label: string
  emojis: EmojiPickerEmoji[]
  icon: ReactNode
}

type LayoutSection = {
  section: Section
  top: number
  height: number
  firstRow: number
}

type LayoutRow = { section: number; top: number; cells: EmojiPickerEmoji[] }

type Layout = {
  sections: LayoutSection[]
  rows: LayoutRow[]
  height: number
  positions: Map<string, { row: number; col: number }>
}

const cellKey = (section: string, id: string) => `${section}\u0000${id}`

function buildLayout(
  sections: Section[],
  columns: number,
  size: SizeTokens
): Layout {
  const layoutSections: LayoutSection[] = []
  const rows: LayoutRow[] = []
  const positions = new Map<string, { row: number; col: number }>()
  let top = 0
  sections.forEach((section, index) => {
    const firstRow = rows.length
    const count = Math.ceil(section.emojis.length / columns)
    for (let row = 0; row < count; row++) {
      const cells = section.emojis.slice(row * columns, (row + 1) * columns)
      cells.forEach((emoji, col) =>
        positions.set(cellKey(section.id, emoji.id), { row: rows.length, col })
      )
      rows.push({
        section: index,
        top: top + size.header + row * size.cell,
        cells,
      })
    }
    const height = size.header + count * size.cell
    layoutSections.push({ section, top, height, firstRow })
    top += height
  })
  return {
    sections: layoutSections,
    rows,
    height: top + size.gutter,
    positions,
  }
}

/* The last item whose top is at or above `offset`. */
function indexAt(items: Array<{ top: number }>, offset: number) {
  let low = 0
  let high = items.length - 1
  let found = 0
  while (low <= high) {
    const middle = (low + high) >> 1
    if (items[middle].top <= offset) {
      found = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return found
}

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

const CATEGORY_ICONS: Record<string, ReactNode> = {
  recent: (
    <ClockIcon aria-hidden="true" />
  ),
  smileys: (
    <SmileIcon aria-hidden="true" />
  ),
  people: (
    <UserRoundIcon aria-hidden="true" />
  ),
  nature: (
    <LeafIcon aria-hidden="true" />
  ),
  food: (
    <CoffeeIcon aria-hidden="true" />
  ),
  travel: (
    <CarIcon aria-hidden="true" />
  ),
  activities: (
    <VolleyballIcon aria-hidden="true" />
  ),
  objects: (
    <LightbulbIcon aria-hidden="true" />
  ),
  symbols: (
    <HeartIcon aria-hidden="true" />
  ),
  flags: (
    <FlagIcon aria-hidden="true" />
  ),
  custom: (
    <SparklesIcon aria-hidden="true" />
  ),
}

const TRIGGER_ICON = (
  <SmilePlusIcon aria-hidden="true" />
)

const SEARCH_ICON = (
  <SearchIcon aria-hidden="true" />
)

const CLEAR_ICON = (
  <XIcon aria-hidden="true" />
)

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

type ActiveCell = {
  section: string
  id: string
  /* Arrow keys scroll the cell into view and keep Left and Right in the
     grid; a hovered cell does neither. */
  source: "keyboard" | "pointer"
}

type Move =
  | "next"
  | "prev"
  | "up"
  | "down"
  | "pageUp"
  | "pageDown"
  | "first"
  | "last"
  | "visible"

type EmojiPickerContextValue = {
  id: string
  listId: string
  data: EmojiPickerData | null
  status: EmojiPickerDataStatus
  retry: () => void
  requestData: () => void
  emojis: EmojiPickerEmoji[]
  i18n: EmojiPickerI18nConfig
  size: SizeTokens
  columns: number | "auto"
  columnCount: number
  setMeasuredColumns: (columns: number) => void
  query: string
  setQuery: (query: string) => void
  skinTone: EmojiPickerSkinTone
  setSkinTone: (tone: EmojiPickerSkinTone) => void
  /** The tabs: every category with emoji, whatever the query. */
  tabs: Section[]
  /** Disabled stand-ins until the data lands, so the row does not jump. */
  placeholderTabs: Section[]
  /** What the grid shows: the tabs, or the search results. */
  layout: Layout
  active: ActiveCell | null
  activePosition: { row: number; col: number } | undefined
  activeEmoji: EmojiPickerEmoji | null
  setActive: (cell: ActiveCell | null) => void
  activeSection: string | null
  setActiveSection: (id: string | null) => void
  jump: string | null
  setJump: (id: string | null) => void
  jumpTo: (id: string) => void
  setPageRows: (rows: number) => void
  navigate: (
    event: ReactKeyboardEvent<HTMLElement>,
    fromSearch: boolean
  ) => void
  move: (to: Move) => void
  /** A scroll the keyboard did not make hands the highlight to the pointer. */
  releaseKeyboard: () => void
  /** The search or the grid holds focus, so a keyboard highlight shows. */
  focused: boolean
  setFocused: (focused: boolean) => void
  pick: (emoji: EmojiPickerEmoji, event?: { shiftKey?: boolean }) => void
  clear: () => void
  isSelected: (emoji: EmojiPickerEmoji) => boolean
  /** True when `max` is reached: unselected cells refuse a pick. */
  full: boolean
  valueMode: boolean
  multiple: boolean
  values: string[]
  findByValue: (value: string) => EmojiPickerEmoji | undefined
  renderEmoji?: (emoji: EmojiPickerEmoji, value: string) => ReactNode
  announcement: string
  disabled: boolean
  invalid: boolean
  label: string | undefined
  labelledBy: string | undefined
  describedBy: string | undefined
  open: boolean
  setOpen: (open: boolean) => void
  hasSearch: boolean
  setHasSearch: (present: boolean) => void
  searchRef: RefObject<HTMLInputElement | null>
  listRef: RefObject<HTMLDivElement | null>
  registerFocusTarget: (node: HTMLElement | null) => void
}

const EmojiPickerContext = createContext<EmojiPickerContextValue | null>(null)

/** "inline" unless a part renders inside `EmojiPickerContent`. */
const SurfaceContext = createContext<"inline" | "popup">("inline")

function useEmojiPickerContext(part: string) {
  const context = useContext(EmojiPickerContext)
  if (!context) throw new Error(`${part} must be used within an EmojiPicker`)
  return context
}

export type EmojiPickerApi = {
  data: EmojiPickerData | null
  status: EmojiPickerDataStatus
  retry: () => void
  /** The emoji the grid can show: custom ones, then the data after version, flag and `filter` checks. */
  emojis: EmojiPickerEmoji[]
  query: string
  setQuery: (query: string) => void
  skinTone: EmojiPickerSkinTone
  setSkinTone: (tone: EmojiPickerSkinTone) => void
  /** The highlighted emoji: hovered, or reached with the arrow keys. */
  activeEmoji: EmojiPickerEmoji | null
  /** Single mode: the value, or `null`. Multiple mode: the first value. */
  value: string | null
  values: string[]
  /** The recent section's emoji, in display order. */
  recent: EmojiPickerEmoji[]
  /** Same as clicking the emoji's cell. */
  select: (emoji: EmojiPickerEmoji) => void
  /** Empties the value. */
  clear: () => void
  open: boolean
  setOpen: (open: boolean) => void
}

/* -------------------------------------------------------------------------- */
/*                                    Root                                    */
/* -------------------------------------------------------------------------- */

type EmojiPickerSingleProps = {
  multiple?: false
  /** Controlled value: a native emoji, or `:shortcode:` for a custom one. `null` is empty. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  max?: never
}

type EmojiPickerMultipleProps = {
  /** Picks toggle in and out of a list of values, and the picker stays open. */
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** The most values a person can pick; cells refuse further picks at the cap. */
  max?: number
}

export type EmojiPickerProps = (
  | EmojiPickerSingleProps
  | EmojiPickerMultipleProps
) & {
  /** Fires on every pick, with the toned value and the emoji. The insert-into-text hook. */
  onEmojiSelect?: (selection: EmojiPickerSelection) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Closes the popover after a pick. Defaults to true, false with `multiple`. Shift+click keeps it open either way. */
  closeOnSelect?: boolean
  /** Data already in hand (bundled, or loaded on the server). Skips the fetch. */
  data?: EmojiPickerData
  /** An emojibase locale: names, keywords and category labels in that language. */
  locale?: string
  /** Base URL of a self-hosted emojibase-data copy. */
  dataUrl?: string
  /** Shortcode sets searched and shown. `false` skips the request. */
  shortcodes?: EmojiPickerShortcodePreset | EmojiPickerShortcodePreset[] | false
  /** Hides emoji newer than this Emoji version. `"auto"` probes what the device draws, flags included. */
  emojiVersion?: number | "auto"
  /** Which sections show, in order: `recent`, custom category ids and category keys. Search still covers every emoji `filter` and `emojiVersion` keep; use `filter` to remove emoji entirely. */
  categories?: string[]
  /** Drops emoji. Pass a stable function; it runs per emoji. */
  filter?: (emoji: EmojiPickerEmoji) => boolean
  customEmojis?: EmojiPickerCustomEmoji[]
  customCategories?: EmojiPickerCustomCategory[]
  /** Orders the recent section by use count, or by last use. */
  recentMode?: "frequent" | "recent"
  /** How many recent emoji show. Defaults to 2 rows; 0 hides the section. */
  recentLimit?: number
  /** Controlled recent list, for syncing it to an account. */
  recent?: EmojiPickerRecentEntry[]
  defaultRecent?: EmojiPickerRecentEntry[]
  onRecentChange?: (recent: EmojiPickerRecentEntry[]) => void
  /** localStorage key for the recent list; `null` keeps it in memory. */
  recentStorageKey?: string | null
  skinTone?: EmojiPickerSkinTone
  defaultSkinTone?: EmojiPickerSkinTone
  onSkinToneChange?: (tone: EmojiPickerSkinTone) => void
  /** localStorage key for the skin tone; `null` keeps it in memory. */
  skinToneStorageKey?: string | null
  /** Controlled search text. */
  query?: string
  onQueryChange?: (query: string) => void
  size?: EmojiPickerSize
  /** Cells per row. `"auto"` fills the panel's width. */
  columns?: number | "auto"
  /** Draws an emoji: an image set, a sprite, a brand font. */
  renderEmoji?: (emoji: EmojiPickerEmoji, value: string) => ReactNode
  disabled?: boolean
  invalid?: boolean
  /** Submits the value with a native form; multiple values are comma-joined. */
  name?: string
  form?: string
  required?: boolean
  /** The hidden form field, for form libraries that focus a field on error. */
  inputRef?: Ref<HTMLInputElement>
  /** Lands on the trigger. */
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  i18n?: EmojiPickerI18nOverrides
  /** Without children the picker renders a trigger and a popover; this reaches the trigger. */
  className?: string
  children?: ReactNode
}

const EMPTY_RECENT: EmojiPickerRecentEntry[] = []

const toValues = (value: string | string[] | null | undefined) =>
  Array.isArray(value) ? value : value ? [value] : []

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) ref.current = node
}

function normalizeCustom(emoji: EmojiPickerCustomEmoji): EmojiPickerEmoji {
  return {
    id: emoji.id,
    emoji: "",
    label: emoji.label,
    tags: emoji.tags ?? [],
    shortcodes: emoji.shortcodes?.length ? emoji.shortcodes : [emoji.id],
    category: emoji.category ?? "custom",
    version: 0,
    src: emoji.src,
  }
}

export function EmojiPicker(props: EmojiPickerProps) {
  const {
    onEmojiSelect,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    data: dataProp,
    locale = "en",
    dataUrl,
    shortcodes = "github",
    emojiVersion = "auto",
    categories,
    filter,
    customEmojis,
    customCategories,
    recentMode = "frequent",
    recentLimit,
    recent: recentProp,
    defaultRecent,
    onRecentChange,
    recentStorageKey = "reui-emoji-picker-recent",
    skinTone: skinToneProp,
    defaultSkinTone = 0,
    onSkinToneChange,
    skinToneStorageKey = "reui-emoji-picker-skin-tone",
    query: queryProp,
    onQueryChange,
    size = "default",
    columns = 8,
    renderEmoji,
    disabled = false,
    invalid = false,
    name,
    form,
    required = false,
    inputRef,
    id: idProp,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    i18n: i18nProp,
    className,
    children,
  } = props
  const multiple = props.multiple === true
  const max = props.multiple ? props.max : undefined
  const closeOnSelect = props.closeOnSelect ?? !multiple
  const generatedId = useId()
  const id = idProp ?? generatedId
  const listId = `${id}-list`
  const tokens = SIZES[size]

  const [uncontrolled, setUncontrolled] = useState(() =>
    toValues(props.defaultValue)
  )
  /* What a form reset restores, as a native field returns to its default. */
  const [initialValues] = useState(uncontrolled)
  const values =
    props.value !== undefined ? toValues(props.value) : uncontrolled
  const valueMode =
    props.value !== undefined ||
    props.defaultValue !== undefined ||
    multiple ||
    !!name

  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const [queryState, setQueryState] = useState("")
  const query = queryProp ?? queryState
  const [active, setActive] = useState<ActiveCell | null>(null)
  const [focused, setFocused] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [jump, setJump] = useState<string | null>(null)
  const [measuredColumns, setMeasuredColumns] = useState<number | null>(null)
  const [hasSearch, setHasSearch] = useState(false)
  const [wanted, setWanted] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  /* Every open and close starts the grid over: no stale search, no stale highlight. */
  const [seenOpen, setSeenOpen] = useState(open)
  /* The recent list as it was before this session's first pick. The section
     shows it until the next open (an inline panel, the next mount), so a pick
     never inserts a section and moves the grid under the pointer. */
  const [pinnedRecent, setPinnedRecent] = useState<
    EmojiPickerRecentEntry[] | null
  >(null)
  if (seenOpen !== open) {
    setSeenOpen(open)
    setQueryState("")
    setActive(null)
    setFocused(false)
    setJump(null)
    setAnnouncement("")
    setPinnedRecent(null)
  }
  /* A language switch drops the last announcement, so the live region never
     holds text in the previous language. */
  const [seenLocale, setSeenLocale] = useState(locale)
  if (seenLocale !== locale) {
    setSeenLocale(locale)
    setAnnouncement("")
  }
  const searchRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const focusTarget = useRef<HTMLElement | null>(null)
  const fieldRef = useRef<HTMLInputElement | null>(null)
  const resetRef = useRef(() => {})
  const pageRows = useRef(VISIBLE_ROWS)
  /* The column Up and Down aim for, kept across a shorter row. */
  const goalColumn = useRef<number | null>(null)

  const requestData = useCallback(() => setWanted(true), [])
  const { data, status, retry } = useEmojiPickerData({
    data: dataProp,
    locale,
    url: dataUrl,
    shortcodes,
    enabled: wanted || open,
  })
  const support = useEmojiSupport(data, emojiVersion)
  const i18n = useMemo(() => mergeEmojiPickerI18n(i18nProp), [i18nProp])
  const { labels } = i18n
  const columnCount =
    columns === "auto" ? (measuredColumns ?? 8) : Math.max(1, columns)

  const unicode = useMemo(() => {
    if (!data) return []
    return data.emojis.flatMap((emoji) => {
      if (emoji.version > support.version) return []
      if (!support.flags && isRegionalFlag(emoji.emoji)) return []
      if (filter && !filter(emoji)) return []
      return emoji.skins && (emoji.skinVersion ?? 0) > support.version
        ? [{ ...emoji, skins: undefined, skinVersion: undefined }]
        : [emoji]
    })
  }, [data, support, filter])
  const custom = useMemo(
    () =>
      (customEmojis ?? [])
        .map(normalizeCustom)
        .filter((emoji) => !filter || filter(emoji)),
    [customEmojis, filter]
  )
  const all = useMemo(() => [...custom, ...unicode], [custom, unicode])
  const byId = useMemo(
    () => new Map(all.map((emoji) => [emoji.id, emoji])),
    [all]
  )
  /* Every value the data can produce, filtered or not, for display. */
  const byValue = useMemo(() => {
    const map = new Map<string, EmojiPickerEmoji>()
    for (const emoji of [...custom, ...(data?.emojis ?? [])]) {
      map.set(bare(getEmojiValue(emoji)), emoji)
      emoji.skins?.forEach((skin) => map.set(bare(skin), emoji))
    }
    return map
  }, [custom, data])

  const storedRecent = useStored(
    recentProp === undefined ? recentStorageKey : null
  )
  const parsedRecent = useMemo(() => parseRecent(storedRecent), [storedRecent])
  const [memoryRecent, setMemoryRecent] = useState(
    defaultRecent ?? EMPTY_RECENT
  )
  const recentEntries =
    recentProp ??
    (recentStorageKey
      ? (parsedRecent ?? defaultRecent ?? EMPTY_RECENT)
      : memoryRecent)
  const shownRecent = recentLimit ?? columnCount * 2
  const shownEntries = pinnedRecent ?? recentEntries
  const recent = useMemo(() => {
    const ordered =
      recentMode === "frequent"
        ? [...shownEntries].sort((a, b) => b.count - a.count)
        : shownEntries
    return ordered
      .flatMap((entry) => byId.get(entry.id) ?? [])
      .slice(0, shownRecent)
  }, [shownEntries, recentMode, byId, shownRecent])

  const storedTone = useStored(
    skinToneProp === undefined ? skinToneStorageKey : null
  )
  const [memoryTone, setMemoryTone] = useState(defaultSkinTone)
  const skinTone =
    skinToneProp ??
    (skinToneStorageKey
      ? (parseTone(storedTone) ?? defaultSkinTone)
      : memoryTone)

  const tabs = useMemo(() => {
    const customIds = [
      ...new Set([
        ...(customCategories ?? []).map((category) => category.id),
        ...custom.map((emoji) => emoji.category),
      ]),
    ]
    const order = categories ?? [
      "recent",
      ...customIds,
      ...EMOJI_PICKER_CATEGORIES,
    ]
    const grouped = new Map<string, EmojiPickerEmoji[]>()
    for (const emoji of all) {
      const list = grouped.get(emoji.category)
      if (list) list.push(emoji)
      else grouped.set(emoji.category, [emoji])
    }
    const sections: Section[] = []
    for (const key of new Set(order)) {
      const emojis = key === "recent" ? recent : grouped.get(key)
      if (!emojis?.length) continue
      const customCategory = customCategories?.find((item) => item.id === key)
      sections.push({
        id: key,
        label:
          key === "recent"
            ? labels[recentMode]
            : (customCategory?.label ??
              categoryLabel(key, labels, i18nProp, data) ??
              labels.custom),
        emojis,
        icon:
          customCategory?.icon ?? CATEGORY_ICONS[key] ?? CATEGORY_ICONS.custom,
      })
    }
    return sections
  }, [
    all,
    recent,
    categories,
    customCategories,
    custom,
    labels,
    recentMode,
    i18nProp,
    data,
  ])

  const placeholderTabs = useMemo(
    () =>
      (categories ?? EMOJI_PICKER_CATEGORIES).flatMap((key) =>
        (EMOJI_PICKER_CATEGORIES as string[]).includes(key)
          ? [
              {
                id: key,
                label: labels[key as EmojiPickerCategory],
                emojis: [],
                icon: CATEGORY_ICONS[key],
              },
            ]
          : []
      ),
    [categories, labels]
  )

  const results = useMemo(
    () => (query.trim() ? searchEmojis(all, query) : null),
    [all, query]
  )
  const sections = useMemo<Section[]>(
    () =>
      results
        ? results.length
          ? [
              {
                id: "search",
                label: labels.searchResults,
                emojis: results,
                icon: null,
              },
            ]
          : []
        : tabs,
    [results, tabs, labels]
  )
  const layout = useMemo(
    () => buildLayout(sections, columnCount, tokens),
    [sections, columnCount, tokens]
  )

  /* With a query and nothing chosen yet, the first result is highlighted, so
     Enter picks the best match. */
  let activePosition = active
    ? layout.positions.get(cellKey(active.section, active.id))
    : undefined
  if (!activePosition && results && layout.rows.length) {
    activePosition = { row: 0, col: 0 }
  }
  const activeEmoji = activePosition
    ? layout.rows[activePosition.row].cells[activePosition.col]
    : null

  const selected = useMemo(() => new Set(values.map(bare)), [values])
  const isSelected = (emoji: EmojiPickerEmoji) =>
    selected.has(bare(getEmojiValue(emoji))) ||
    !!emoji.skins?.some((skin) => selected.has(bare(skin)))
  const full = multiple && max !== undefined && values.length >= max

  const setOpen = (next: boolean) => {
    if (next && disabled) return
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }

  const setQuery = (next: string) => {
    if (queryProp === undefined) setQueryState(next)
    onQueryChange?.(next)
    setActive(null)
    setAnnouncement("")
  }

  const setSkinTone = (tone: EmojiPickerSkinTone) => {
    if (skinToneProp === undefined) {
      if (skinToneStorageKey) writeStored(skinToneStorageKey, String(tone))
      else setMemoryTone(tone)
    }
    onSkinToneChange?.(tone)
  }

  const commitValues = (next: string[]) => {
    if (
      next.length === values.length &&
      next.every((v, i) => v === values[i])
    ) {
      return
    }
    if (props.value === undefined) setUncontrolled(next)
    if (props.multiple) props.onValueChange?.(next)
    else props.onValueChange?.(next[0] ?? null)
  }

  const recordRecent = (emojiId: string) => {
    if (pinnedRecent === null) setPinnedRecent(recentEntries)
    const previous = recentEntries.find((entry) => entry.id === emojiId)
    const next = [
      { id: emojiId, count: (previous?.count ?? 0) + 1 },
      ...recentEntries.filter((entry) => entry.id !== emojiId),
    ].slice(0, RECENT_CAP)
    if (recentProp === undefined) {
      if (recentStorageKey) writeStored(recentStorageKey, JSON.stringify(next))
      else setMemoryRecent(next)
    }
    onRecentChange?.(next)
  }

  const pick = (emoji: EmojiPickerEmoji, event?: { shiftKey?: boolean }) => {
    if (disabled) return
    const tone = emoji.skins ? skinTone : 0
    const value = getEmojiValue(emoji, tone)
    if (multiple && isSelected(emoji)) {
      commitValues(values.filter((item) => !isEmojiValue(emoji, item)))
      return
    }
    if (full) return
    commitValues(multiple ? [...values, value] : [value])
    onEmojiSelect?.({ value, emoji, skinTone: tone })
    recordRecent(emoji.id)
    const close = closeOnSelect && !event?.shiftKey && open
    if (close) setOpen(false)
    else
      setAnnouncement(
        i18n.functions.formatSelected(i18n.functions.formatLabel(emoji.label))
      )
  }

  const move = (to: Move) => {
    const { rows } = layout
    if (rows.length === 0) return
    const at = activePosition
    let row = 0
    let col = 0
    /* With nothing highlighted, the keyboard starts at the first row in view
       under the sticky header, so it picks up after a category jump. */
    if (!at && to !== "first" && to !== "last") to = "visible"
    if (to === "visible") {
      const offset = (listRef.current?.scrollTop ?? 0) + tokens.header - 1
      row = indexAt(rows, offset)
      if (rows[row].top < offset && row + 1 < rows.length) row++
      goalColumn.current = null
    } else if (at && to !== "first" && to !== "last") {
      row = at.row
      col = at.col
      const vertical =
        to === "up" || to === "down" || to === "pageUp" || to === "pageDown"
      if (vertical) col = goalColumn.current ?? col
      if (to === "next") {
        if (col + 1 < rows[row].cells.length) col++
        else if (row + 1 < rows.length) [row, col] = [row + 1, 0]
      } else if (to === "prev") {
        if (col > 0) col--
        else if (row > 0) [row, col] = [row - 1, rows[row - 1].cells.length - 1]
      } else if (to === "down") row = Math.min(row + 1, rows.length - 1)
      else if (to === "pageDown")
        row = Math.min(row + pageRows.current, rows.length - 1)
      else if (to === "pageUp") row = Math.max(row - pageRows.current, 0)
      else if (to === "up") {
        /* Up from the top row hands the arrows back to the search caret. */
        if (row === 0 && !results) {
          setActive(null)
          return
        }
        row = Math.max(row - 1, 0)
      }
      goalColumn.current = vertical ? col : null
      col = Math.min(col, rows[row].cells.length - 1)
    } else if (to === "last") {
      row = rows.length - 1
      col = rows[row].cells.length - 1
      goalColumn.current = null
    } else {
      goalColumn.current = null
    }
    const cell = rows[row].cells[col]
    setActive({
      section: layout.sections[rows[row].section].section.id,
      id: cell.id,
      source: "keyboard",
    })
  }

  const navigate = (
    event: ReactKeyboardEvent<HTMLElement>,
    fromSearch: boolean
  ) => {
    if (
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return
    /* Left and Right belong to the caret until the arrows enter the grid. */
    const inGrid = !fromSearch || active?.source === "keyboard"
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const run = (to: Move) => {
      event.preventDefault()
      move(to)
    }
    switch (event.key) {
      case "ArrowDown":
        return run(activePosition ? "down" : "visible")
      case "ArrowUp":
        if (activePosition) return run("up")
        return fromSearch ? undefined : run("visible")
      case "ArrowRight":
      case "ArrowLeft":
        if (!inGrid) return
        return run((event.key === "ArrowRight") !== rtl ? "next" : "prev")
      case "PageDown":
        return run("pageDown")
      case "PageUp":
        return run("pageUp")
      case "Home":
      case "End":
        if (fromSearch) return
        return run(event.key === "Home" ? "first" : "last")
      case "Enter":
      case " ":
        if (event.key === " " && fromSearch) return
        if (!activeEmoji) return
        event.preventDefault()
        return pick(activeEmoji, event)
    }
  }

  const context: EmojiPickerContextValue = {
    id,
    listId,
    data,
    status,
    retry,
    requestData,
    emojis: all,
    i18n,
    size: tokens,
    columns,
    columnCount,
    setMeasuredColumns,
    query,
    setQuery,
    skinTone,
    setSkinTone,
    tabs,
    placeholderTabs,
    layout,
    active,
    activePosition,
    activeEmoji,
    setActive: (cell) => {
      goalColumn.current = null
      setActive(cell)
    },
    activeSection,
    setActiveSection,
    jump,
    setJump,
    jumpTo: (sectionId) => {
      if (results) setQuery("")
      setActive(null)
      setJump(sectionId)
    },
    setPageRows: (rows) => {
      pageRows.current = rows
    },
    navigate,
    move,
    releaseKeyboard: () =>
      setActive((current) =>
        current?.source === "keyboard"
          ? { ...current, source: "pointer" }
          : current
      ),
    focused,
    setFocused,
    pick,
    clear: () => commitValues([]),
    isSelected,
    full,
    valueMode,
    multiple,
    values,
    findByValue: (value) => byValue.get(bare(value)),
    renderEmoji,
    announcement,
    disabled,
    invalid,
    label,
    labelledBy,
    describedBy,
    open,
    setOpen,
    hasSearch,
    setHasSearch,
    searchRef,
    listRef,
    registerFocusTarget: (node) => {
      if (node) focusTarget.current = node
    },
  }

  useEffect(() => {
    resetRef.current = () => commitValues(initialValues)
  })

  /* Listens on the field's own root and asks for its form at reset time, so a
     `form` attribute is honoured. The restore waits a task, like a native
     reset's default action, because any listener may still cancel it. */
  const hasField = !!name || required
  useEffect(() => {
    const root = fieldRef.current?.getRootNode()
    if (!root) return
    let pending = 0
    const onReset = (event: Event) => {
      if (event.target !== fieldRef.current?.form) return
      pending = window.setTimeout(() => {
        if (!event.defaultPrevented) resetRef.current()
      })
    }
    root.addEventListener("reset", onReset, true)
    return () => {
      root.removeEventListener("reset", onReset, true)
      window.clearTimeout(pending)
    }
  }, [hasField])

  return (
    <EmojiPickerContext.Provider value={context}>
      <Popover open={open} onOpenChange={(next) => setOpen(next)}>
        {children === undefined ? (
          <>
            <EmojiPickerTrigger className={className} />
            <EmojiPickerContent />
          </>
        ) : (
          children
        )}
      </Popover>
      {hasField && (
        <input
          ref={(node) => {
            fieldRef.current = node
            assignRef(inputRef, node)
          }}
          type="text"
          name={name}
          form={form}
          required={required}
          disabled={disabled}
          value={values.join(",")}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          data-slot="emoji-picker-field"
          /* A failed `required` check focuses this field; hand that to the control. */
          onFocus={(event) => {
            const target = focusTarget.current ?? searchRef.current
            if (target) target.focus()
            else event.currentTarget.blur()
          }}
          className="pointer-events-none absolute size-px max-w-px opacity-0"
        />
      )}
    </EmojiPickerContext.Provider>
  )
}

/* An explicit label wins, then the data's own language, then English. */
function categoryLabel(
  key: string,
  labels: EmojiPickerLabels,
  overrides: EmojiPickerI18nOverrides | undefined,
  data: EmojiPickerData | null
) {
  if (!(EMOJI_PICKER_CATEGORIES as string[]).includes(key)) return undefined
  const category = key as EmojiPickerCategory
  return (
    overrides?.labels?.[category] ??
    (data && data.locale !== "en" ? data.categories[category] : undefined) ??
    labels[category]
  )
}

/** The picker's state and actions, inside an `EmojiPicker`. */
export function useEmojiPicker(): EmojiPickerApi {
  const context = useEmojiPickerContext("useEmojiPicker")
  return {
    data: context.data,
    status: context.status,
    retry: context.retry,
    emojis: context.emojis,
    query: context.query,
    setQuery: context.setQuery,
    skinTone: context.skinTone,
    setSkinTone: context.setSkinTone,
    activeEmoji: context.activeEmoji,
    value: context.values[0] ?? null,
    values: context.values,
    recent:
      context.tabs.find((section) => section.id === "recent")?.emojis ?? [],
    select: (emoji) => context.pick(emoji),
    clear: context.clear,
    open: context.open,
    setOpen: context.setOpen,
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Glyph                                   */
/* -------------------------------------------------------------------------- */

/* The emoji font stack, swappable through `--emoji-picker-font` for a
   self-hosted color font. */
const EMOJI_FONT_CLASS =
  "font-[family-name:var(--emoji-picker-font,Apple_Color_Emoji,Twemoji_Mozilla,Segoe_UI_Emoji,Segoe_UI_Symbol,Noto_Color_Emoji,sans-serif)] leading-none"

function EmojiGlyph({
  emoji,
  value,
  className,
}: {
  emoji: EmojiPickerEmoji | undefined | null
  value: string
  className?: string
}) {
  const context = useContext(EmojiPickerContext)
  if (emoji && context?.renderEmoji)
    return <>{context.renderEmoji(emoji, value)}</>
  if (emoji?.src) {
    return (
      <img
        src={emoji.src}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={cn("size-[1em] object-contain", className)}
      />
    )
  }
  return <span className={cn(EMOJI_FONT_CLASS, className)}>{value}</span>
}

export type EmojiPickerValueProps = Omit<ComponentProps<"span">, "children"> & {
  /** Defaults to the picker's value. */
  value?: string | null
  placeholder?: ReactNode
}

/** An emoji value drawn like the grid draws it, custom images included. For triggers and readouts. */
export function EmojiPickerValue({
  value: valueProp,
  placeholder,
  className,
  ...props
}: EmojiPickerValueProps) {
  const context = useEmojiPickerContext("EmojiPickerValue")
  const value =
    valueProp === undefined ? (context.values[0] ?? null) : valueProp
  return (
    <span
      data-slot="emoji-picker-value"
      data-placeholder={value ? undefined : ""}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {value ? (
        <EmojiGlyph emoji={context.findByValue(value)} value={value} />
      ) : (
        placeholder
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Trigger                                  */
/* -------------------------------------------------------------------------- */

export type EmojiPickerTriggerProps = ComponentProps<typeof Button>

/**
 * A shadcn Button that opens the picker: the value, or a smiley. Hovering or
 * focusing it starts the data fetch, so the grid is ready on open.
 */
export function EmojiPickerTrigger({
  className,
  variant = "outline",
  size = "icon",
  children,
  ref,
  onPointerEnter,
  onFocus,
  ...props
}: EmojiPickerTriggerProps) {
  const context = useEmojiPickerContext("EmojiPickerTrigger")
  const value = context.multiple ? null : (context.values[0] ?? null)
  const emoji = value ? context.findByValue(value) : undefined
  const name = context.label ?? context.i18n.labels.trigger
  const buttonProps = {
    type: "button" as const,
    variant,
    size,
    disabled: context.disabled,
    /* Before the data loads, the glyph itself stands in for its name: screen
       readers speak an emoji's name. */
    "aria-label": context.labelledBy
      ? undefined
      : emoji
        ? `${name}: ${context.i18n.functions.formatLabel(emoji.label)}`
        : value
          ? `${name}: ${value}`
          : name,
    "aria-labelledby": context.labelledBy,
    "aria-describedby": context.describedBy,
    ...(context.invalid && { "aria-invalid": true, "data-invalid": "" }),
    ...props,
    id: context.id,
    ref: (node: HTMLButtonElement | null) => {
      context.registerFocusTarget(node)
      assignRef(ref, node)
    },
    onPointerEnter: (
      event: Parameters<NonNullable<typeof onPointerEnter>>[0]
    ) => {
      onPointerEnter?.(event)
      context.requestData()
    },
    onFocus: (event: Parameters<NonNullable<typeof onFocus>>[0]) => {
      onFocus?.(event)
      context.requestData()
    },
    "data-slot": "emoji-picker-trigger",
    "data-placeholder": value ? undefined : "",
    /* The value glyph reads larger than label text; a className size wins. */
    className: cn(value && children === undefined && "text-lg", className),
  }
  const content =
    children === undefined ? (
      value ? (
        <EmojiPickerValue />
      ) : (
        TRIGGER_ICON
      )
    ) : (
      children
    )

  return (
    <PopoverTrigger asChild>
      <Button {...buttonProps}>{content}</Button>
    </PopoverTrigger>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Content, Panel                              */
/* -------------------------------------------------------------------------- */

const TABBABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

const isTouch = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(pointer: coarse)").matches

/* The search, except on a touch screen, where focusing it would raise the
   keyboard over the grid and push the popover off screen. */
function openFocusTarget(context: EmojiPickerContextValue): HTMLElement | true {
  return (
    (isTouch() ? null : context.searchRef.current) ??
    context.listRef.current ??
    true
  )
}

export type EmojiPickerContentProps = ComponentProps<typeof PopoverContent> & {
  /** Where focus goes on close, such as a composer's textarea. Defaults to the trigger. */
  returnFocus?: RefObject<HTMLElement | null>
}

/**
 * The popover. It wraps its children in an `EmojiPickerPanel`, so it takes the
 * same parts; with none it renders the default layout. Tab cycles inside it.
 */
export function EmojiPickerContent({
  className,
  align = "start",
  returnFocus,
  onKeyDown,
  onClick,
  children,
  ...props
}: EmojiPickerContentProps) {
  const context = useEmojiPickerContext("EmojiPickerContent")
  /* Radix takes the open and close focus targets through its auto-focus
     events, prevented when the picker moves focus itself. */
  const focusProps = {
    onOpenAutoFocus: (event: Event) => {
      const target = openFocusTarget(context)
      if (target === true) return
      event.preventDefault()
      target.focus({ preventScroll: true })
    },
    onCloseAutoFocus: (event: Event) => {
      if (!returnFocus?.current) return
      event.preventDefault()
      returnFocus.current.focus()
    },
  }
  return (
    <PopoverContent
      align={align}
      aria-labelledby={context.labelledBy}
      aria-label={
        context.labelledBy
          ? undefined
          : (context.label ?? context.i18n.labels.panel)
      }
      className={cn(
        /* Never taller than the room on its side (Base UI and Radix name the
           variable differently); the grid gives up rows first. */
        "max-h-[min(var(--available-height,100dvh),var(--radix-popover-content-available-height,100dvh))] w-auto gap-0 overflow-hidden p-0",
        className
      )}
      /* React bubbles a portaled click through the component tree, so a
         trigger inside an InputGroupAddon would see every click in here and
         move focus to the group's input, out of the search. */
      onClick={(event) => {
        onClick?.(event)
        event.stopPropagation()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== "Tab") return
        if (event.altKey || event.ctrlKey || event.metaKey) return
        /* tabIndex, not the selector alone: the category tabs rove, so
           all but one are buttons outside the tab order. */
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)
        ).filter((item) => item.tabIndex >= 0)
        const activeElement = event.currentTarget.ownerDocument.activeElement
        const first = items[0]
        const last = items[items.length - 1]
        if (!event.shiftKey && activeElement === last) {
          event.preventDefault()
          first?.focus()
        } else if (event.shiftKey && activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      }}
      {...focusProps}
      {...props}
    >
      <SurfaceContext.Provider value="popup">
        <EmojiPickerPanel>{children}</EmojiPickerPanel>
      </SurfaceContext.Provider>
    </PopoverContent>
  )
}

export type EmojiPickerPanelProps = ComponentProps<"div">

/**
 * The picker surface. Inline, put it straight inside an `EmojiPicker` with no
 * trigger. Without children it renders the search, the tabs, the grid and a
 * footer with the preview and the skin tone; with children, only those parts,
 * in that order.
 */
export function EmojiPickerPanel({
  className,
  style,
  children,
  ...props
}: EmojiPickerPanelProps) {
  const context = useEmojiPickerContext("EmojiPickerPanel")
  const inline = useContext(SurfaceContext) === "inline"
  const { requestData } = context
  const { cell, emoji, header, gutter } = context.size

  useEffect(() => {
    requestData()
  }, [requestData])

  return (
    <div
      role={inline ? "group" : undefined}
      aria-labelledby={inline ? context.labelledBy : undefined}
      aria-label={
        inline && !context.labelledBy
          ? (context.label ?? context.i18n.labels.panel)
          : undefined
      }
      data-slot="emoji-picker-panel"
      data-columns={context.columns === "auto" ? "auto" : undefined}
      data-disabled={context.disabled ? "" : undefined}
      style={
        {
          "--emoji-picker-cell": `${cell}px`,
          "--emoji-picker-emoji": `${emoji}px`,
          "--emoji-picker-header": `${header}px`,
          "--emoji-picker-gutter": `${gutter}px`,
          "--emoji-picker-padding": `${PADDING}px`,
          "--emoji-picker-columns": context.columnCount,
          "--emoji-picker-list-height": `${header + VISIBLE_ROWS * cell + gutter}px`,
          ...style,
        } as CSSProperties
      }
      className={cn(
        /* Sized from the columns: the list hides its scrollbar, so nothing
           else takes width. */
        "flex min-h-0 w-[calc(var(--emoji-picker-columns)*var(--emoji-picker-cell)+var(--emoji-picker-gutter)*2)] max-w-full min-w-0 flex-col data-disabled:pointer-events-none data-disabled:opacity-50 data-[columns=auto]:w-full",
        /* The sticky headers paint the surface they sit on: an inline panel
           belongs in a Card, a popup is the popover. */
        inline
          ? "[--emoji-picker-surface:var(--color-card)]"
          : "[--emoji-picker-surface:var(--color-popover)]",
        className
      )}
      {...props}
    >
      {children === undefined ? (
        <>
          <EmojiPickerHeader>
            <EmojiPickerSearch />
          </EmojiPickerHeader>
          <EmojiPickerCategories />
          <EmojiPickerList />
          <EmojiPickerFooter>
            <EmojiPickerPreview />
            <EmojiPickerSkinTone />
          </EmojiPickerFooter>
        </>
      ) : (
        children
      )}
    </div>
  )
}

export type EmojiPickerHeaderProps = ComponentProps<"div">

/** The row above the grid, for the search and anything beside it. */
export function EmojiPickerHeader({
  className,
  ...props
}: EmojiPickerHeaderProps) {
  return (
    <div
      data-slot="emoji-picker-header"
      className={cn(
        "flex items-center gap-2 px-(--emoji-picker-padding) pt-(--emoji-picker-padding) pb-2",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Search                                   */
/* -------------------------------------------------------------------------- */

export type EmojiPickerSearchProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue"
>

/**
 * The search field, a default shadcn InputGroup. Focus stays here while the
 * arrow keys move through the grid (a combobox over the listbox); Enter picks
 * the highlighted emoji.
 */
export function EmojiPickerSearch({
  className,
  placeholder,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  ref,
  ...props
}: EmojiPickerSearchProps) {
  const context = useEmojiPickerContext("EmojiPickerSearch")
  const { setHasSearch, searchRef } = context
  const { labels } = context.i18n
  const activeId = context.activePosition
    ? optionId(context.listId, context.activePosition)
    : undefined

  useEffect(() => {
    setHasSearch(true)
    return () => setHasSearch(false)
  }, [setHasSearch])

  return (
    <InputGroup
      data-slot="emoji-picker-search"
      className={cn("flex-1", className)}
    >
      <InputGroupAddon>{SEARCH_ICON}</InputGroupAddon>
      <InputGroupInput
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={context.listId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label={labels.search}
        placeholder={placeholder ?? labels.search}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        disabled={context.disabled}
        value={context.query}
        onChange={(event) => {
          onChange?.(event)
          context.setQuery(event.target.value)
        }}
        onFocus={(event) => {
          onFocus?.(event)
          context.setFocused(true)
        }}
        onBlur={(event) => {
          onBlur?.(event)
          context.setFocused(false)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          /* In a popover Escape closes it; inline it clears the search. */
          if (event.key === "Escape" && context.query && !context.open) {
            event.preventDefault()
            context.setQuery("")
            return
          }
          context.navigate(event, true)
        }}
        {...props}
        ref={(node: HTMLInputElement | null) => {
          searchRef.current = node
          assignRef(ref, node)
        }}
      />
      {context.query && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label={labels.clearSearch}
            data-slot="emoji-picker-search-clear"
            onClick={() => {
              context.setQuery("")
              searchRef.current?.focus()
            }}
          >
            {CLEAR_ICON}
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Skin tone                                 */
/* -------------------------------------------------------------------------- */

const HAND = "✋"
const TONE_MODIFIERS = [
  "",
  "\u{1F3FB}",
  "\u{1F3FC}",
  "\u{1F3FD}",
  "\u{1F3FE}",
  "\u{1F3FF}",
]
const TONES = [0, 1, 2, 3, 4, 5] as const

function ToneGlyph({ tone }: { tone: EmojiPickerSkinTone }) {
  return (
    <span aria-hidden="true" className={cn(EMOJI_FONT_CLASS, "text-base")}>
      {HAND + TONE_MODIFIERS[tone]}
    </span>
  )
}

export type EmojiPickerSkinToneProps = ComponentProps<typeof Button>

/**
 * A shadcn Button with a hand in the current tone that opens the six tones in
 * a shadcn DropdownMenu. The choice applies to every emoji that takes a tone
 * and is remembered under `skinToneStorageKey`. Ghost at `icon-sm` for the
 * footer by default; beside the search, `outline` at `icon` matches its
 * height in every style.
 */
export function EmojiPickerSkinTone({
  variant = "ghost",
  size = "icon-sm",
  ref,
  ...props
}: EmojiPickerSkinToneProps) {
  const context = useEmojiPickerContext("EmojiPickerSkinTone")
  const { labels } = context.i18n
  const tone = context.skinTone
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const buttonProps = {
    type: "button" as const,
    variant,
    size,
    disabled: context.disabled,
    "aria-label": `${labels.skinTone}: ${labels.skinTones[tone]}`,
    "data-slot": "emoji-picker-skin-tone",
    ...props,
    ref: (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      assignRef(ref, node)
    },
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button {...buttonProps}>
          <ToneGlyph tone={tone} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.skinTone}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={String(tone)}
            onValueChange={(next) =>
              context.setSkinTone(Number(next) as EmojiPickerSkinTone)
            }
          >
            {TONES.map((option) => (
              <DropdownMenuRadioItem key={option} value={String(option)}>
                <ToneGlyph tone={option} />
                {labels.skinTones[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Categories                                 */
/* -------------------------------------------------------------------------- */

/* The triggers share the row evenly, so any number of categories fits; a
   trigger's own padding would overflow a row of 11. */
const TAB_CLASS = "max-w-9 min-w-0 px-0"

export type EmojiPickerCategoriesProps = ComponentProps<"div">

/**
 * Category tabs, the shadcn Tabs in its line variant, that jump the grid and
 * follow its scroll. Arrow keys move between them; Enter or Space jumps. A
 * jump during a search clears it.
 */
export function EmojiPickerCategories({
  className,
  ...props
}: EmojiPickerCategoriesProps) {
  const context = useEmojiPickerContext("EmojiPickerCategories")
  const searching = !!context.query.trim()
  const placeholder = context.status !== "ready"
  const tabs = placeholder ? context.placeholderTabs : context.tabs
  const current = searching ? "" : (context.activeSection ?? tabs[0]?.id ?? "")

  return (
    <div
      data-slot="emoji-picker-categories"
      className={cn(
        /* A divider on the grid's side: below the tabs over the grid, above
           them under it. */
        "shrink-0 border-b px-(--emoji-picker-padding) first:pt-(--emoji-picker-padding) last:pb-(--emoji-picker-padding) [[data-slot=emoji-picker-list]~&]:border-t [[data-slot=emoji-picker-list]~&]:border-b-0 [[data-slot=emoji-picker-list]~&]:pt-1",
        className
      )}
      {...props}
    >
      {/* Controlled by the scroll, not by a pick: a click jumps, and the
          grid's scroll then moves the tab, so the current tab jumps too. */}
      <Tabs value={current} activationMode="manual">
        <TabsList
          variant="line"
          aria-label={context.i18n.labels.categories}
          className="w-full justify-between"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              aria-label={tab.label}
              aria-controls={context.listId}
              title={tab.label}
              disabled={placeholder || context.disabled}
              data-slot="emoji-picker-category"
              data-category={tab.id}
              className={TAB_CLASS}
              onClick={() => context.jumpTo(tab.id)}
            >
              {tab.icon}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    List                                    */
/* -------------------------------------------------------------------------- */

const optionId = (listId: string, at: { row: number; col: number }) =>
  `${listId}-${at.row}-${at.col}`

/* The shadcn Command group heading per style, at a fixed height so the virtual
   grid can place rows without measuring. The text starts where the glyphs
   below it do. `pt-1` spends the header's last 4px above the label, so it
   sits with its emoji: at the default size 11px above its ink, 10.5px below
   (the old centered 24px header left 7px above). */
const SECTION_HEADER_CLASS =
  "sticky top-0 z-1 flex h-(--emoji-picker-header) items-center bg-(--emoji-picker-surface) px-(--emoji-picker-padding) pt-1 text-xs text-muted-foreground select-none font-medium"

/* The shadcn Button radius per style: a cell is a ghost icon button, and a
   highlight paints its background only; the glyph never changes size. */
const CELL_CLASS =
  "mx-auto flex size-(--emoji-picker-cell) cursor-default items-center justify-center text-(length:--emoji-picker-emoji) transition-colors duration-100 select-none data-active:bg-muted aria-disabled:opacity-40 data-selected:bg-primary/10 data-selected:inset-ring-1 data-selected:inset-ring-primary/30 dark:data-selected:bg-primary/20 forced-colors:data-active:outline-2 forced-colors:data-active:outline-solid rounded-lg"

/* The keyboard's cell takes the shadcn Button's focus in each style, border
   and ring, the ring no wider than the gutter so the grid's edge never cuts
   it. It rises over the sticky header, whose empty bottom it may cross. */
const CELL_FOCUS_CLASS =
  "data-keyboard:z-2 data-keyboard:border data-keyboard:border-ring data-keyboard:ring-[length:min(3px,var(--emoji-picker-gutter))] data-keyboard:ring-ring/50"

/* No scrollbar; a fade at each end that has rows scrolled out of view says
   there is more. The top fade starts under the sticky header, which stays
   solid. `--emoji-picker-fade-size` sets the depth, `0px` turns it off, as
   the keyboard does: a mask also fades the focus ring it would sit on. */
const LIST_CLASS =
  "relative h-(--emoji-picker-list-height) min-h-[calc(var(--emoji-picker-header)+var(--emoji-picker-cell)*2)] overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] data-keyboard:[--emoji-picker-fade-size:0px] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,#000_var(--emoji-picker-header),transparent_var(--emoji-picker-header),#000_calc(var(--emoji-picker-header)+var(--emoji-picker-fade-start,0px)),#000_calc(100%-var(--emoji-picker-fade-end,0px)),transparent)] data-overflow-start:[--emoji-picker-fade-start:var(--emoji-picker-fade-size,calc(var(--emoji-picker-cell)*2/3))] data-overflow-end:[--emoji-picker-fade-end:var(--emoji-picker-fade-size,calc(var(--emoji-picker-cell)*2/3))]"

/* Scrolls the grid and notes where, so a scroll of its own is told from the
   user's. */
function scrollGrid(
  list: HTMLElement,
  top: number,
  mark: RefObject<number | null>
) {
  list.scrollTop = top
  mark.current = list.scrollTop
}

export type EmojiPickerListProps = ComponentProps<"div">

/**
 * The virtual grid: only the rows in view render, so a page of reaction
 * pickers or a 20,000 custom emoji library stays cheap. Section headers stick
 * while their rows scroll. Holds the loading, error and empty states.
 */
export function EmojiPickerList({
  className,
  onKeyDown,
  onFocus,
  onBlur,
  onPointerDown,
  onScroll,
  ...props
}: EmojiPickerListProps) {
  const context = useEmojiPickerContext("EmojiPickerList")
  const {
    layout,
    size,
    requestData,
    setActiveSection,
    setMeasuredColumns,
    setJump,
    listRef,
    jump,
  } = context
  const { labels, functions } = context.i18n
  const [range, setRange] = useState({ start: 0, end: VISIBLE_ROWS + OVERSCAN })
  const updateRef = useRef(() => {})
  /* A click on the grid's own background focuses it without a highlight. */
  const pointerDown = useRef(false)
  /* Where the grid last scrolled itself; any other scroll is the user's. */
  const scrolledTo = useRef<number | null>(null)

  const update = () => {
    const list = listRef.current
    if (!list) return
    const height = list.clientHeight || FALLBACK_HEIGHT
    const top = list.scrollTop
    const last = Math.max(0, layout.rows.length - 1)
    const start = Math.max(0, indexAt(layout.rows, top) - OVERSCAN)
    const end = Math.min(last, indexAt(layout.rows, top + height) + OVERSCAN)
    setRange((previous) =>
      previous.start === start && previous.end === end
        ? previous
        : { start, end }
    )
    context.setPageRows(
      Math.max(1, Math.floor((height - size.header) / size.cell))
    )
    list.toggleAttribute("data-overflow-start", top > 1)
    list.toggleAttribute(
      "data-overflow-end",
      top + list.clientHeight < list.scrollHeight - 1
    )
    setActiveSection(
      layout.sections[indexAt(layout.sections, top + 1)]?.section.id ?? null
    )
  }

  useLayoutEffect(() => {
    updateRef.current = update
  })

  useEffect(() => {
    requestData()
  }, [requestData])

  /* A new query starts at the top. */
  useLayoutEffect(() => {
    if (listRef.current) scrollGrid(listRef.current, 0, scrolledTo)
    updateRef.current()
  }, [context.query, listRef])

  useLayoutEffect(() => {
    updateRef.current()
  }, [layout])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!jump || !list) return
    const section = layout.sections.find((item) => item.section.id === jump)
    if (!section) return
    scrollGrid(list, section.top, scrolledTo)
    updateRef.current()
    setJump(null)
  }, [jump, layout, listRef, setJump])

  /* Keeps a keyboard-highlighted cell clear of the sticky header and the
     bottom edge. A hovered one is already in view. */
  const { active, activePosition } = context
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || active?.source !== "keyboard" || !activePosition) return
    const row = layout.rows[activePosition.row]
    if (!row) return
    const height = list.clientHeight || FALLBACK_HEIGHT
    if (row.top - size.header < list.scrollTop) {
      scrollGrid(list, row.top - size.header, scrolledTo)
    } else if (row.top + size.cell + size.gutter > list.scrollTop + height) {
      scrollGrid(list, row.top + size.cell + size.gutter - height, scrolledTo)
    }
    updateRef.current()
  }, [active, activePosition, layout, listRef, size])

  /* Re-reads the window and the fades on resize and, under
     `columns="auto"`, how many cells fit. */
  const { columns } = context
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      if (columns === "auto" && list.clientWidth > 0) {
        setMeasuredColumns(
          Math.max(
            1,
            Math.floor((list.clientWidth - size.gutter * 2) / size.cell)
          )
        )
      }
      updateRef.current()
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [columns, listRef, setMeasuredColumns, size])

  const rendered = new Set<number>()
  for (
    let row = range.start;
    row <= range.end && row < layout.rows.length;
    row++
  ) {
    rendered.add(row)
  }
  /* The highlighted row always renders, so aria-activedescendant resolves. */
  if (activePosition) rendered.add(activePosition.row)
  const rowsBySection = new Map<number, number[]>()
  for (const row of [...rendered].sort((a, b) => a - b)) {
    const section = layout.rows[row]?.section
    if (section === undefined) continue
    const list = rowsBySection.get(section)
    if (list) list.push(row)
    else rowsBySection.set(section, [row])
  }

  const searching = !!context.query.trim()
  const ready = context.status === "ready"
  const empty = ready && layout.rows.length === 0
  /* The keyboard's highlight shows only while the search or the grid holds
     focus, and pauses the fades. */
  const keyboard =
    context.focused && context.active?.source === "keyboard" && !!activePosition
  const status =
    searching && ready
      ? functions.formatResultCount(
          layout.rows.reduce((sum, row) => sum + row.cells.length, 0)
        )
      : ""

  return (
    <>
      <div
        ref={listRef}
        id={context.listId}
        role="listbox"
        aria-label={labels.list}
        aria-multiselectable={context.multiple || undefined}
        aria-busy={!ready || undefined}
        aria-activedescendant={
          activePosition ? optionId(context.listId, activePosition) : undefined
        }
        /* A tab stop of its own, search or not, once there is an emoji. */
        tabIndex={context.disabled || !ready || empty ? -1 : 0}
        data-slot="emoji-picker-list"
        data-keyboard={keyboard ? "" : undefined}
        className={cn(LIST_CLASS, className)}
        onScroll={(event) => {
          onScroll?.(event)
          const mark = scrolledTo.current
          if (
            mark === null ||
            Math.abs(event.currentTarget.scrollTop - mark) > 1
          )
            context.releaseKeyboard()
          update()
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (!event.defaultPrevented) pointerDown.current = true
        }}
        onFocus={(event) => {
          onFocus?.(event)
          context.setFocused(true)
          if (event.target !== event.currentTarget) return
          const fromPointer = pointerDown.current || isTouch()
          pointerDown.current = false
          /* Tabbing in starts at the first emoji in view; a highlight the
             keyboard already holds stays where it is. */
          if (!fromPointer && context.active?.source !== "keyboard") {
            context.move("visible")
          }
        }}
        onBlur={(event) => {
          onBlur?.(event)
          pointerDown.current = false
          context.setFocused(false)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.target !== event.currentTarget)
            return
          /* Typing in the grid goes on in the search. */
          const search = context.searchRef.current
          const typed =
            (event.key.length === 1 && event.key !== " ") ||
            event.key === "Backspace"
          if (
            search &&
            typed &&
            !event.nativeEvent.isComposing &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
          ) {
            search.focus()
            return
          }
          context.navigate(event, false)
        }}
        {...props}
      >
        {ready && (
          <div className="relative" style={{ height: layout.height }}>
            {layout.sections.map((section, sectionIndex) => {
              const rows = rowsBySection.get(sectionIndex)
              if (!rows) return null
              const headerId = `${context.listId}-${sectionIndex}`
              return (
                <div
                  key={section.section.id}
                  role="group"
                  aria-labelledby={headerId}
                  data-slot="emoji-picker-section"
                  data-section={section.section.id}
                  className="absolute inset-x-0"
                  style={{ top: section.top, height: section.height }}
                >
                  <div
                    id={headerId}
                    data-slot="emoji-picker-section-header"
                    className={SECTION_HEADER_CLASS}
                  >
                    {section.section.label}
                  </div>
                  {rows.map((rowIndex) => {
                    const row = layout.rows[rowIndex]
                    const first =
                      (rowIndex - section.firstRow) * context.columnCount
                    return (
                      <div
                        key={rowIndex}
                        role="presentation"
                        className="absolute inset-x-(--emoji-picker-gutter) grid grid-cols-[repeat(var(--emoji-picker-columns),minmax(0,1fr))]"
                        style={{ top: row.top - section.top }}
                      >
                        {row.cells.map((emoji, col) => {
                          const at = { row: rowIndex, col }
                          const isActive =
                            activePosition?.row === rowIndex &&
                            activePosition.col === col
                          const isSelected = context.isSelected(emoji)
                          const refused = context.full && !isSelected
                          const value = getEmojiValue(
                            emoji,
                            emoji.skins ? context.skinTone : 0
                          )
                          return (
                            <div
                              key={emoji.id}
                              id={optionId(context.listId, at)}
                              role="option"
                              aria-label={functions.formatLabel(emoji.label)}
                              aria-selected={
                                context.valueMode ? isSelected : isActive
                              }
                              aria-disabled={refused || undefined}
                              aria-posinset={first + col + 1}
                              aria-setsize={section.section.emojis.length}
                              data-slot="emoji-picker-emoji"
                              data-active={isActive ? "" : undefined}
                              data-keyboard={
                                keyboard && isActive ? "" : undefined
                              }
                              /* "true", not "": shadcn's tailwind.css matches
                                 `data-selected:` on that value only. */
                              data-selected={
                                isSelected && context.valueMode
                                  ? "true"
                                  : undefined
                              }
                              className={cn(CELL_CLASS, CELL_FOCUS_CLASS)}
                              /* Keeps focus in the search, so typing goes on. A
                                 panel that does not hold focus yet takes it
                                 there, or on the list on a touch screen, where
                                 the search would raise the keyboard. */
                              onPointerDown={(event) => {
                                event.preventDefault()
                                const { searchRef, listRef } = context
                                const focused =
                                  event.currentTarget.ownerDocument
                                    .activeElement
                                if (
                                  focused === searchRef.current ||
                                  focused === listRef.current
                                )
                                  return
                                const target =
                                  event.pointerType === "touch"
                                    ? listRef.current
                                    : (searchRef.current ?? listRef.current)
                                if (target === listRef.current) {
                                  pointerDown.current = true
                                }
                                target?.focus({ preventScroll: true })
                              }}
                              onPointerMove={() => {
                                if (
                                  isActive &&
                                  context.active?.source === "pointer"
                                )
                                  return
                                context.setActive({
                                  section: section.section.id,
                                  id: emoji.id,
                                  source: "pointer",
                                })
                              }}
                              onClick={(event) => {
                                if (!refused) context.pick(emoji, event)
                              }}
                            >
                              <EmojiGlyph emoji={emoji} value={value} />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
        {!ready && context.status !== "error" && (
          <div
            role="status"
            aria-label={labels.loading}
            className="flex flex-col"
          >
            <div className="flex h-(--emoji-picker-header) items-center px-(--emoji-picker-padding) pt-1">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="grid grid-cols-[repeat(var(--emoji-picker-columns),minmax(0,1fr))] px-(--emoji-picker-gutter)">
              {Array.from({ length: context.columnCount * 5 }, (_, index) => (
                <div
                  key={index}
                  className="flex size-(--emoji-picker-cell) items-center justify-center"
                >
                  <Skeleton className="size-(--emoji-picker-emoji) rounded-full" />
                </div>
              ))}
            </div>
          </div>
        )}
        {context.status === "error" && (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyTitle>{labels.error}</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={context.retry}
              >
                {labels.retry}
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {empty && (
          <Empty data-slot="emoji-picker-empty" className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">{SEARCH_ICON}</EmptyMedia>
              <EmptyTitle>{labels.empty}</EmptyTitle>
              <EmptyDescription>{labels.emptyHint}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {context.announcement || status}
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Preview                                  */
/* -------------------------------------------------------------------------- */

export type EmojiPickerFooterProps = ComponentProps<"div">

/** The row under the grid: the preview and the skin tone by default. */
export function EmojiPickerFooter({
  className,
  ...props
}: EmojiPickerFooterProps) {
  return (
    <div
      data-slot="emoji-picker-footer"
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 border-t px-(--emoji-picker-padding)",
        className
      )}
      {...props}
    />
  )
}

export type EmojiPickerPreviewProps = ComponentProps<"div">

/**
 * The highlighted emoji, large, with its name and first shortcode; the value
 * while nothing is highlighted. Visual only: the grid already announces it.
 * It fills the space it is given, usually an `EmojiPickerFooter`.
 */
export function EmojiPickerPreview({
  className,
  ...props
}: EmojiPickerPreviewProps) {
  const context = useEmojiPickerContext("EmojiPickerPreview")
  const { labels, functions } = context.i18n
  const fallback =
    !context.multiple && context.values[0]
      ? context.findByValue(context.values[0])
      : undefined
  const emoji = context.activeEmoji ?? fallback ?? null
  const value = emoji
    ? context.activeEmoji
      ? getEmojiValue(emoji, emoji.skins ? context.skinTone : 0)
      : (context.values[0] as string)
    : ""
  const shortcode = emoji?.shortcodes[0]

  return (
    <div
      aria-hidden="true"
      data-slot="emoji-picker-preview"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 select-none",
        className
      )}
      {...props}
    >
      {emoji ? (
        <>
          <EmojiGlyph
            emoji={emoji}
            value={value}
            className="shrink-0 text-[22px]"
          />
          {/* One line, so the footer stays as dense as the grid. Without room
              the shortcode wraps onto a second, clipped line rather than
              truncating to a stray colon; a long name truncates. */}
          <span className="flex h-5 min-w-0 flex-1 flex-wrap items-baseline gap-x-2 overflow-hidden">
            <span className="max-w-full truncate text-sm leading-5 font-medium">
              {functions.formatLabel(emoji.label)}
            </span>
            {shortcode && (
              <span className="text-muted-foreground text-xs leading-5">
                :{shortcode}:
              </span>
            )}
          </span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground flex size-[22px] shrink-0 items-center justify-center [&_svg]:size-5">
            {TRIGGER_ICON}
          </span>
          <span className="text-muted-foreground truncate text-sm">
            {labels.preview}
          </span>
        </>
      )}
    </div>
  )
}
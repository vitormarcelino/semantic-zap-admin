"use client"

import { useRef, useState } from "react"
import { Bold, Italic, Strikethrough, Code, Smile } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"

const EMOJIS = [
  "😊", "😄", "😂", "🤣", "❤️", "😍", "🙏", "👍", "👏", "🎉",
  "🔥", "✅", "⭐", "💡", "🚀", "💬", "📱", "🤖", "💰", "📦",
  "⚠️", "❌", "✔️", "🕐", "📅", "📧", "📞", "🔔", "🛒", "🎁",
]

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition-colors hover:bg-white/8 hover:text-white"
    >
      {children}
    </button>
  )
}

interface WhatsappEditorProps {
  name: string
  defaultValue?: string | null
  placeholder?: string
}

export function WhatsappEditor({
  name,
  defaultValue,
  placeholder,
}: WhatsappEditorProps) {
  const [value, setValue] = useState(defaultValue ?? "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function wrapText(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const newValue =
      value.slice(0, start) + before + selected + after + value.slice(end)
    setValue(newValue)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = selected
        ? end + before.length + after.length
        : start + before.length
      ta.setSelectionRange(pos, pos)
    })
  }

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const newValue = value.slice(0, start) + emoji + value.slice(start)
    setValue(newValue)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/8 bg-[#0F1117] transition-colors focus-within:border-[#00D060]/50 focus-within:ring-1 focus-within:ring-[#00D060]/20">
      <div className="flex items-center gap-0.5 border-b border-white/8 px-2 py-1.5">
        <ToolbarButton title="Negrito (*texto*)" onClick={() => wrapText("*", "*")}>
          <Bold size={13} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton title="Itálico (_texto_)" onClick={() => wrapText("_", "_")}>
          <Italic size={13} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton title="Tachado (~texto~)" onClick={() => wrapText("~", "~")}>
          <Strikethrough size={13} strokeWidth={2} />
        </ToolbarButton>
        <ToolbarButton
          title="Monoespaçado (```texto```)"
          onClick={() => wrapText("```", "```")}
        >
          <Code size={13} strokeWidth={2} />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-white/12" />
        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              title="Emoji"
              className="flex h-7 w-7 items-center justify-center rounded text-white/50 transition-colors hover:bg-white/8 hover:text-white"
            >
              <Smile size={13} strokeWidth={2} />
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              side="bottom"
              align="start"
              sideOffset={4}
              className="z-50 w-52 rounded-xl border border-white/8 bg-[#181C26] p-2 shadow-xl"
            >
              <div className="grid grid-cols-6 gap-0.5">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded text-base transition-colors hover:bg-white/8"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
        <span className="ml-auto font-mono text-[10px] text-white/20">
          WhatsApp
        </span>
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none"
      />
    </div>
  )
}

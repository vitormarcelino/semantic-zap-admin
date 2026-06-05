"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { useTheme } from "next-themes"
import "@uiw/react-md-editor/markdown-editor.css"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface MarkdownEditorProps {
  name: string
  defaultValue?: string | null
  placeholder?: string
  height?: number
  className?: string
}

export function MarkdownEditor({
  name,
  defaultValue,
  placeholder,
  height = 220,
  className,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue ?? "")
  const { resolvedTheme } = useTheme()

  return (
    <div
      data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
      className={className}
    >
      <MDEditor
        value={value}
        onChange={(v) => setValue(v ?? "")}
        height={height}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{ placeholder }}
      />
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import "@uiw/react-md-editor/markdown-editor.css"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface MarkdownEditorProps {
  name: string
  defaultValue?: string | null
  placeholder?: string
}

export function MarkdownEditor({
  name,
  defaultValue,
  placeholder,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue ?? "")

  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(v) => setValue(v ?? "")}
        height={220}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{ placeholder }}
      />
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

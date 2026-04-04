"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bot, Pencil, Trash2 } from "lucide-react"
import { deleteAgent } from "@/app/agents/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const LANGUAGE_LABELS: Record<string, string> = {
  "pt-BR": "PT-BR",
  en: "EN",
}

type Agent = {
  id: string
  name: string
  description: string | null
  language: string
  tone: string
  model: string
  temperature: number
  maxTokens: number
}

interface AgentManagementCardProps {
  agent: Agent
}

export function AgentManagementCard({ agent }: AgentManagementCardProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteAgent(agent.id)
      router.refresh()
      setConfirmOpen(false)
    })
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/8 bg-[#1F2535]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00D060]/10">
              <Bot
                size={18}
                className="text-[#00D060]"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {agent.name}
              </p>
              {agent.description ? (
                <p className="truncate text-xs text-white/38">
                  {agent.description}
                </p>
              ) : (
                <p className="text-xs text-white/20 italic">Sem descrição</p>
              )}
            </div>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-white/20">
            {LANGUAGE_LABELS[agent.language] ?? agent.language}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">
          <span className="rounded-md border border-white/8 px-2 py-0.5 font-mono text-[10px] text-white/40">
            {agent.model}
          </span>
          <span className="rounded-md border border-white/8 px-2 py-0.5 font-mono text-[10px] text-white/40">
            {agent.tone}
          </span>
          <span className="rounded-md border border-white/8 px-2 py-0.5 font-mono text-[10px] text-white/40">
            temp {agent.temperature.toFixed(2)}
          </span>
          <span className="rounded-md border border-white/8 px-2 py-0.5 font-mono text-[10px] text-white/40">
            {agent.maxTokens} tok
          </span>
        </div>

        <div className="mx-5 h-px bg-white/8" />

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-3">
          <Link
            href={`/agents/${agent.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-white/8 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/16 hover:text-white"
          >
            <Pencil size={12} strokeWidth={1.5} strokeLinecap="round" />
            Editar
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400/70 transition-colors hover:border-red-500/40 hover:text-red-400"
          >
            <Trash2 size={12} strokeWidth={1.5} strokeLinecap="round" />
            Excluir
          </button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir agente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong className="text-white">{agent.name}</strong>? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
              className="rounded-lg border border-white/8 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/16 hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

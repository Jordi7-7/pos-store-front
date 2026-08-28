import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />
}

function PaginationPrevious({ className, disabled, onClick, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Página anterior"
      disabled={disabled}
      onClick={onClick}
      className={cn("inline-flex h-8 items-center gap-1 rounded-md border border-input px-2.5 text-xs font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-40", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-3.5" />
      <span className="hidden sm:inline">Anterior</span>
    </button>
  )
}

function PaginationNext({ className, disabled, onClick, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Página siguiente"
      disabled={disabled}
      onClick={onClick}
      className={cn("inline-flex h-8 items-center gap-1 rounded-md border border-input px-2.5 text-xs font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-40", className)}
      {...props}
    >
      <span className="hidden sm:inline">Siguiente</span>
      <ChevronRightIcon className="size-3.5" />
    </button>
  )
}

export { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious }

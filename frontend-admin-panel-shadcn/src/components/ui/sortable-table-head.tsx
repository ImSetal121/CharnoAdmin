"use client"

import * as React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableHead } from "./table"
import { Button } from "./button"

interface SortableTableHeadProps extends React.ComponentProps<typeof TableHead> {
  /** 字段名（用于排序） */
  field: string
  /** 当前排序字段 */
  sortField: string | null
  /** 当前排序方向 */
  sortDirection: 'asc' | 'desc' | null
  /** 排序点击回调 */
  onSort: (field: string) => void
  /** 表头文本 */
  children: React.ReactNode
}

export function SortableTableHead({
  field,
  sortField,
  sortDirection,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isActive = sortField === field
  const currentDirection = isActive ? sortDirection : null

  const handleClick = () => {
    onSort(field)
  }

  const getIcon = () => {
    if (!isActive) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    if (currentDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    if (currentDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
  }

  return (
    <TableHead className={cn(className)} {...props}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={handleClick}
      >
        <span>{children}</span>
        {getIcon()}
      </Button>
    </TableHead>
  )
}


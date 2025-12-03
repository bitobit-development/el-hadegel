'use client'

import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { StatusInfoDialog } from './StatusInfoDialog'

interface StatusInfoIconProps {
  mkId: number
  mkName: string
  count: number
}

export const StatusInfoIcon = ({ mkId, mkName, count }: StatusInfoIconProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (count === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setDialogOpen(true)
        }}
        className="relative flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/25 rounded-lg px-1.5 py-1 sm:px-2.5 sm:py-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={`צפה במידע על ${mkName}`}
        title={`${count} עדכוני סטטוס`}
      >
        <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
        <span className="absolute -top-1 -right-1 flex items-center justify-center bg-blue-500 text-white text-[9px] sm:text-[10px] font-semibold rounded-full min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] px-1 shadow-lg">
          {count}
        </span>
      </button>

      <StatusInfoDialog
        mkId={mkId}
        mkName={mkName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}

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
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setDialogOpen(true)
        }}
        className="relative gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
        aria-label={`צפה במידע על ${mkName}`}
      >
        <Info className="h-4 w-4 text-blue-600" />
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs px-1.5"
        >
          {count}
        </Badge>
      </Button>

      <StatusInfoDialog
        mkId={mkId}
        mkName={mkName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}

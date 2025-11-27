'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusInfoList } from './StatusInfoList'
import { getMKStatusInfo } from '@/app/actions/status-info-actions'
import type { MKStatusInfoData } from '@/types/mk-status-info'
import { Loader2 } from 'lucide-react'

interface StatusInfoDialogProps {
  mkId: number
  mkName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const StatusInfoDialog = ({
  mkId,
  mkName,
  open,
  onOpenChange,
}: StatusInfoDialogProps) => {
  const [statusInfos, setStatusInfos] = useState<MKStatusInfoData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && statusInfos.length === 0) {
      setLoading(true)
      getMKStatusInfo(mkId, 20)
        .then(setStatusInfos)
        .finally(() => setLoading(false))
    }
  }, [open, mkId, statusInfos.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">מידע עדכני - {mkName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <StatusInfoList statusInfos={statusInfos} />
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createStatusInfo } from '@/app/actions/status-info-actions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface CreateStatusInfoDialogProps {
  mkId: number
  mkName: string
  adminEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateStatusInfoDialog = ({
  mkId,
  mkName,
  adminEmail,
  open,
  onOpenChange,
}: CreateStatusInfoDialogProps) => {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!content.trim() || !adminEmail) return

    setIsSubmitting(true)
    setError(null)

    const result = await createStatusInfo(
      { mkId, content: content.trim() },
      adminEmail
    )

    setIsSubmitting(false)

    if (result.success) {
      setContent('')
      onOpenChange(false)
      router.refresh()
    } else {
      setError(result.error || 'שגיאה ביצירת המידע')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">הוסף מידע חדש - {mkName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="content" className="text-right block mb-2">
              תוכן המידע
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="הזן מידע מפורט על עמדת חבר הכנסת..."
              className="min-h-[200px] text-right"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 mt-1 text-right">
              {content.length} / 2000 תווים
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              'שמור'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

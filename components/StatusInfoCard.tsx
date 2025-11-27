import type { MKStatusInfoData } from '@/types/mk-status-info'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User } from 'lucide-react'

interface StatusInfoCardProps {
  statusInfo: MKStatusInfoData
}

export const StatusInfoCard = ({ statusInfo }: StatusInfoCardProps) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(statusInfo.createdAt)}</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {statusInfo.createdBy}
          </Badge>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{statusInfo.content}</p>
      </CardContent>
    </Card>
  )
}

import type { MKStatusInfoData } from '@/types/mk-status-info'
import { StatusInfoCard } from './StatusInfoCard'
import { Info } from 'lucide-react'

interface StatusInfoListProps {
  statusInfos: MKStatusInfoData[]
}

export const StatusInfoList = ({ statusInfos }: StatusInfoListProps) => {
  if (statusInfos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Info className="h-12 w-12 mb-2" />
        <p>אין מידע זמין</p>
      </div>
    )
  }

  return (
    <div className="max-h-[600px] overflow-y-auto">
      {statusInfos.map((statusInfo) => (
        <StatusInfoCard key={statusInfo.id} statusInfo={statusInfo} />
      ))}
    </div>
  )
}

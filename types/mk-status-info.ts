export interface MKStatusInfoData {
  id: number
  mkId: number
  content: string
  createdAt: Date
  createdBy: string
  mk?: {
    nameHe: string
    faction: string
  }
}

export interface CreateStatusInfoInput {
  mkId: number
  content: string
}

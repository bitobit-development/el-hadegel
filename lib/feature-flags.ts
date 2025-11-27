export const isStatusInfoEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_STATUS_INFO === 'true'
}

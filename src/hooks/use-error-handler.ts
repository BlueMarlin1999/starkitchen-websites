import { useToast } from '@/hooks/use-toast';

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = (error: any, fallbackMessage = '操作失败') => {
    console.error('Error:', error)

    const message =
      error?.response?.data?.error || error?.message || fallbackMessage

    toast({
      title: '出错了',
      description: message,
      variant: 'destructive',
    })

    return message
  }

  const handleSuccess = (message: string) => {
    toast({
      title: '成功',
      description: message,
    })
  }

  return { handleError, handleSuccess }
}

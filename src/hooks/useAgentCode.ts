import Taro from '@tarojs/taro'

const STORAGE_KEY = 'agentCode'

export function useAgentCode() {
  const getAgentCode = (): string | null => {
    const agentCode = Taro.getStorageSync(STORAGE_KEY)
    return agentCode ? String(agentCode) : null
  }

  const clearAgentCode = () => {
    Taro.removeStorageSync(STORAGE_KEY)
  }

  return { getAgentCode, clearAgentCode }
}

export default useAgentCode


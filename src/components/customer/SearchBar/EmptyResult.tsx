import { View, Text } from '@tarojs/components'
import { IconFont } from '@nutui/icons-react-taro'
import './EmptyResult.scss'

interface EmptyResultProps {
  keyword: string
  onClear: () => void
}

/**
 * 搜索无结果组件
 * Story 2.5: 商品搜索功能
 */
const EmptyResult: React.FC<EmptyResultProps> = ({ keyword, onClear }) => {
  return (
    <View className='empty-result'>
      <View className='empty-icon'>
        <IconFont name='search' size='80' color='rgba(255,255,255,0.3)' />
      </View>
      <Text className='empty-text'>
        未找到与"{keyword}"相关的商品
      </Text>
      <View className='empty-hint'>
        <Text>试试其他关键词，或</Text>
        <Text className='clear-link' onClick={onClear}>清除搜索</Text>
      </View>
    </View>
  )
}

export default EmptyResult

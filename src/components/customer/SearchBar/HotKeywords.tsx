import { View, Text } from '@tarojs/components'
import { IconFont } from '@nutui/icons-react-taro'
import './HotKeywords.scss'

interface HotKeywordsProps {
  keywords: string[]
  onSelect: (keyword: string) => void
}

/**
 * 热门搜索组件
 * Story 2.5: 商品搜索功能
 */
const HotKeywords: React.FC<HotKeywordsProps> = ({ keywords, onSelect }) => {
  if (keywords.length === 0) return null

  return (
    <View className='hot-keywords'>
      <View className='hot-header'>
        <IconFont name='fire' size='16' color='#ff4800' />
        <Text className='title'>热门搜索</Text>
      </View>
      <View className='keyword-tags'>
        {keywords.map((item, index) => (
          <View
            key={index}
            className='keyword-tag'
            onClick={() => onSelect(item)}
          >
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default HotKeywords

import { View, Text } from '@tarojs/components'
import { IconFont } from '@nutui/icons-react-taro'
import './SearchHistory.scss'

interface SearchHistoryProps {
  history: string[]
  onSelect: (keyword: string) => void
  onClear: () => void
}

/**
 * 搜索历史组件
 * Story 2.5: 商品搜索功能
 */
const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onClear
}) => {
  if (history.length === 0) return null

  return (
    <View className='search-history'>
      <View className='history-header'>
        <Text className='title'>搜索历史</Text>
        <View className='clear-btn' onClick={onClear}>
          <IconFont name='del' size='14' color='rgba(255,255,255,0.5)' />
          <Text className='clear-text'>清空</Text>
        </View>
      </View>
      <View className='history-tags'>
        {history.map((item, index) => (
          <View
            key={index}
            className='history-tag'
            onClick={() => onSelect(item)}
          >
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default SearchHistory

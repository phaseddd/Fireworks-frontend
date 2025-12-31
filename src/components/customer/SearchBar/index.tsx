import { View, Input } from '@tarojs/components'
import { IconFont } from '@nutui/icons-react-taro'
import './index.scss'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFocus?: () => void
}

/**
 * 搜索框组件
 * Story 2.5: 商品搜索功能
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '搜索商品',
  onFocus
}) => {
  const handleInput = (e: any) => {
    onChange(e.detail.value)
  }

  // 清空输入内容
  const handleClear = () => {
    onChange('')
  }

  return (
    <View className='search-bar'>
      <View className='search-input-wrapper'>
        <IconFont name='search' size='20' color='rgba(255,255,255,0.5)' />
        <Input
          className='search-input'
          value={value}
          placeholder={placeholder}
          placeholderClass='search-placeholder'
          onInput={handleInput}
          onFocus={onFocus}
        />
        {/* 只在有输入内容时显示清空按钮 */}
        {value && (
          <View className='clear-btn' onClick={handleClear}>
            <View className='clear-icon'>×</View>
          </View>
        )}
      </View>
    </View>
  )
}

export default SearchBar

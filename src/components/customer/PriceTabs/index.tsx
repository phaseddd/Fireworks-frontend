import { View } from '@tarojs/components'
import { ScrollView } from '@tarojs/components'
import './index.scss'

// 价格区间选项配置
const priceOptions = [
  { value: '', text: '全部价格', min: undefined, max: undefined },
  { value: '0-100', text: '100以下', min: 0, max: 100 },
  { value: '100-300', text: '100-300', min: 100, max: 300 },
  { value: '300-500', text: '300-500', min: 300, max: 500 },
  { value: '500-', text: '500以上', min: 500, max: undefined },
]

export interface PriceRange {
  value: string
  min?: number
  max?: number
}

interface PriceTabsProps {
  value: string
  onChange: (range: PriceRange) => void
}

/**
 * 价格区间筛选组件
 * - 横向滚动显示所有价格区间选项
 * - 点击选项触发 onChange 回调
 * - 当前选中项有高亮样式
 */
const PriceTabs: React.FC<PriceTabsProps> = ({ value, onChange }) => {
  const handleClick = (option: typeof priceOptions[0]) => {
    onChange({
      value: option.value,
      min: option.min,
      max: option.max,
    })
  }

  return (
    <ScrollView className='price-tabs' scrollX>
      <View className='price-tabs-inner'>
        {priceOptions.map((item) => (
          <View
            key={item.value}
            className={`tab-item ${value === item.value ? 'active' : ''}`}
            onClick={() => handleClick(item)}
          >
            {item.text}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default PriceTabs

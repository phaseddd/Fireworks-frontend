import { View } from '@tarojs/components'
import { ScrollView } from '@tarojs/components'
import './index.scss'

// 分类选项配置
const categoryOptions = [
  { value: '', text: '全部' },
  { value: 'GIFT', text: '礼花类' },
  { value: 'FIREWORK', text: '烟花类' },
  { value: 'FIRECRACKER', text: '鞭炮类' },
  { value: 'COMBO', text: '组合类' },
  { value: 'OTHER', text: '其他' },
]

interface CategoryTabsProps {
  value: string
  onChange: (category: string) => void
}

/**
 * 分类筛选栏组件
 * - 横向滚动显示所有分类选项
 * - 点击分类触发 onChange 回调
 * - 当前选中项有高亮样式
 */
const CategoryTabs: React.FC<CategoryTabsProps> = ({ value, onChange }) => {
  return (
    <ScrollView className='category-tabs' scrollX>
      <View className='category-tabs-inner'>
        {categoryOptions.map((item) => (
          <View
            key={item.value}
            className={`tab-item ${value === item.value ? 'active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            {item.text}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default CategoryTabs

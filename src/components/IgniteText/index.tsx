import { View, Text } from '@tarojs/components'
import classNames from 'classnames'
import './index.scss'

interface IgniteTextProps {
  text: string
  className?: string
  /** 整体开始延迟 (ms) */
  delay?: number
  /** 每个字的点燃间隔 (ms) */
  interval?: number
  /** 字体大小 (px/rpx) */
  fontSize?: string | number
}

export default function IgniteText({ 
  text, 
  className, 
  delay = 0, 
  interval = 100,
  fontSize
}: IgniteTextProps) {
  const chars = text.split('')

  return (
    <View className={classNames('ignite-text-container', className)}>
      {chars.map((char, index) => (
        <Text
          key={index}
          className='ignite-char'
          style={{
            animationDelay: `${delay + index * interval}ms`,
            fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize
          }}
        >
          {char}
        </Text>
      ))}
    </View>
  )
}

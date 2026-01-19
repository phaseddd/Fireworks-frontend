import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useNavBarMetrics } from '@/hooks/useNavBarMetrics';
import './index.scss';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  transparent?: boolean;
  showBack?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, transparent = true, showBack = true }) => {
  const { statusBarHeight, navBarHeight, totalHeight } = useNavBarMetrics();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      Taro.navigateBack();
    }
  };

  return (
    <View 
      className="page-header" 
      style={{ 
        paddingTop: `${statusBarHeight}px`,
        height: `${totalHeight}px`,
        background: transparent ? 'transparent' : 'var(--c-bg-page)'
      }}
    >
      <View className="header-content" style={{ height: `${navBarHeight}px` }}>
        {showBack && (
          <View className="back-btn" onClick={handleBack}>
            <Text className="back-icon" style={{ fontSize: '20px', fontWeight: 'bold' }}>{'<'}</Text>
          </View>
        )}
        <Text className="title">{title}</Text>
      </View>
    </View>
  );
};

export default PageHeader;

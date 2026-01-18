import React from 'react';
import { View } from '@tarojs/components';
import classNames from 'classnames';
import './index.scss';

interface GlassCardProps {
  children: React.ReactNode;
  onClick?: (event?: any) => void;
  padding?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  onClick,
  padding = '32rpx',
  className,
  style,
}) => {
  const styles = {
    padding: typeof padding === 'number' ? `${padding}rpx` : padding,
    ...style,
  };

  return (
    <View
      className={classNames('glass-card', { clickable: !!onClick }, className)}
      onClick={onClick}
      style={styles}
    >
      {children}
    </View>
  );
};

export default GlassCard;

import React from 'react';
import { View } from '@tarojs/components';
import classNames from 'classnames';
import './index.scss';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'default';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  icon,
  className,
  style,
}) => {
  return (
    <View
      className={classNames('glass-button', variant, className)}
      onClick={onClick}
      style={style}
    >
      {icon && <View className="icon">{icon}</View>}
      {children}
    </View>
  );
};

export default GlassButton;

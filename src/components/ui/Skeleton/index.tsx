import React from 'react';
import { View } from '@tarojs/components';
import classNames from 'classnames';
import './index.scss';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className,
  style,
}) => {
  const styles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}rpx` : width,
    height: typeof height === 'number' ? `${height}rpx` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}rpx` : borderRadius,
    ...style,
  };

  return (
    <View
      className={classNames('skeleton', className)}
      style={styles}
    />
  );
};

export default Skeleton;

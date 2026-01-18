// src/components/FireworksCanvas/index.tsx
import { View, Canvas } from '@tarojs/components';
import Taro, { useReady, useUnload } from '@tarojs/taro';
import { useRef, useEffect } from 'react';
import { FireworksRenderer } from './renderer';
import './index.scss';

export default function FireworksCanvas() {
  const rendererRef = useRef<FireworksRenderer | null>(null);
  
  // 使用 useReady 确保 Canvas 节点已挂载 (Taro Canvas 2D 必须)
  useReady(() => {
    const query = Taro.createSelectorQuery();
    query.select('#fireworks-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        
        const canvas = res[0].node;
        const width = res[0].width;
        const height = res[0].height;
        const dpr = Taro.getSystemInfoSync().pixelRatio;

        // 初始化渲染器
        rendererRef.current = new FireworksRenderer(canvas, width, height, dpr);
        rendererRef.current.start();
      });
  });

  useUnload(() => {
    rendererRef.current?.stop();
    rendererRef.current = null;
  });

  // 触摸交互
  const handleTouchMove = (e) => {
    if (!rendererRef.current) return;
    const { x, y } = e.touches[0];
    // 注意：Taro 的触摸坐标通常是相对于视口的，Canvas 是全屏覆盖，可以直接用
    rendererRef.current.addTouchTrail(x, y);
  };
  
  const handleTouchStart = (e) => {
      if (!rendererRef.current) return;
      const { x, y } = e.touches[0];
      rendererRef.current.addTouchTrail(x, y);
  };

  return (
    <View className="fireworks-container">
      <Canvas
        id="fireworks-canvas"
        type="2d"
        className="fireworks-canvas"
        disableScroll={true} // 禁止 Canvas 内部滚动穿透
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />
    </View>
  );
}

// src/components/FireworksCanvas/particle.ts

/**
 * 粒子类型：升空(rocket)、爆炸(spark)、触摸拖尾(trail)
 */
export type ParticleType = 'rocket' | 'spark' | 'trail';

export interface ParticleConfig {
  x: number;
  y: number;
  color: string;
  type: ParticleType;
  vx?: number;
  vy?: number;
  size?: number;
  alpha?: number;
  decay?: number;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  type: ParticleType;
  life: number;
  decay: number;
  gravity: number;
  friction: number;

  constructor(config: ParticleConfig) {
    this.reset(config);
  }

  reset(config: ParticleConfig) {
    this.x = config.x;
    this.y = config.y;
    this.color = config.color;
    this.type = config.type;
    
    // 根据类型初始化物理参数
    switch (this.type) {
      case 'rocket':
        // 升空粒子：垂直向上，速度较快
        this.vx = (Math.random() - 0.5) * 1; 
        this.vy = -(Math.random() * 3 + 4); // 初始向上速度
        this.size = 2;
        this.alpha = 1;
        this.decay = 0.005; // 缓慢消散
        this.gravity = 0.05;
        this.friction = 0.99;
        this.life = 100; // 这里的 life 更多作为逻辑判断辅助
        break;

      case 'spark':
        // 爆炸粒子：向四周扩散
        const angle = Math.random() * Math.PI * 2;
        // 速度翻倍：从 3+1 改为 5+3，让爆炸半径更大
        const speed = Math.random() * 5 + 3; 
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        // 粒子稍微变大一点
        this.size = Math.random() * 2.5 + 1;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01; // 稍微减慢消散速度
        this.gravity = 0.04; // 减小重力，滞空感更强
        this.friction = 0.96; // 稍微减小阻力(数值越大阻力越小)，飞得更远
        this.life = 100;
        break;

      case 'trail':
        // 触摸拖尾：跟随手指，迅速消散
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 1.5 + 0.5;
        this.alpha = 0.8;
        this.decay = 0.05; // 极快消散
        this.gravity = 0;
        this.friction = 0.96;
        this.life = 100;
        break;
      
      default:
        // 默认兜底
        this.vx = 0;
        this.vy = 0;
        this.size = 1;
        this.alpha = 1;
        this.decay = 0.1;
        this.gravity = 0;
        this.friction = 1;
        this.life = 0;
    }

    // 允许外部覆盖
    if (config.vx !== undefined) this.vx = config.vx;
    if (config.vy !== undefined) this.vy = config.vy;
    if (config.size !== undefined) this.size = config.size;
    if (config.alpha !== undefined) this.alpha = config.alpha;
    if (config.decay !== undefined) this.decay = config.decay;
  }

  update() {
    // 物理运动
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // 生命衰减
    this.alpha -= this.decay;
  }

  draw(ctx: any) { // 使用 any 适配小程序 CanvasContext
    if (this.alpha <= 0) return;
    
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  isDead(): boolean {
    return this.alpha <= 0;
  }
}

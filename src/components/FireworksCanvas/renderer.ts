// src/components/FireworksCanvas/renderer.ts
import { Particle, ParticleConfig } from './particle';

// Molten 主题配色 (黑金橙) + 赛博霓虹扩展
const COLORS = {
  ROCKET: '#FFD700', // 金色升空
  // 更加多彩的爆炸色盘：红橙金白 + 霓虹紫、赛博蓝、荧光绿、热粉
  SPARKS: [
    '#FF4800', // 霓虹橙
    '#FF8C00', // 深橙
    '#FFD700', // 金色
    '#FFFFFF', // 纯白
    '#FF2400', // 朱红
    '#00F0FF', // 赛博蓝 (新增)
    '#9D00FF', // 霓虹紫 (新增)
    '#FF0099', // 热粉 (新增)
    '#39FF14', // 荧光绿 (新增)
  ], 
  TRAIL: ['#00F0FF', '#0099FF', '#FFFFFF'] // 触摸拖尾 (赛博蓝)
};

export class FireworksRenderer {
  canvas: any;
  ctx: any;
  width: number;
  height: number;
  dpr: number;
  
  particles: Particle[] = [];
  pool: Particle[] = []; // 对象池
  
  lastLaunchTime: number = 0;
  launchInterval: number = 800; // ms
  
  animationId: number | null = null;
  isRunning: boolean = false;

  constructor(canvas: any, width: number, height: number, dpr: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    // 初始化画布尺寸
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
    
    // 预创建对象池 (200个)
    for (let i = 0; i < 200; i++) {
      this.pool.push(new Particle({ x: 0, y: 0, color: '#fff', type: 'spark' }));
    }
  }

  // 从池中获取粒子
  private spawnParticle(config: ParticleConfig) {
    let p: Particle;
    // 寻找一个死掉的粒子复用
    const deadIndex = this.particles.findIndex(p => p.isDead());
    
    if (deadIndex !== -1) {
      p = this.particles[deadIndex];
      p.reset(config);
    } else {
      // 如果没有死粒子且池还有余粮
      if (this.pool.length > 0) {
        p = this.pool.pop()!;
        p.reset(config);
        this.particles.push(p);
      } else {
        // 池也空了，强制回收最老的粒子（视情况，或者就不生成了）
        // 这里简单处理：不做额外操作，忽略本次生成请求，保证性能
        return;
      }
    }
  }

  // 发射升空烟花
  private launchRocket() {
    const startX = Math.random() * (this.width * 0.8) + (this.width * 0.1); // 居中 80% 区域
    const startY = this.height;
    
    this.spawnParticle({
      x: startX,
      y: startY,
      color: COLORS.ROCKET,
      type: 'rocket'
    });
  }

  // 爆炸逻辑
  private explode(x: number, y: number) {
    // 爆炸产生更多粒子：从 30-50 增加到 60-90
    const count = 60 + Math.floor(Math.random() * 30);
    
    for (let i = 0; i < count; i++) {
      const color = COLORS.SPARKS[Math.floor(Math.random() * COLORS.SPARKS.length)];
      this.spawnParticle({
        x,
        y,
        color,
        type: 'spark'
      });
    }
  }

  // 触摸拖尾
  addTouchTrail(x: number, y: number) {
    // 每次触摸生成 2-3 个粒子
    for (let i = 0; i < 2; i++) {
      const color = COLORS.TRAIL[Math.floor(Math.random() * COLORS.TRAIL.length)];
      this.spawnParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        color,
        type: 'trail'
      });
    }
  }

  // 渲染循环
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    const loop = (timestamp: number) => {
      if (!this.isRunning) return;

      // 1. 自动发射逻辑
      if (timestamp - this.lastLaunchTime > this.launchInterval) {
        this.launchRocket();
        this.lastLaunchTime = timestamp;
        // 随机下一次间隔
        this.launchInterval = 500 + Math.random() * 1000;
      }

      // 2. 绘制拖尾背景 (关键视觉效果)
      // 修改为 destination-out 模式：擦除画布上的已有内容（变淡），而不是盖一层黑
      // 这样背景始终保持透明，能透出底下的月亮和星星
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Alpha 0.1 表示每一帧擦除 10% 的不透明度，留下 90%
      this.ctx.fillRect(0, 0, this.width, this.height);

      // 3. 启用混合模式 (发光效果)
      this.ctx.globalCompositeOperation = 'lighter';

      // 4. 更新和绘制粒子
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        
        // 记录状态
        const wasRocket = p.type === 'rocket';
        const oldVy = p.vy;

        p.update();
        p.draw(this.ctx);

        // 逻辑判断：升空粒子到达顶点或速度向下时爆炸
        if (wasRocket && !p.isDead()) {
           // 调整爆炸高度：设置到 0.25 (屏幕顶部 25% 处)
           // 之前的 0.38 仍然感觉视觉偏低，容易遮挡文字。
           // 抬高到 0.25，让烟花在月亮下方、文字上方炸开，形成完美的"上-中-下"层次。
           if (p.vy >= 0 || p.y < this.height * 0.25) { 
             p.alpha = 0; // 立即销毁 rocket
             this.explode(p.x, p.y); // 原位爆炸
           }
        }
      }

      this.canvas.requestAnimationFrame(loop);
    };

    this.canvas.requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      this.canvas.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resize(width: number, height: number) {
     this.width = width;
     this.height = height;
     this.canvas.width = width * this.dpr;
     this.canvas.height = height * this.dpr;
     this.ctx.scale(this.dpr, this.dpr);
  }
}

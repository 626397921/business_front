<template>
  <div class="home-container">
    <div
      class="physics-container"
      ref="physicsContainer"
      @click="handleClickParticle"
      @mousemove="throttleMouseMove"
    >
      <!-- 鱼形鼠标跟随（核心修改：添加旋转角度） -->
      <div
        class="follow-fish"
        ref="followFish"
        :style="{ transform: `translate(${fishX}px, ${fishY}px) rotate(${rotateAngle}deg)` }"
      ></div>
    </div>

    <div class="home-content">
      <div class="welcome-card" v-if="userInfo.username">
        <h2>欢迎回来，<span class="username">{{ userInfo.username }}</span></h2>
        <p class="role-tag">{{ userInfo.role }}</p>
      </div>
      <div class="welcome-card" v-else>
        <h2>欢迎使用<span class="highlight">业务管理系统</span></h2>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 用户信息
const userInfo = reactive({
  username: '',
  role: '',
  permissions: []
})

// 鱼形鼠标跟随（替换原气泡变量）
const fishX = ref(0)
const fishY = ref(0)
const rotateAngle = ref(0) // 鱼的旋转角度（控制朝向）
const physicsContainer = ref(null)
const followFish = ref(null)

// 粒子管理（拆分初始+点击粒子，新增清理机制）
let initialParticles = []
let clickParticles = []
let animationFrameId = null
let mousePos = { x: 0, y: 0 }
let lastMousePos = { x: 0, y: 0 } // 记录上一帧鼠标位置（计算移动方向）
let containerRect = null
let isAllInitialLanded = false

// 【核心优化1】物理参数：减少粒子数量、调快运动节奏，提升流畅度
const PHYSICS = {
  friction: 0.98,        // 增大摩擦力，粒子更快减速
  bounce: 0.6,          // 减小回弹，减少反复弹跳
  gravity: 0.06,        // 【修改】重力调小，下落速度变慢（原0.12）
  maxParticles: 60,     // 初始粒子减少（大屏60，小屏30）
  repelForce: 1.8,      // 减小排斥力，降低计算量
  repelRadius: 100,     // 缩小排斥半径，减少影响范围
  fishEase: 0.15,     // 鱼缓动更顺滑
  scrollEase: 0.08,     // 滚动缓动更流畅
  clickParticleCount: 20 // 点击生成粒子减少，避免卡顿
}

// 滚动相关
let scrollY = 0
let targetScrollY = 0
let isScrolling = false

// 工具函数：节流（增大延迟，减少触发频率）
function throttle(func, delay = 20) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      func.apply(this, args)
    }
  }
}

// 读取用户信息
function loadUserInfo() {
  try {
    const user = localStorage.getItem('userInfo')
    if (!user) return ElMessage.warning('未检测到登录信息，请先登录')
    const userData = JSON.parse(user)
    Object.assign(userInfo, {
      username: userData.username || '',
      role: userData.role || '',
      permissions: userData.permissions || []
    })
  } catch (err) {
    console.error('读取用户信息失败:', err)
    ElMessage.warning('用户信息解析异常，请重新登录')
  }
}

// 鱼跟随动画（保留原缓动逻辑，替换变量名）
let targetFishX = 0, targetFishY = 0
function updateFish() {
  fishX.value += (targetFishX - fishX.value) * PHYSICS.fishEase
  fishY.value += (targetFishY - fishY.value) * PHYSICS.fishEase
}

// 页面流动动画
function updateScroll() {
  const container = physicsContainer.value
  if (!container) return
  if (!isScrolling) {
    scrollY += Math.sin(Date.now() / 1200) * 0.6
  } else {
    scrollY += (targetScrollY - scrollY) * PHYSICS.scrollEase
    if (Math.abs(targetScrollY - scrollY) < 1) isScrolling = false
  }
  container.scrollTop = scrollY
}

// 检测粒子是否落地
function isParticleLanded(particle) {
  const isAtBottom = particle.y >= containerRect.height - particle.size - 1
  const isVelocityLow = Math.abs(particle.velocity.x) < 0.08 && Math.abs(particle.velocity.y) < 0.08
  return isAtBottom && isVelocityLow
}

// 检测初始粒子是否全部落地
function checkAllInitialLanded() {
  if (initialParticles.length === 0) return false
  return initialParticles.every(particle => isParticleLanded(particle))
}

// 【核心优化2】粒子清理：自动移除落地的点击粒子，防止DOM堆积
function cleanParticles() {
  // 清理点击粒子中已落地的元素
  clickParticles = clickParticles.filter(particle => {
    if (isParticleLanded(particle)) {
      particle.dom.remove()
      return false
    }
    return true
  })
}

// 粒子更新（简化物理计算，提升流畅度）
function updateParticles() {
  const container = physicsContainer.value
  if (!container || !containerRect) return

  const allParticles = [...initialParticles, ...clickParticles]
  allParticles.forEach(particle => {
    // 基础物理（简化运算，减少性能消耗）
    particle.velocity.y += PHYSICS.gravity
    particle.velocity.x *= PHYSICS.friction
    particle.velocity.y *= PHYSICS.friction

    // 鼠标排斥（简化距离计算）
    const dx = particle.x - mousePos.x
    const dy = particle.y - mousePos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < PHYSICS.repelRadius && dist > 0) {
      const force = (PHYSICS.repelRadius - dist) / PHYSICS.repelRadius
      particle.velocity.x += (dx / dist) * force * PHYSICS.repelForce
      particle.velocity.y += (dy / dist) * force * PHYSICS.repelForce
    }

    // 更新位置
    particle.x += particle.velocity.x
    particle.y += particle.velocity.y

    // 边界碰撞（简化回弹逻辑）
    if (particle.x <= 0) {
      particle.x = 0
      particle.velocity.x = -particle.velocity.x * PHYSICS.bounce
    }
    if (particle.x >= containerRect.width - particle.size) {
      particle.x = containerRect.width - particle.size
      particle.velocity.x = -particle.velocity.x * PHYSICS.bounce
    }
    if (particle.y <= 0) {
      particle.y = 0
      particle.velocity.y = -particle.velocity.y * PHYSICS.bounce
    }
    if (particle.y >= containerRect.height - particle.size) {
      particle.y = containerRect.height - particle.size
      particle.velocity.y = -particle.velocity.y * PHYSICS.bounce * 0.8
    }

    // 仅用transform更新，减少重绘
    particle.dom.style.transform = `translate(${particle.x}px, ${particle.y}px)`
  })
}

// 统一动画循环（替换气泡为鱼）
function updateLoop() {
  updateFish()
  updateScroll()
  updateParticles()
  cleanParticles() // 每帧清理过期粒子

  const allInitialLanded = checkAllInitialLanded()
  if (allInitialLanded && !isAllInitialLanded) {
    isAllInitialLanded = true
    const container = physicsContainer.value
    for (let i = 0; i < PHYSICS.maxParticles; i++) {
      initialParticles.push(createParticle(container))
    }
  } else if (!allInitialLanded) {
    isAllInitialLanded = false
  }

  animationFrameId = requestAnimationFrame(updateLoop)
}

// 点击生成粒子
function handleClickParticle(e) {
  const container = physicsContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top

  const shapeTypes = ['circle', 'heart', 'ellipse', 'diamond', 'star', 'triangle', 'hexagon', 'square']
  const randomShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]

  for (let i = 0; i < PHYSICS.clickParticleCount; i++) {
    clickParticles.push(createParticle(container, clickX, clickY, randomShape))
  }
}

// 【核心升级】明亮温柔马卡龙色系：高饱和低刺眼，温柔鲜艳兼具
function createParticle(container, initX = null, initY = null, shapeType = 'circle') {
  const particle = document.createElement('div')
  particle.className = 'particle wave-particle'

  // 【修改】粒子尺寸整体调小，保持大小差距
  let size = initX !== null
    ? Math.random() * 10 + 5  // 点击粒子：5-15px（原8-23px，微调缩小）
    : Math.random() * 12 + 6 // 初始粒子：6-18px（原10-28px，微调缩小）

  // ========== 核心颜色配置：明亮温柔马卡龙色系，鲜艳不刺眼 ==========
  // 1. 主色系：清新柔亮（薄荷绿、樱花粉、天空蓝，占比最高，温柔基底）
  const mainSoftColors = [
    '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94', // 马卡龙基础色
    '#87CEEB', '#F0C987', '#DDA0DD', '#98FB98', '#FFB6C1', // 清新扩展色
    '#87CEFA', '#E6E6FA', '#FFE4B5', '#90EE90', '#FFC0CB'  // 温柔补充色
  ]
  // 2. 鲜艳提亮色：高饱和但柔和（珊瑚粉、柠檬黄、浅紫，突出视觉焦点）
  const brightSoftColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FF8C00', '#32CD32', '#FF69B4', '#00CED1'
  ]
  // 3. 梦幻辅助色：浅紫、浅蓝、浅橙，丰富层次不抢戏
  const dreamAssistColors = [
    '#B19CD9', '#87CEEB', '#FFB347', '#F4A460', '#D8BFD8',
    '#AFEEEE', '#FFDEAD', '#D2B48C', '#F0E68C', '#DEB887'
  ]

  // 颜色权重分配：60%主温柔色 + 30%鲜艳提亮色 + 10%梦幻辅助色（鲜艳且协调）
  let color;
  const randomWeight = Math.random();
  if (randomWeight < 0.6) {
    color = mainSoftColors[Math.floor(Math.random() * mainSoftColors.length)];
  } else if (randomWeight < 0.9) {
    color = brightSoftColors[Math.floor(Math.random() * brightSoftColors.length)];
  } else {
    color = dreamAssistColors[Math.floor(Math.random() * dreamAssistColors.length)];
  }

  // ========== 透明度分层：柔和通透+明亮高亮，温柔不杂乱 ==========
  let opacity;
  const opacityRandom = Math.random();
  if (opacityRandom < 0.7) {
    // 70% 低透明（柔和背景，轻盈通透）
    opacity = Math.random() * 0.2 + 0.15; // 0.15-0.35
  } else if (opacityRandom < 0.9) {
    // 20% 中透明（过渡层次，清晰柔和）
    opacity = Math.random() * 0.2 + 0.45; // 0.45-0.65
  } else {
    // 10% 高透明明亮色（点睛效果，鲜艳突出）
    opacity = Math.random() * 0.15 + 0.8; // 0.8-0.95
  }

  // 【修改】粒子初始速度调小，配合重力实现更慢的下落/运动效果
  const x = initX !== null ? initX : Math.random() * (containerRect.width - size)
  const y = initY !== null ? initY : Math.random() * (containerRect.height - size)
  const speed = initX !== null ? (Math.random() * 3 + 1.5) : (Math.random() * 0.6 + 0.2) // 点击速度：1.5-4.5px，初始速度：0.2-0.8px（原2-6/0.3-1.3px）
  const angle = Math.random() * Math.PI * 2
  const velocity = {
    x: Math.cos(angle) * speed * (Math.random() - 0.5),
    y: Math.sin(angle) * speed * (Math.random() - 0.5)
  }

  // 基础样式（轻量化，减少渲染消耗）
  const baseStyle = {
    position: 'absolute',
    opacity: opacity,
    boxShadow: `0 1px 4px ${color}33`, // 柔和阴影，适配马卡龙色系
    willChange: 'transform',
    pointerEvents: 'none',
    zIndex: 15,
    backgroundColor: color
  }

  // 形状样式（保持原有，适配小尺寸）
  let shapeStyle = {}
  switch(shapeType) {
    case 'circle':
      shapeStyle = { width: `${size}px`, height: `${size}px`, borderRadius: '50%' }
      break
    case 'heart':
      shapeStyle = { width: `${size}px`, height: `${size}px`, clipPath: 'path("M50% 0%, 65% 20%, 100% 30%, 80% 60%, 50% 100%, 20% 60%, 0% 30%, 35% 20%")' }
      break
    case 'ellipse':
      shapeStyle = { width: `${size * 1.5}px`, height: `${size}px`, borderRadius: '50%' }
      break
    case 'diamond':
      shapeStyle = { width: `${size}px`, height: `${size}px`, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }
      break
    case 'star':
      shapeStyle = { width: `${size}px`, height: `${size}px`, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }
      break
    case 'triangle':
      shapeStyle = { width: `${size}px`, height: `${size}px`, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }
      break
    case 'hexagon':
      shapeStyle = { width: `${size}px`, height: `${size}px`, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }
      break
    case 'square':
      shapeStyle = { width: `${size}px`, height: `${size}px`, borderRadius: '0' }
      break
  }

  Object.assign(particle.style, baseStyle, shapeStyle)
  container.appendChild(particle)
  return { dom: particle, x, y, size, velocity }
}

// 鼠标移动（新增角度计算，控制鱼的朝向）
const throttleMouseMove = throttle((e) => {
  const container = physicsContainer.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  // 更新当前鼠标位置
  mousePos.x = e.clientX - rect.left
  mousePos.y = e.clientY - rect.top

  // 计算鼠标移动方向，更新鱼的旋转角度
  const dx = mousePos.x - lastMousePos.x
  const dy = mousePos.y - lastMousePos.y
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { // 避免微小移动导致角度抖动
    rotateAngle.value = Math.atan2(dy, dx) * (180 / Math.PI) // 弧度转角度
  }
  lastMousePos = { ...mousePos } // 记录上一帧鼠标位置

  // 更新鱼的目标位置（居中跟随）
  targetFishX = mousePos.x - followFish.value.offsetWidth / 2
  targetFishY = mousePos.y - followFish.value.offsetHeight / 2
})

// 生命周期
onMounted(() => {
  const container = physicsContainer.value
  if (!container) return

  containerRect = container.getBoundingClientRect()
  PHYSICS.maxParticles = containerRect.width < 768 ? 30 : 60

  for (let i = 0; i < PHYSICS.maxParticles; i++) {
    initialParticles.push(createParticle(container))
  }

  loadUserInfo()
  updateLoop()

  window.addEventListener('resize', () => {
    containerRect = container.getBoundingClientRect()
    PHYSICS.maxParticles = containerRect.width < 768 ? 30 : 60
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  initialParticles.forEach(p => p.dom.remove())
  clickParticles.forEach(p => p.dom.remove())
  initialParticles = []
  clickParticles = []
  window.removeEventListener('resize', () => {})
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 100px);
  background-color: #F8F9FA;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.physics-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: auto;
  z-index: 1;
  will-change: scroll-position;
}

/* 滚动条美化（马卡龙色系，柔和不突兀） */
.physics-container::-webkit-scrollbar { width: 6px; }
.physics-container::-webkit-scrollbar-thumb { background-color: rgba(255, 182, 193, 0.3); border-radius: 3px; }
.physics-container::-webkit-scrollbar-track { background-color: transparent; }

/* 【核心修改】鱼形鼠标跟随：形状+摆动动画 */
.follow-fish {
  position: absolute;
  width: 60px;
  height: 30px;
  background-color: rgba(255, 183, 197, 0.15); /* 浅粉通透，保留原风格 */
  /* clip-path 绘制鱼形：身体+尾巴+鱼鳍 */
  clip-path: polygon(
    10% 50%,   /* 鱼嘴 */
    30% 0%,    /* 上背鳍前 */
    70% 0%,    /* 上背鳍后 */
    90% 30%,   /* 鱼尾上 */
    80% 50%,   /* 鱼尾中 */
    90% 70%,   /* 鱼尾下 */
    70% 100%,  /* 下腹鳍后 */
    30% 100%,  /* 下腹鳍前 */
    10% 50%    /* 鱼嘴闭合 */
  );
  pointer-events: none;
  box-shadow: 0 3px 12px rgba(255, 183, 197, 0.25); /* 柔和阴影 */
  z-index: 10;
  will-change: transform;
  /* 鱼鳍/尾巴摆动动画 */
  animation: fishSwing 1s infinite ease-in-out;
}

/* 鱼摆动动画：尾巴左右摆动，更生动 */
@keyframes fishSwing {
  0%, 100% {
    clip-path: polygon(
      10% 50%, 30% 0%, 70% 0%, 90% 30%, 80% 50%, 90% 70%, 70% 100%, 30% 100%, 10% 50%
    );
  }
  50% {
    clip-path: polygon(
      10% 50%, 25% 5%, 75% 5%, 88% 35%, 80% 50%, 88% 65%, 75% 95%, 25% 95%, 10% 50%
    );
  }
}

.particle {
  position: absolute;
  pointer-events: none;
}
.wave-particle {
  filter: blur(0.5px); /* 减小模糊，提升清晰度 */
}

.home-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 20;
  pointer-events: none;
  width: 90%;
  max-width: 600px;
}

.welcome-card {
  background: rgba(255, 255, 255, 0.9); /* 更通透的白色卡片 */
  padding: 30px 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06); /* 更柔和的阴影 */
  backdrop-filter: blur(10px);
}
.welcome-card h2 {
  font-size: 32px;
  color: #4a4a4a; /* 温柔深灰，不刺眼 */
  margin-bottom: 12px;
  font-weight: 600;
}
/* 用户名高亮（明亮珊瑚粉，鲜艳温柔） */
.welcome-card .username { color: #FF6B6B; font-weight: 700; }
/* 系统名称高亮（清新薄荷绿，明亮协调） */
.welcome-card .highlight { color: #4ECDC4; }
/* 角色标签（浅紫温柔背景，薰衣草紫文字） */
.welcome-card .role-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: rgba(189, 174, 222, 0.15);
  color: #9370DB;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}
.welcome-card p { font-size: 16px; color: #777; margin: 0; }

@media (max-width: 768px) {
  .welcome-card { padding: 20px 25px; }
  .welcome-card h2 { font-size: 24px; }
  .welcome-card p { font-size: 14px; }
  /* 移动端鱼形尺寸适配 */
  .follow-fish { width: 40px; height: 20px; }
}
</style>
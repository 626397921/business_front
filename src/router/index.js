import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import LayoutView from '../views/LayoutView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    path: '/layout',  // 独立路径避免根路径冲突
    name: 'LayoutView',
    component: LayoutView,
    children: [
      // 首页
      {
        path: 'home',
        name: 'HomeView',
        component: () => import('../views/HomeView.vue')
      },

      // 计算模块
      {
        path: 'calculation/raw-material',
        name: 'RawMaterial',
        component: () => import('../views/calculation/RawMaterial.vue')
      },
      {
        path: 'calculation/exchange-rate',
        name: 'ExchangeRate',
        component: () => import('../views/calculation/ExchangeRate.vue')
      },
      {
        path: 'calculation/yarn-quote',
        name: 'YarnQuote',
        component: () => import('../views/calculation/YarnQuote.vue')
      },
      {
        path: 'calculation/knitted-fabric-quote',
        name: 'KnittedFabricQuote',
        component: () => import('../views/calculation/KnittedFabricQuote.vue')
      },

      // 业务管理模块
      {
        path: 'business/customer-management',
        name: 'CustomerManagement',
        component: () => import('../views/business/CustomerManagement.vue')
      },

      // 用户管理模块
      {
        path: 'users/user-list',
        name: 'UserList',
        component: () => import('../views/users/UserList.vue')
      },

      // 货运模块（补充缺失的运费报价路由）
      {
        path: 'freight/freight-forwarder',
        name: 'FreightForwarderList',
        component: () => import('../views/freight/FreightForwarderList.vue')
      },

      // 生产记录模块（修复：路径改为production-record，匹配菜单路径）
      {
        path: 'production-record',  // 关键修改：去掉重复的production-record
        name: 'ProductionRecord',
        component: () => import('../views/production-record/ProductionRecord.vue')
      }
    ]
  },
  // 404重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 优化后的登录态路由守卫
router.beforeEach((to, from, next) => {
  // 白名单：匹配路径或路由name
  const whiteList = ['/login', 'LoginPage']
  const isLogin = localStorage.getItem('isLogin') === 'true'

  // 判断是否在白名单
  const isWhiteList = whiteList.includes(to.path) || whiteList.includes(to.name)

  if (isWhiteList) {
    // 已登录用户访问登录页，自动跳首页
    isLogin ? next('/layout/home') : next()
  } else {
    // 未登录用户访问非白名单页面，跳登录页；已登录则放行
    isLogin ? next() : next('/login')
  }
})

export default router
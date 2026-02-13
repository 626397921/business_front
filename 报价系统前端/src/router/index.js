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
    path: '/layout',  // 新增独立路径，避免和根路径冲突
    name: 'LayoutView',
    component: LayoutView,
    children: [
      {
        path: 'home',  // 最终路径：/layout/home
        name: 'HomeView',
        component: () => import('../views/HomeView.vue')
      },
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
      {
        path: 'business/customer-management',
        name: 'CustomerManagement',
        component: () => import('../views/business/CustomerManagement.vue')
      },
      {
        path: 'business/order-management',
        name: 'OrderManagement',
        component: () => import('../views/business/OrderManagement.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 优化路由守卫：更健壮的登录态判断
router.beforeEach((to, from, next) => {
  // 白名单：同时匹配路径和name，避免name未定义的情况
  const whiteList = ['/login', 'LoginPage']
  const isLogin = localStorage.getItem('isLogin') === 'true'

  // 判断是否在白名单（路径或name匹配其一即可）
  const isWhiteList = whiteList.includes(to.path) || whiteList.includes(to.name)

  if (isWhiteList) {
    if (isLogin) {
      next('/layout/home') // 已登录则跳首页
    } else {
      next() // 未登录则放行到登录页
    }
  } else {
    // 非白名单页面：未登录跳登录，已登录放行
    isLogin ? next() : next('/login')
  }
})
export default router
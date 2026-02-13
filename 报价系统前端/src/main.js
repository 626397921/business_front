import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Cookies from 'js-cookie'

// 统一配置全局axios，避免多个实例冲突
axios.defaults.withCredentials = true  // 允许跨域携带Cookie
axios.defaults.baseURL = '/api'  // 统一前缀，匹配后端/api路径
axios.defaults.timeout = 15000
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

// 请求拦截器：自动添加CSRF Token
axios.interceptors.request.use(config => {
  const csrfToken = Cookies.get('csrftoken')
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken
  }
  console.log(`【全局请求】${config.method.toUpperCase()} ${config.url}`, config.data)
  return config
}, error => {
  console.error('【全局请求异常】', error)
  return Promise.reject(error)
})

// 全局响应拦截器（核心修改：兼容blob类型请求，保留原始响应）
// 替换你main.js里的【全局响应拦截器】这段代码即可
axios.interceptors.response.use(
  response => {
    console.log(`【全局响应】${response.config.url}`, response.data)
    // ========== 修复BUG：判断是否是文件下载请求 正确写法 ==========
    // 错误写法：response.request.responseType
    // 正确写法：response.config.responseType
    if (response.config.responseType === 'blob') {
      return response // 返沪完整响应对象，供下载逻辑获取headers + blob数据流
    }
    // 普通请求仍只返回data，不影响其他页面使用
    return response.data
  },
  error => {
    console.error('【全局响应异常】', error)
    // 统一包装错误信息
    const errMsg = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(errMsg))
  }
)

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.config.globalProperties.$axios = axios
app.mount('#app')
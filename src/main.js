// ========== 移到最顶部：终极版 ResizeObserver 补丁（彻底解决循环报错） ==========
if (window.ResizeObserver && !window.ResizeObserver.__patched__) {
  const OriginalResizeObserver = window.ResizeObserver;
  const observerInstances = new WeakSet();
  // 防抖延迟时间（ms），适配 Element Plus 组件的尺寸更新节奏
  const DEBOUNCE_DELAY = 16;
  // 存储待执行的回调任务，避免重复触发
  const pendingCallbacks = new Map();

  window.ResizeObserver = class PatchedResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      // 包装回调：增加防抖+异常捕获
      const wrappedCallback = (entries, observer) => {
        // 仅处理当前实例的回调，避免跨实例干扰
        if (!observerInstances.has(observer)) return;

        // 防抖核心：同一观察者短时间内多次触发，只执行最后一次
        const observerKey = observer;
        if (pendingCallbacks.has(observerKey)) {
          clearTimeout(pendingCallbacks.get(observerKey));
        }

        // 延迟执行（用 setTimeout 兼容微任务+宏任务，彻底阻断同步循环）
        const timeoutId = setTimeout(() => {
          try {
            callback(entries, observer);
          } catch (err) {
            // 仅忽略 ResizeObserver 良性循环警告，其他错误正常抛出
            const ignoreMsgs = [
              'ResizeObserver loop completed with undelivered notifications',
              'ResizeObserver loop limit exceeded'
            ];
            if (!ignoreMsgs.some(msg => err.message?.includes(msg))) {
              console.error('ResizeObserver 执行异常：', err);
              throw err;
            }
          } finally {
            pendingCallbacks.delete(observerKey);
          }
        }, DEBOUNCE_DELAY);

        pendingCallbacks.set(observerKey, timeoutId);
      };

      super(wrappedCallback);
      observerInstances.add(this);
    }

    // 销毁时清理任务+弱引用，避免内存泄漏
    disconnect() {
      super.disconnect();
      observerInstances.delete(this);
      // 清理该实例的 pending 任务
      if (pendingCallbacks.has(this)) {
        clearTimeout(pendingCallbacks.get(this));
        pendingCallbacks.delete(this);
      }
    }

    unobserve(target) {
      super.unobserve(target);
    }
  };

  window.ResizeObserver.__patched__ = true;

  // 额外兜底：全局捕获未处理的 ResizeObserver 错误（兼容浏览器原生警告）
  window.addEventListener('error', (e) => {
    const ignoreMsgs = [
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver loop limit exceeded'
    ];
    if (ignoreMsgs.some(msg => e.message?.includes(msg))) {
      e.stopImmediatePropagation();
      e.preventDefault();
      // 开发环境可注释，生产环境屏蔽警告
      // console.debug('已屏蔽 ResizeObserver 良性循环警告');
      return true;
    }
  });
}

// ========== 库导入（补丁之后加载，确保生效） ==========
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import axios from 'axios'
import ElementPlus from 'element-plus'
import Cookies from 'js-cookie'

// 统一配置全局axios，避免多个实例冲突
axios.defaults.withCredentials = true
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 15000
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

// 请求拦截器：自动添加CSRF Token
axios.interceptors.request.use(config => {
  config.withCredentials = true
  const csrfToken = Cookies.get('csrftoken')
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken
  }
  const requestData = config.method.toUpperCase() === 'GET'
    ? '无请求体'
    : (config.data || '空请求体')
  console.log(`【全局请求】${config.method.toUpperCase()} ${config.url}`, requestData)
  return config
}, error => {
  console.error('【全局请求异常】', error)
  return Promise.reject(error)
})

// 全局响应拦截器（兼容blob类型请求，保留原始响应）
axios.interceptors.response.use(
  response => {
    console.log(`【全局响应】${response.config.url}`, response.data)
    if (response.config.responseType === 'blob') {
      return response
    }
    return response.data
  },
  error => {
    console.error('【全局响应异常】', error)
    const errMsg = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(errMsg))
  }
)

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
// 全局错误处理：捕获 Vue 渲染/更新中的 ResizeObserver 错误
app.config.errorHandler = (err) => {
  const ignoreMsgs = [
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded'
  ];
  if (!ignoreMsgs.some(msg => err.message?.includes(msg))) {
    console.error('Vue 全局异常：', err);
  }
};
app.config.globalProperties.$axios = axios
app.mount('#app')
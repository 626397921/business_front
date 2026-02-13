<template>
  <!-- 模板部分无修改，保留原样 -->
  <div class="login-container">
    <div class="login-card">
      <div class="logo-wrapper">
        <img src="@/assets/logo.png" alt="系统LOGO" class="logo-img" />
      </div>
      <h2 class="login-title">系统登录</h2>
      <div class="form-group">
        <input
          type="text"
          v-model="username"
          placeholder="请输入用户名"
          class="form-input"
          autocomplete="username"
          @keyup.enter="handleLogin"
        />
        <div class="password-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="请输入密码"
            class="form-input password-input"
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
          <span class="password-toggle" @click="showPassword = !showPassword">
            {{ showPassword ? '隐藏' : '显示' }}
          </span>
        </div>
        <select v-model="selectedRole" class="form-select" @keyup.enter="handleLogin">
          <option value="">请选择角色</option>
          <option value="超级管理员">超级管理员</option>
          <option value="业务员">业务员</option>
          <option value="财务">财务</option>
        </select>
        <div class="remember-wrapper">
          <input
            type="checkbox"
            v-model="rememberMe"
            id="remember"
            class="remember-checkbox"
          />
          <label for="remember" class="remember-label">记住密码（有效期7天）</label>
        </div>
        <button @click="handleLogin" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading">登录中...</span>
          <span v-else>登录</span>
        </button>
      </div>
    </div>
    <div v-if="popupVisible" class="popup-mask">
      <div class="popup-container">
        <div class="popup-header">
          <span class="popup-title" :class="popupType">
            {{ popupType === 'success' ? '登录成功' : '登录失败' }}
          </span>
          <span class="popup-close" @click="popupVisible = false">×</span>
        </div>
        <div class="popup-content">{{ popupMsg }}</div>
        <div class="popup-footer">
          <button @click="popupVisible = false" class="popup-btn">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import router from '@/router'
import Cookies from 'js-cookie'

// ========== 新增：兼容中文的Base64编解码函数 ==========
/**
 * 编码：UTF8字符串 → Base64
 * @param {string} str 要编码的字符串（支持中文）
 * @returns {string} Base64编码结果
 */
function utf8ToBase64(str) {
  // 先将字符串转为UTF-8格式的二进制，再编码
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * 解码：Base64 → UTF8字符串
 * @param {string} base64Str Base64编码字符串
 * @returns {string} 解码后的UTF8字符串
 */
function base64ToUtf8(base64Str) {
  // 先解码，再转回UTF-8格式
  return decodeURIComponent(escape(atob(base64Str)))
}

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      selectedRole: '',
      rememberMe: false,
      showPassword: false,
      popupVisible: false,
      popupType: 'success',
      popupMsg: '',
      isLoading: false,
      loginLock: false
    }
  },
  created() {
    this.clearInvalidLoginState()
    this.loadRememberedInfo()
  },
  methods: {
    clearInvalidLoginState() {
      const isLogin = localStorage.getItem('isLogin')
      const token = localStorage.getItem('token')
      if (isLogin === 'true' && !token) {
        localStorage.clear()
        Cookies.remove('loginInfo')
      }
    },

    /**
     * 加载记住的密码（改用兼容中文的解码函数）
     */
    loadRememberedInfo() {
      const savedLoginInfo = Cookies.get('loginInfo')
      if (savedLoginInfo) {
        try {
          // 替换atob → base64ToUtf8，兼容中文
          const decodedStr = base64ToUtf8(savedLoginInfo)
          const decoded = JSON.parse(decodedStr)
          this.username = decoded.username || ''
          this.password = decoded.password || ''
          this.selectedRole = decoded.role || ''
          this.rememberMe = true
        } catch (e) {
          console.error('读取记住密码信息失败：', e)
          Cookies.remove('loginInfo')
        }
      }
    },

    showPopup(type, msg) {
      this.popupType = type
      this.popupMsg = msg
      this.popupVisible = true
    },

    async handleLogin() {
      if (this.loginLock || this.isLoading) return
      this.loginLock = true

      if (!this.username.trim()) {
        this.showPopup('error', '请输入用户名！')
        this.loginLock = false
        return
      }
      if (!this.password.trim()) {
        this.showPopup('error', '请输入密码！')
        this.loginLock = false
        return
      }
      if (!this.selectedRole) {
        this.showPopup('error', '请选择登录角色！')
        this.loginLock = false
        return
      }

      this.isLoading = true

      try {
        const res = await this.$axios.post(
          '/users/login/',
          {
            username: this.username.trim(),
            password: this.password.trim(),
            role: this.selectedRole
          }
        )

        const userData = res.data || {}
        localStorage.setItem('isLogin', 'true')
        localStorage.setItem('username', userData.username || '')
        localStorage.setItem('userRole', userData.role || this.selectedRole)
        localStorage.setItem('token', userData.token || '')
        localStorage.setItem('permissions', JSON.stringify(userData.permissions || []))
        this.$axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token || ''}`

        // 记住密码（改用兼容中文的编码函数）
        if (this.rememberMe) {
          const loginInfo = {
            username: this.username.trim(),
            password: this.password.trim(),
            role: this.selectedRole
          }
          // 替换btoa → utf8ToBase64，兼容中文
          const encodedStr = JSON.stringify(loginInfo)
          const encoded = utf8ToBase64(encodedStr)
          Cookies.set('loginInfo', encoded, { expires: 7, path: '/' })
        } else {
          Cookies.remove('loginInfo')
        }

        this.showPopup('success', '登录成功，即将跳转首页！')
        setTimeout(() => {
          this.popupVisible = false
          router.push('/layout/home')
        }, 1500)

      } catch (error) {
        console.error('登录请求失败：', error)
        let errMsg = '登录失败，请重试！'
        if (error.message.includes('选择的角色不存在')) {
          errMsg = '选择的角色不存在，请确认角色名称！'
        } else if (error.message.includes('401')) {
          errMsg = '用户名/密码错误，或角色不匹配！'
        } else if (error.message.includes('403')) {
          errMsg = '该角色无登录权限，请联系管理员！'
        } else if (error.message.includes('超时')) {
          errMsg = '登录请求超时，请检查网络或后端服务！'
        } else if (error.message) {
          errMsg = error.message
        }
        this.showPopup('error', errMsg)
      } finally {
        this.isLoading = false
        this.loginLock = false
      }
    }
  }
}
</script>

<style scoped>
/* 样式部分无修改，保留原样 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f8fb 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 450px;
  padding: 45px 40px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.logo-wrapper {
  text-align: center;
  margin-bottom: 30px;
}
.logo-img {
  max-width: 120px;
  height: auto;
  object-fit: contain;
}

.login-title {
  text-align: center;
  color: #2d3748;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 35px;
  letter-spacing: 0.5px;
}

.form-group {
  width: 100%;
}

.form-input,
.form-select {
  width: 100%;
  padding: 14px 18px;
  margin: 12px 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  color: #2d3748;
  transition: all 0.3s ease;
  outline: none;
}
.form-input::placeholder,
.form-select::placeholder {
  color: #a0aec0;
}
.form-input:focus,
.form-select:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

.password-wrapper {
  position: relative;
  width: 100%;
  margin: 12px 0;
}
.password-input {
  padding-right: 70px !important;
}
.password-toggle {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}
.password-toggle:hover {
  color: #42b983;
}

.remember-wrapper {
  display: flex;
  align-items: center;
  margin: 15px 0 20px;
  font-size: 14px;
  color: #4a5568;
}
.remember-checkbox {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: #42b983;
}
.remember-label {
  cursor: pointer;
  transition: color 0.2s ease;
}
.remember-label:hover {
  color: #42b983;
}

.login-btn {
  width: 100%;
  padding: 14px 0;
  background: #42b983;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  letter-spacing: 0.5px;
}
.login-btn:hover {
  background: #359e6d;
}
.login-btn:disabled {
  background: #a7f3d0;
  cursor: not-allowed;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.popup-container {
  width: 360px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
.popup-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.popup-title {
  font-size: 16px;
  font-weight: 600;
}
.popup-title.success {
  color: #42b983;
}
.popup-title.error {
  color: #f56c6c;
}
.popup-close {
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  transition: color 0.2s ease;
}
.popup-close:hover {
  color: #2d3748;
}
.popup-content {
  padding: 25px 20px;
  font-size: 15px;
  color: #4a5568;
  text-align: center;
  line-height: 1.6;
}
.popup-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
.popup-btn {
  padding: 8px 24px;
  background: #42b983;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.popup-btn:hover {
  background: #359e6d;
}

@media (max-width: 500px) {
  .login-card {
    width: 90%;
    padding: 35px 25px;
  }
  .popup-container {
    width: 90%;
  }
}
</style>
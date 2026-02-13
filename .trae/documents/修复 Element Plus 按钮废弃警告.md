## 问题分析

Element Plus 3.0.0 版本中废弃了 `type="text"` 属性，建议使用 `type="link"` 替代。当前代码库中多处使用了 `type="text"`，导致控制台出现废弃警告。

## 解决方案

将所有 Element Plus 按钮的 `type="text"` 替换为 `type="link"`。

## 修改文件清单

1. **src/views/calculation/KnittedFabricQuote.vue**
   - 第 306 行：刷新汇率按钮

2. **src/views/calculation/ExchangeRate.vue**
   - 第 87 行：删除参数按钮
   - 第 216 行：删除映射按钮
   - 第 429 行：删除 API 按钮

3. **src/views/LayoutView.vue**
   - 第 16 行：退出登录按钮

4. **src/components/Layout/Header.vue**
   - 第 5 行：退出登录按钮

## 实施步骤

1. 逐个文件检查并替换 `type="text"` 为 `type="link"`
2. 确保所有修改后的按钮样式保持一致
3. 验证修改后控制台不再出现废弃警告

## 预期效果

- 消除 Element Plus 废弃警告
- 保持按钮原有功能和样式不变
- 代码符合 Element Plus 3.0.0+ 规范
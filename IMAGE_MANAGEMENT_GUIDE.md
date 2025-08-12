# 图片管理功能使用指南

## 🎯 功能概述

Prompt Manager 现在支持完整的图片管理功能，包括：
- 🖱️ 拖拽上传图片
- 📋 剪贴板粘贴图片（Ctrl+V）
- 📁 文件选择器上传
- 🖼️ 图片预览和管理
- 💾 本地存储（Tauri环境）

## 🔧 功能修复内容

### 1. **Tauri 拖拽功能修复**
- ✅ 添加了 Tauri 事件监听器
- ✅ 支持 `tauri://file-drop` 事件
- ✅ 自动过滤图片文件类型
- ✅ 拖拽状态视觉反馈

### 2. **剪贴板功能修复**
- ✅ Web环境：改进的权限检查和错误处理
- ✅ Tauri环境：专用剪贴板API支持
- ✅ 更好的错误提示信息
- ✅ 支持多种图片格式

### 3. **文件保存修复**
- ✅ 修复保存路径问题
- ✅ 图片保存到 `user_images` 文件夹
- ✅ 支持相对路径和绝对路径
- ✅ 自动创建目录结构

## 🚀 使用方法

### Web 浏览器环境

#### 文件拖拽：
1. 直接拖拽图片文件到上传区域
2. 支持多文件同时拖拽
3. 自动验证文件格式和大小

#### 剪贴板粘贴：
1. 复制图片到剪贴板
2. 在上传区域按 `Ctrl+V`（Windows）或 `Cmd+V`（Mac）
3. 或者使用全局粘贴快捷键

**⚠️ 权限要求：**
- 需要HTTPS协议或localhost
- 需要允许剪贴板访问权限

### Tauri 桌面环境

#### 文件拖拽：
1. 拖拽图片文件到应用窗口
2. 自动识别图片文件类型
3. 支持多文件同时拖拽

#### 剪贴板粘贴：
1. 复制图片到系统剪贴板
2. 使用 `Ctrl+V` 粘贴
3. 自动处理系统剪贴板数据

#### 本地存储：
- 图片自动保存到 `user_images` 文件夹
- 支持相对路径和应用程序目录
- 自动生成唯一文件名

## 🛠️ 权限问题解决方案

### Web 环境权限问题

#### 1. 剪贴板权限被拒绝
**错误：** "剪贴板读取权限被拒绝"

**解决方案：**
- 使用 HTTPS 协议访问应用
- 在浏览器地址栏点击锁图标
- 允许剪贴板访问权限
- 或使用 localhost 进行本地测试

#### 2. 不安全上下文错误
**错误：** "剪贴板功能需要安全上下文(HTTPS)"

**解决方案：**
- 部署应用到 HTTPS 服务器
- 或使用 `https://localhost:5174` 进行本地开发
- 配置开发服务器使用 HTTPS

### Tauri 环境权限问题

#### 1. 文件拖拽不工作
**解决方案：**
- 确保 Tauri 配置已更新
- 重新编译应用：`npm run tauri build`
- 使用管理员权限运行（如果需要）

#### 2. 文件保存失败
**解决方案：**
- 检查应用程序目录写入权限
- 使用管理员权限运行应用
- 确保磁盘空间充足

## 📁 文件结构

```
应用程序目录/
├── user_images/          # 图片存储目录
│   ├── img_xxx_1.jpg    # 保存的图片文件
│   ├── img_xxx_2.png
│   └── ...
└── prompts.json         # Prompt数据（包含图片引用）
```

## 🎨 支持的图片格式

- **JPEG/JPG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)
- **BMP** (.bmp)

**文件大小限制：** 10MB

## 🔄 使用流程

1. **创建新Prompt**
2. **添加图片**（拖拽/粘贴/选择文件）
3. **预览和管理图片**
4. **保存Prompt**（图片自动保存）
5. **查看和编辑**（支持图片预览）

## 🚨 故障排除

### 常见问题

#### Q: 拖拽图片没有反应
A: 
- 检查是否在正确的上传区域
- 确认文件是支持的图片格式
- 在Tauri环境下，确保应用有足够权限

#### Q: 剪贴板粘贴不工作
A:
- Web：确保使用HTTPS或localhost
- Web：检查浏览器剪贴板权限
- Tauri：确保剪贴板中有图片数据
- 尝试复制图片文件而不是截图

#### Q: 图片保存失败
A:
- 检查磁盘空间
- 确保有写入权限
- 在Windows上，尝试以管理员身份运行

#### Q: 图片显示不出来
A:
- 检查图片文件是否存在
- Web环境下会使用DataURL显示
- Tauri环境下检查本地文件路径

## 🔧 开发者信息

### 技术实现

- **前端框架：** Vue 3 + TypeScript
- **图片处理：** Canvas API + FileReader
- **文件系统：** Tauri FS API
- **剪贴板：** Clipboard API + Tauri Clipboard
- **拖拽：** HTML5 Drag & Drop + Tauri Events

### API 参考

#### ImageManager 类
```typescript
// 创建图片对象
static async createImageFromFile(file: File): Promise<PromptImage>

// 从剪贴板创建图片
static async createImageFromClipboard(): Promise<PromptImage | null>

// 从DataURL创建图片
static async createImageFromDataUrl(dataUrl: string, fileName: string): Promise<PromptImage>

// 处理拖拽文件
static async handleDroppedFiles(files: FileList): Promise<PromptImage[]>

// 删除本地图片
static async deleteLocalImage(localPath?: string): Promise<void>
```

---

**如果遇到任何问题，请确保：**
1. 使用最新版本的浏览器
2. 应用运行在HTTPS环境或localhost
3. 已授予必要的权限
4. 图片文件格式和大小符合要求

如需技术支持，请查看控制台日志获取详细错误信息。

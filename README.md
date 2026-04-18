# 考研英语阅读刷题系统

一个功能完整的考研英语阅读理解练习平台，支持多色标记、AI问答、数据统计等功能。

## 功能特点

- **左右分栏布局** - 左侧文章，右侧题目，符合真实考试体验
- **多色标记笔** - 每道题独立颜色，支持文章高亮和笔记
- **智能答题逻辑** - 前进隐藏答案，后退恢复显示
- **实时统计** - 今日/本周学习数据、正确率、用时分析
- **AI助教** - 题目解析、长难句讲解、词汇拓展
- **知识库** - AI问答记录自动保存，支持检索
- **学习路线** - 基础/进阶/冲刺分级训练

## 技术栈

- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Next.js API Routes
- **数据库**: SQLite + Prisma ORM
- **AI**: DeepSeek API（可选）

## 快速开始

### 1. 安装依赖

```bash
cd english-reading
npm install
```

### 2. 初始化数据库

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. 添加示例数据（可选）

```bash
npx ts-node scripts/seed.ts
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
english-reading/
├── app/                      # 页面和API路由
│   ├── page.tsx             # 首页
│   ├── practice/[id]/       # 刷题页面
│   ├── upload/              # 文章上传
│   ├── stats/               # 数据统计
│   └── api/                 # 后端接口
├── components/              # UI组件
│   ├── practice/            # 刷题相关组件
│   └── ui/                  # 基础UI组件
├── lib/                     # 工具函数
│   └── db.ts               # 数据库连接
├── prisma/                  # 数据库模型
│   └── schema.prisma
└── scripts/                 # 脚本
    └── seed.ts             # 示例数据
```

## 配置AI接口

在 `.env` 文件中添加 DeepSeek API Key：

```
DEEPSEEK_API_KEY=your_api_key_here
```

如果没有API Key，系统会使用内置的备用响应。

## 使用说明

### 上传文章

1. 点击首页的"上传文章"按钮
2. 填写文章标题、来源、年份等信息
3. 粘贴文章内容
4. 添加题目和选项
5. 设置正确答案和解析
6. 保存

### 开始练习

1. 在首页选择要练习的文章
2. 阅读文章，使用颜色笔标记重点
3. 选择答案，切换题目
4. 提交后查看正确率和解析
5. 使用AI助教提问

### 查看统计

- 今日学习篇数、答题数、正确率
- 本周学习趋势
- 学习建议

## 核心功能说明

### 多色标记笔

每道题目自动分配不同颜色：
- Q1: 红色
- Q2: 蓝色
- Q3: 绿色
- Q4: 黄色
- Q5: 紫色

选中文章中的文字即可高亮标记，方便定位关键信息。

### 答题逻辑

- 切换到下一题时，之前的选择被隐藏
- 返回上一题时，选择自动恢复
- 提交后一次性展示所有答案和解析

### AI助教

支持：
- 文章主旨分析
- 题目选项解析
- 长难句讲解
- 词汇拓展

## 部署

### Vercel部署

```bash
npm run build
vercel deploy
```

### 本地生产运行

```bash
npm run build
npm run start
```

## 后续优化方向

- [ ] 添加用户登录系统
- [ ] 支持更多AI模型
- [ ] 实现真正的RAG向量检索
- [ ] 添加错题重做功能
- [ ] 支持PDF/Word导入
- [ ] 添加模拟考试模式
- [ ] 移动端适配

## License

MIT

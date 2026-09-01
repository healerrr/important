# 年度重点项目管理 API

基于 NestJS、TypeScript、PostgreSQL 和 Prisma 的后端服务，为年度重点项目页面提供负责人、项目、进度历史和 Excel 批量导入 REST API。第一版不包含登录、权限、通知、前端和文件长期存储。

## 技术与架构

- Node.js 24 Active LTS、pnpm、NestJS 11、TypeScript strict。
- PostgreSQL 17、Prisma ORM 和真实 SQL Migration。
- Swagger/OpenAPI、Pino 结构化日志、Helmet、CORS、限流、Jest。
- Controller 处理 HTTP 协议，Service 处理业务与事务，PrismaService 管理数据库连接。
- `owners` 一对多 `projects`；`projects` 一对多 `project_progress_logs`；`import_batches` 独立保存导入审计。

```text
src/
  common/                 统一响应、错误、requestId、通用 DTO
  config/                 环境变量校验
  database/               Prisma 生命周期
  modules/
    health/ owners/ projects/ imports/
prisma/
  schema.prisma migrations/ seed.ts
scripts/export-openapi.ts
test/
```

## 环境要求与本地启动

要求 Node.js 24、pnpm 9+ 和 PostgreSQL。复制环境配置后执行：

```bash
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm seed
pnpm dev
```

Windows PowerShell 可用 `Copy-Item .env.example .env`。默认服务地址为 `http://localhost:3000`，Swagger UI 为 `http://localhost:3000/docs`，OpenAPI JSON 为 `http://localhost:3000/docs-json`。项目内版本化文件为 `openapi/openapi.v1.json`，通过 `pnpm openapi:export` 更新。

## Docker 启动

```bash
docker compose up --build -d
docker compose exec api pnpm seed
docker compose logs -f api
```

API 会等待 PostgreSQL 健康，启动前自动执行 `prisma migrate deploy`。数据库数据存放在 `postgres_data` Volume。镜像使用多阶段构建并以非 root 用户运行。

## 环境变量

| 变量                      | 用途                        | 默认示例                |
| ------------------------- | --------------------------- | ----------------------- |
| `NODE_ENV`                | development/test/production | development             |
| `PORT`                    | HTTP 端口                   | 3000                    |
| `DATABASE_URL`            | PostgreSQL 连接串，必填     | 见 `.env.example`       |
| `CORS_ORIGINS`            | 逗号分隔的前端源            | `http://localhost:5173` |
| `LOG_LEVEL`               | Pino 日志级别               | info                    |
| `SWAGGER_ENABLED`         | 是否开放文档                | true                    |
| `EXCEL_MAX_FILE_SIZE_MB`  | Excel 最大 MB               | 5                       |
| `EXCEL_MAX_ROWS`          | 最大有效数据行              | 2000                    |
| `IMPORT_RATE_LIMIT_TTL`   | 导入限流时间窗（毫秒）      | 60000                   |
| `IMPORT_RATE_LIMIT_LIMIT` | 时间窗内导入次数            | 10                      |

关键配置缺失或格式错误时服务会拒绝启动。不要把 `.env`、真实密码或连接串提交到版本库。

## API 概览

所有业务路径以 `/api/v1` 开头。

| 方法             | 路径                             | 用途                 |
| ---------------- | -------------------------------- | -------------------- |
| GET              | `/health`                        | API 与数据库健康检查 |
| GET/POST         | `/owners`                        | 查询/新增负责人      |
| GET              | `/owners/options`                | 内置负责人枚举列表   |
| PATCH/DELETE     | `/owners/:id`                    | 修改/删除负责人      |
| GET/POST         | `/projects`                      | 查询/新增项目        |
| GET/PATCH/DELETE | `/projects/:id`                  | 详情/基础编辑/删除   |
| PATCH            | `/projects/:id/owners`           | 设置或清空多个负责人 |
| PATCH            | `/projects/:id/progress`         | 更新进度并写历史     |
| GET              | `/projects/:id/progress-history` | 分页查询进度历史     |
| POST             | `/projects/import`               | Excel 批量导入       |

列表支持年度、关键字、负责人、分页和白名单排序。负责人筛选同时支持单值 `ownerId` 和多值 `ownerIds`。新增或设置项目负责人时推荐使用 `ownerIds` 数组，需求部门推荐使用 `departments` 字符串数组；为兼容旧前端，请求仍接受单值 `ownerId` 和 `department`，服务端会自动归一为数组。项目响应使用 `owners` 和 `departments` 数组。项目基础信息、负责人和进度更新均使用请求中的 `version` 做乐观锁；冲突返回 409。单条响应为 `{ "data": ... }`，列表为 `{ "data": [], "meta": ... }`。每个请求继承或生成 `X-Request-Id`，错误不会暴露堆栈、内部路径或数据库详情。

## Excel 导入

上传 `multipart/form-data`：`file`、`year`、可选 `duplicateStrategy`。仅接受文件内容与扩展名一致的 `.xlsx`/`.xls`，文件在内存解析，不落盘，不执行宏或公式。

表头别名：

- 项目名称：`项目名称`、`项目`（必需）。
- 年度目标：`年度目标`、`项目目标`、`目标`。
- 需求部门：`需求部门`、`部门`。
- 负责人：`负责人`、`项目负责人`、`IT人员`（表头匹配忽略空白、全半角和英文大小写）。
- 当前进度：`当前进度`、`项目进度`、`进度`。

空行忽略，文本自动去除首尾空格。负责人和需求部门单元格都按 `、`、中英文逗号、分号、斜杠或换行拆分并去重；负责人姓名分别关联到项目，需求部门保存为字符串数组。进度 `72`、`72%` 和 Excel 数值 `0.72` 都保存为 72；非整数使用 `Math.round` 四舍五入。文件内同名或任一行无效时所有项目均不写入，并一次返回已识别的全部行错误。负责人不存在时自动创建，唯一索引加事务避免同名重复。

重复策略：

- `error`（默认）：数据库已有同年度同名项目时整批失败。
- `skip`：保留已有项目并计入跳过数。
- `update`：覆盖目标、负责人和进度，版本加 1；进度变化时写历史。

成功和失败都记录 `import_batches`。解析或事务失败不会留下部分项目数据。

## 数据库与初始化

```bash
pnpm prisma:migrate:dev   # 开发时创建新 migration
pnpm prisma:migrate:deploy
pnpm seed                 # 可重复执行，写入内置负责人和 8 个 2026 项目
pnpm prisma:studio
```

不要修改已经发布的 migration；模型变化应新增 migration。项目物理删除，进度历史级联删除；被项目引用的负责人不能删除。

## 质量命令

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
pnpm test:cov
```

快速单元测试覆盖 Excel 表头、空行、多错误收集和进度解析。完整数据库联调建议给 E2E 使用独立 PostgreSQL，并通过 `TEST_DATABASE_URL` 管理，禁止连接生产库。

## 前端联调与常见错误

- 编辑前保留项目响应中的 `version`，每次成功更新后使用服务端返回的新版本。
- 400：参数或文件类型错误；404：项目/负责人不存在；409：重名、负责人被引用或版本冲突；413：文件过大；422：Excel 行数据错误；429：导入过于频繁。
- CORS 报错时把前端完整 Origin 加入 `CORS_ORIGINS`；数据库健康检查失败时核对 `DATABASE_URL` 和 migration 状态。

## 生产安全

该服务默认应部署在内网或受网关保护的环境中；如果开放到公网，必须增加认证、权限和审计。生产环境还应关闭或网关保护 Swagger、使用密钥管理系统注入数据库密码、配置 TLS、备份、监控和日志脱敏。

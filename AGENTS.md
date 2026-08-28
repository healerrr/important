# 项目协作说明

## 结构

- `src/common`：请求 ID、统一响应、异常过滤器和通用 DTO。
- `src/database`：Prisma 生命周期。
- `src/modules`：health、owners、projects、imports 业务模块。
- `prisma`：模型、真实 SQL migration 和可重复 Seed。
- `test`：快速单元测试与 E2E 环境入口。

## 命令

使用 pnpm：`pnpm dev`、`pnpm lint`、`pnpm build`、`pnpm test`、`pnpm test:e2e`、`pnpm prisma:migrate:deploy`、`pnpm seed`。

## 约束

- TypeScript strict；Controller 只做协议转换，业务规则放 Service。
- DTO 必须白名单校验；ORM 排序字段只能由枚举映射。
- API 单条使用 `{ data }`，列表使用 `{ data, meta }`，错误使用统一错误对象并带 requestId。
- 同年度项目名唯一；进度为 0～100 整数；负责人被引用时不可删除。
- 项目更新必须检查 version 并递增；进度值变化和历史记录必须在同一事务。
- Excel 必须先完整校验再事务写入，禁止保存上传文件，失败也写 import_batches。
- 变更 schema 必须增加 migration，禁止改写已发布 migration。

完成改动前至少运行：`pnpm prisma:generate && pnpm lint && pnpm build && pnpm test`。涉及数据库行为时再运行 migration、seed 和 E2E。

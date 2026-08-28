import { PrismaClient } from '@prisma/client';
import { BUILT_IN_OWNER_NAMES } from '../src/modules/owners/owner-options.constants';

const prisma = new PrismaClient();

const ownerNames = ['张伟', '李娜', '王磊', ...BUILT_IN_OWNER_NAMES] as const;

const projects = [
  ['IT资产可视化平台', '实现IT资产全生命周期可视化管理', '张伟', 72],
  ['ERP需求冲突检查系统', '自动识别并预警ERP需求冲突', '李娜', 48],
  ['站群文案相似度系统', '提升站群内容原创性与搜索友好度', '王磊', 63],
  ['实验谷智能搜索升级', '优化搜索相关性与用户体验', '张伟', 81],
  ['AI模型统一接入平台', '统一接入各类AI模型并提供标准API', null, 35],
  ['网络安全态势感知平台', '提升安全威胁检测与响应能力', '李娜', 58],
  ['数据中台建设项目', '构建统一数据中台，支撑业务决策', '王磊', 67],
  ['办公自动化流程优化', '优化核心流程，提升协同效率', '张伟', 50],
] as const;

async function main(): Promise<void> {
  const ownerIds = new Map<string, string>();
  for (const name of ownerNames) {
    const owner = await prisma.owner.upsert({ where: { name }, update: {}, create: { name } });
    ownerIds.set(name, owner.id);
  }
  for (const [name, annualGoal, ownerName, progress] of projects) {
    const project = await prisma.project.upsert({
      where: { year_name: { year: 2026, name } },
      update: {},
      create: {
        year: 2026,
        name,
        annualGoal,
        ownerId: ownerName ? ownerIds.get(ownerName) : null,
        progress,
      },
    });
    if (progress > 0) {
      const count = await prisma.projectProgressLog.count({ where: { projectId: project.id } });
      if (count === 0)
        await prisma.projectProgressLog.create({
          data: { projectId: project.id, oldProgress: 0, newProgress: progress },
        });
    }
  }
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();

import { writeFile, mkdir } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';

async function exportDocument(): Promise<void> {
  process.env.NODE_ENV ??= 'production';
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  const [{ AppModule }, { createOpenApiDocument }] = await Promise.all([
    import('../src/app.module'),
    import('../src/swagger'),
  ]);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  const document = createOpenApiDocument(app);
  await mkdir('openapi', { recursive: true });
  await writeFile('openapi/openapi.v1.json', `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await app.close();
}

void exportDocument();

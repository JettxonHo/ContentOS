import 'reflect-metadata';

import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ConfigurationError, loadApiConfig, loadApiSecrets } from '@contentos/config';
import { UPLOAD_FILE_MAX_BYTES } from '@contentos/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const config = loadApiConfig(process.env);
  const secrets = loadApiSecrets(process.env);
  const application = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config, secrets),
    new FastifyAdapter(),
  );

  await application.register(fastifyCookie);
  await application.register(fastifyHelmet);
  await application.register(fastifyCors, {
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
    origin: config.trustedWebOrigin,
  });
  // Upload Quarantine transport bound (M2-SRC-002): one file part, bounded
  // fields, and the Core upload byte bound enforced at the transport layer.
  // The transport fileSize limit is the Core bound plus one byte: busboy
  // truncates AT the limit, so the one-byte headroom lets an oversized file
  // be detected and formally denied (422) instead of silently truncated into
  // an at-bound file. Core re-enforces the exact bound before any side effect.
  await application.register(fastifyMultipart, {
    limits: {
      fileSize: UPLOAD_FILE_MAX_BYTES + 1,
      files: 1,
      fields: 4,
    },
  });

  const openApi = new DocumentBuilder()
    .setTitle('ContentOS API')
    .setVersion('1')
    .addCookieAuth(config.sessionCookieName, undefined, config.sessionCookieName)
    .build();
  const openApiDocument = SwaggerModule.createDocument(application, openApi);
  application
    .getHttpAdapter()
    .getInstance()
    .get('/openapi.json', async (_request, reply) => {
      await reply.send(openApiDocument);
    });

  await application.listen({ host: config.host, port: config.port });

  let isShuttingDown = false;
  const shutdown = (): void => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    void application.close().catch((): void => {
      process.exitCode = 1;
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

void bootstrap().catch((error: unknown) => {
  if (error instanceof ConfigurationError) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write('API startup failed.\n');
  }
  process.exitCode = 1;
});

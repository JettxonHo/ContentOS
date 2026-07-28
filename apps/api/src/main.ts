import 'reflect-metadata';

import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ConfigurationError, loadApiConfig, loadApiSecrets } from '@contentos/config';

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
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    origin: config.trustedWebOrigin,
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

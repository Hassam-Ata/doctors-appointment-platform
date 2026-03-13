import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Clerk webhook verification requires the unparsed raw payload.
  app.use("/api/webhooks", express.raw({ type: "application/json" }));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/webhooks")) {
      return next();
    }
    return express.json()(req, res, next);
  });
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/webhooks")) {
      return next();
    }
    return express.urlencoded({ extended: true })(req, res, next);
  });

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
}
bootstrap();

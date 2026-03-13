import {
  BadRequestException,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { WebhooksService } from "./webhooks.service";

@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Req() req: Request) {
    try {
      await this.webhooksService.processClerkWebhook(req);
      return { message: "Webhook received" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown webhook verification error";
      this.logger.error(`Webhook failed: ${message}`);
      throw new BadRequestException(message);
    }
  }
}

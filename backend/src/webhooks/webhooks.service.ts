import { Injectable, Logger } from "@nestjs/common";
import { verifyWebhook } from "@clerk/backend/webhooks";
import type { Request as ExpressRequest } from "express";
import { UsersService } from "../users/users.service";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly usersService: UsersService) {}

  async processClerkWebhook(req: ExpressRequest) {
    const request = this.toWebRequest(req);
    const evt = await verifyWebhook(request, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });

    const eventType = evt.type;
    const userId = (evt.data as { id?: string })?.id;

    this.logger.log(
      `Received webhook with ID ${userId ?? "unknown"} and event type ${eventType}`,
    );

    if (eventType === "user.created" || eventType === "user.updated") {
      const user = await this.usersService.upsertUserFromClerkWebhook(evt.data);
      this.logger.log(`Synced user ${user.clerkUserId} from event ${eventType}`);
      return;
    }

    if (eventType === "user.deleted") {
      const result = await this.usersService.deleteUserFromClerkWebhook(evt.data);
      this.logger.log(
        `Processed deletion for user ${userId ?? "unknown"}, deleted=${result.deleted}`,
      );
      return;
    }

    this.logger.log(`Ignoring unsupported webhook event: ${eventType}`);
  }

  private toWebRequest(req: ExpressRequest): Request {
    const host = req.get("host") || "localhost";
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
    const url = `${protocol}://${host}${req.originalUrl}`;

    const bodyBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));
    const body = new Uint8Array(bodyBuffer);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }
        continue;
      }

      headers.set(key, value);
    }

    return new Request(url, {
      method: req.method,
      headers,
      body,
    });
  }
}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AdminModule } from "./admin/admin.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { UsersModule } from "./users/users.module";
import { CreditsModule } from "./credits/credits.module";
import { PayoutsModule } from "./payouts/payouts.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AdminModule,
    AppointmentsModule,
    DoctorsModule,
    UsersModule,
    CreditsModule,
    PayoutsModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

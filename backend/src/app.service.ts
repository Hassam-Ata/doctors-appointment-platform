import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Doctors Appointment Platform API - Welcome!";
  }
}

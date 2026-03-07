import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ClerkAuthGuard } from "../common/guards/clerk-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { SetUserRoleDto, CreateUserDto } from "./dto/users.dto";

@Controller("users")
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("current")
  async getCurrentUser(@CurrentUser() user: { clerkUserId: string }) {
    return this.usersService.getCurrentUser(user.clerkUserId);
  }

  @Post("role")
  async setUserRole(
    @Body() dto: SetUserRoleDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.usersService.setUserRole(dto, user.clerkUserId);
  }

  @Post("sync")
  async createOrUpdateUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { clerkUserId: string },
  ) {
    return this.usersService.createOrUpdateUser(user.clerkUserId, dto);
  }
}

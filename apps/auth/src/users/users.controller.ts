import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';

import { UsersService } from './users.service';
import { CurrentUser } from '../../../../libs/common/src/decorators/current-user.decorator';
import { UserDocument } from './models/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUser(@CurrentUser() user: UserDocument) {
    return user;
  }

  @Patch('/update')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Body() updateDto: UpdateUserDto) {
    return await this.usersService.updateUser(updateDto);
  }

  @Post('/reset/password')
  async resetPassword(@Body() { email }: { [key: string]: string }) {
    return await this.usersService.resetPassword(email);
  }
}

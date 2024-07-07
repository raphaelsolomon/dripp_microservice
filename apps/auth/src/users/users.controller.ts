import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CurrentUser } from '../../../../libs/common/src/decorators/current-user.decorator';
import { UserDocument } from './models/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('/update/password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(
    @CurrentUser() user: UserDocument,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return await this.usersService.updatePassword(user, updatePasswordDto);
  }

  @Post('/update/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  async updateAvatar(
    @CurrentUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.usersService.uploadAvatar(user, file);
  }
}

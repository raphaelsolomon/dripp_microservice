import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../../../libs/common/src/decorators/current-user.decorator';
import { UserDocument } from './models/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { UploadImageDto } from './dto/upload-image.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

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
  async updateUser(
    @CurrentUser() user: UserDocument,
    @Body() updateDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(user, updateDto);
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
  // @UseInterceptors(FileInterceptor('file'))
  @FormDataRequest()
  @UseGuards(JwtAuthGuard)
  async updateAvatar(
    @CurrentUser() user: UserDocument,
    @Body() uploadImageDto: UploadImageDto,
  ) {
    return await this.usersService.uploadAvatar(user, uploadImageDto.file);
  }

  @MessagePattern('get_user')
  getUserByUuid(@Payload() { user_uuid }: { [key: string]: string }) {
    return this.usersService.getUserByUuid(user_uuid);
  }
}

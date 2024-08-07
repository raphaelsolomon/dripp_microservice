import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../../../libs/common/src/decorators/current-user.decorator';
import { UserDocument } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { UploadImageDto } from './dto/upload-image.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUser(@CurrentUser() user: UserDocument) {
    return user;
  }

  @Get('/healthcheck')
  healthCheck(@Res() res: Response) {
    return res.sendStatus(200);
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

  @Post('/subscribe-channel/:brand_uuid')
  @UseGuards(JwtAuthGuard)
  async joinChannel(@CurrentUser() user: UserDocument, @Req() req: Request) {
    return this.usersService.subscribeChannel(user, req?.params?.brand_uuid);
  }

  @Post('/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateAccount(
    @CurrentUser() user: UserDocument,
    @Body('password') password: string,
  ) {
    return this.usersService.deactivateAccount(user, password);
  }

  @Delete('/unsubscribe-channel/:brand_uuid')
  @UseGuards(JwtAuthGuard)
  async unsubscribeChannel(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    return this.usersService.unsubscribeChannel(user, req?.params?.brand_uuid);
  }

  @Get('/channels/')
  @UseGuards(JwtAuthGuard)
  async getChannels(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
  ) {
    return this.usersService.getChannels(user, payload);
  }

  @Get('/recommended-channels')
  @UseGuards(JwtAuthGuard)
  async getRecommededChannels(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
  ) {
    return this.usersService.getRecommededChannels(user, payload);
  }

  @Get('/tasks/')
  @UseGuards(JwtAuthGuard)
  async getTasks(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
  ) {
    return this.usersService.getTasks(user, payload);
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
  getUserBy(@Payload() payload: { [key: string]: string }) {
    return this.usersService.getUserBy(payload);
  }

  @MessagePattern('update_username')
  updateUserByUuid(@Payload() payload: { [key: string]: string }) {
    return this.usersService.updateUsername(payload);
  }
}

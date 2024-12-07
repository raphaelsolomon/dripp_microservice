import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../../../libs/common/src/decorators/current-user.decorator';
import {
  AccountType,
  HttpCacheInterceptor,
  IGetGalleryProps,
  successResponse,
  UserDocument,
} from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { UploadImageDto } from './dto/upload-image.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Request } from 'express';
import { TaskSubmissionDto } from './dto/submit-task.dto';

@UseInterceptors(HttpCacheInterceptor)
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUser(@CurrentUser() user: UserDocument, @Req() req: Request) {
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: user,
    };
  }

  @Get('countries')
  async getCountries(@Req() req: Request) {
    const result = await this.usersService.getCountries();
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('healthcheck')
  healthCheck(@Req() req: Request) {
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: 'OK',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('industries')
  async getIndustries(
    @Query() input: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getIndustries(input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('set-account-type')
  @UseGuards(JwtAuthGuard)
  async setAccountType(
    @CurrentUser() user: UserDocument,
    @Body() body: { accountType: AccountType },
    @Req() req: Request,
  ) {
    const result = await this.usersService.setAccountType(
      user,
      body?.accountType,
    );

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @CurrentUser() user: UserDocument,
    @Body() updateDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const result = await this.usersService.updateUser(user, updateDto);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('update/password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(
    @CurrentUser() user: UserDocument,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return await this.usersService.updatePassword(user, updatePasswordDto);
  }

  @Post('subscribe-channel/:brand_uuid')
  @UseGuards(JwtAuthGuard)
  async joinChannel(@CurrentUser() user: UserDocument, @Req() req: Request) {
    const result = await this.usersService.subscribeChannel(
      user,
      req?.params?.brand_uuid,
    );
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateAccount(
    @CurrentUser() user: UserDocument,
    @Body('password') password: string,
    @Req() req: Request,
  ) {
    const result = await this.usersService.deactivateAccount(user, password);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Delete('unsubscribe-channel/:brand_uuid')
  @UseGuards(JwtAuthGuard)
  async unsubscribeChannel(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    const result = await this.usersService.unsubscribeChannel(
      user,
      req?.params?.brand_uuid,
    );
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('channels')
  @UseGuards(JwtAuthGuard)
  async getChannels(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getChannels(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('channels/:brand_uuid')
  @UseGuards(JwtAuthGuard)
  async getChannel(
    @CurrentUser() user: UserDocument,
    @Param() payload: { brand_uuid: string },
    @Req() req: Request,
  ) {
    const brand = await this.usersService.getChannel({
      brand_uuid: payload?.brand_uuid,
      user_uuid: user.uuid,
    });

    return successResponse({ data: brand, path: req.url });
  }

  @Post('industries/channels')
  @UseGuards(JwtAuthGuard)
  async getChannelsByIndustries(
    @CurrentUser() user: UserDocument,
    @Body('industries') industries: string[],
    @Query() payload: { [key: string]: any },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getChannelsByIndustries(industries, {
      ...payload,
      user: user,
    });
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('recommended-channels')
  @UseGuards(JwtAuthGuard)
  async getRecommededChannels(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getRecommededChannels(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  async getTasks(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number | string },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getTasks(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }
  @Post('task/start')
  @UseGuards(JwtAuthGuard)
  async startTask(
    @CurrentUser() user: UserDocument,
    @Body() body: { campaign_id: string; task_id: string },
    @Req() req: Request,
  ) {
    await this.usersService.startTask(
      body?.campaign_id,
      user?.uuid,
      body?.task_id,
    );

    return successResponse({
      statusCode: 201,
      data: null,
      message: 'Successfully started task',
      path: req.url,
    });
  }

  @Get('task/:task_uuid')
  @UseGuards(JwtAuthGuard)
  async getTask(
    @CurrentUser() user: UserDocument,
    @Param('task_uuid') task_uuid: string,
    @Req() req: Request,
  ) {
    const result = await this.usersService.getTask(user, task_uuid);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('posts')
  @UseGuards(JwtAuthGuard)
  async getPosts(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: string },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getPosts(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('completed-tasks')
  @UseGuards(JwtAuthGuard)
  async getCompletedTasks(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: string },
    @Req() req: Request,
  ) {
    const result = await this.usersService.getCompletedTasks(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('task-submission/:task_uuid')
  @FormDataRequest()
  @UseGuards(JwtAuthGuard)
  async submitTask(
    @CurrentUser() user: UserDocument,
    @Param('task_uuid') task_uuid: string,
    @Body() payload: TaskSubmissionDto,
    @Req() req: Request,
  ) {
    const result = await this.usersService.submitTask(user, payload, task_uuid);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('update/avatar')
  @FormDataRequest()
  @UseGuards(JwtAuthGuard)
  async updateAvatar(
    @CurrentUser() user: UserDocument,
    @Body() uploadImageDto: UploadImageDto,
    @Req() req: Request,
  ) {
    const result = await this.usersService.uploadAvatar(
      user,
      uploadImageDto.file,
    );
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Put('post/react/:post_uuid')
  @FormDataRequest()
  @UseGuards(JwtAuthGuard)
  async postReaction(
    @CurrentUser() user: UserDocument,
    @Param('post_uuid') input: string,
    @Req() req: Request,
  ) {
    const result = await this.usersService.postReaction(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('gallery')
  @FormDataRequest()
  @UseGuards(JwtAuthGuard)
  async uploadImage(
    @CurrentUser() user: UserDocument,
    @Body() uploadImageDto: UploadImageDto,
    @Req() req: Request,
  ) {
    const result = await this.usersService.uploadImage(
      user,
      uploadImageDto.file,
    );

    return successResponse({ data: result, path: req.url });
  }

  @Get('gallery')
  @UseGuards(JwtAuthGuard)
  async getGallery(
    @CurrentUser() user: UserDocument,
    @Query() query: IGetGalleryProps,
    @Req() req: Request,
  ) {
    const result = await this.usersService.getGallery(user, {
      limit: query?.limit,
      next_cursor: query?.next_cursor || null,
    });

    return successResponse({ path: req.url, data: result });
  }

  @MessagePattern('get_user')
  getUserBy(@Payload() payload: { [key: string]: string }) {
    return this.usersService.getUserBy(payload);
  }

  @MessagePattern('update_username')
  updateUserByUuid(@Payload() payload: { [key: string]: string }) {
    return this.usersService.updateUsername(payload);
  }

  @MessagePattern('update_chat_uuid')
  updateChatUuid(@Payload() payload: { [key: string]: string }) {
    return this.usersService.updateChatUuid(payload);
  }
}

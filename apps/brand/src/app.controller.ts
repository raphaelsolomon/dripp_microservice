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
} from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, UserDocument, UserDto } from '@app/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateTaskDto } from './dto/task/create-task.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { UpdatePostDto } from './dto/post/update-post.dto';
import { CreatePostDto } from './dto/post/create-post.dto';
import { CreateDiscountDto } from './dto/discount/create-discount.dto';
import { CreateGiftCardDto } from './dto/giftcard/create-giftcard.dto';
import { UpdateGiftCardDto } from './dto/giftcard/update-giftcard.dto';
import { UpdateDiscountDto } from './dto/discount/update-discount.dto';
import { CreateMemberShipMailDto } from './dto/membership-mail/create-membership-mail.dto';
import { UpdateMemberShipMailDto } from './dto/membership-mail/update-membership-mail.dto';
import { Request } from 'express';
import { CardDto } from './dto/card/card.dto';
import { GiftUserCardDto } from './dto/giftcard/gift-user-card.dto';
import { GiftUserDiscountDto } from './dto/discount/gift-user-discount.dto';
import { UpdateTaskDto } from './dto/task/update-task.dto';

@Controller('brand')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/healthcheck')
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
  @Patch('/update')
  async updateBrand(
    @CurrentUser() user: UserDto,
    @Body() input: UpdateBrandDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.updatebrand(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/post')
  @FormDataRequest()
  async updateBrandPost(
    @CurrentUser() user: UserDto,
    @Body() input: UpdatePostDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.updatePost(input, user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/task')
  @FormDataRequest()
  async updateBrandtask(
    @CurrentUser() user: UserDto,
    @Body() input: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.updateBrandTask(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Patch('/membership-mail')
  @UseGuards(JwtAuthGuard)
  async updateMemberShipMail(
    @CurrentUser() user: UserDto,
    @Body() input: UpdateMemberShipMailDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.updateMemberShipMail(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Patch('/giftcard')
  @UseGuards(JwtAuthGuard)
  async updateGiftCard(
    @CurrentUser() user: UserDto,
    @Body() input: UpdateGiftCardDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.updateGiftCard(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Patch('/discount')
  @UseGuards(JwtAuthGuard)
  async updateDiscount(
    @CurrentUser() user: UserDto,
    @Body() input: UpdateDiscountDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.updateDiscount(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/post')
  async deleteBrandPost(
    @CurrentUser() user: UserDto,
    @Body() uuid: string,
    @Req() req: Request,
  ) {
    const result = await this.appService.deletePost(uuid, user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/paymant-card')
  async deletePaymentCard(
    @CurrentUser() user: UserDto,
    @Body('uuid') uuid: string,
    @Req() req: Request,
  ) {
    const result = await this.appService.deletePaymentCard(uuid, user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/members/')
  async getBrandMembers(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.appService.getBrandMembers(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getBrand(@CurrentUser() user: UserDto, @Req() req: Request) {
    const result = await this.appService.getBrand(user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/posts')
  async getBrandPosts(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.appService.getPosts(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/payment-cards')
  async getPaymentCard(@CurrentUser() user: UserDto, @Req() req: Request) {
    const result = await this.appService.getPaymentCard(user, req);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/tasks')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  async getBrandTasks(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.appService.getBrandTasks(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/task/:task_uuid')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  async getBrandTask(
    @CurrentUser() user: UserDocument,
    @Param('task_uuid') task_uuid: string,
    @Req() req: Request,
  ) {
    const result = await this.appService.getBrandTask(user, task_uuid);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/discounts')
  @UseGuards(JwtAuthGuard)
  async getDicounts(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.appService.getDiscounts(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/giftcards')
  @UseGuards(JwtAuthGuard)
  async getGiftCards(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.appService.getGiftCards(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/task/:uuid')
  @UseGuards(JwtAuthGuard)
  async getTaks(@Param() payload: Record<string, string>, @Req() req: Request) {
    const result = await this.appService.getTask(payload?.uuid);

    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/post')
  @FormDataRequest()
  async createBrandPost(
    @CurrentUser() user: UserDto,
    @Body() input: CreatePostDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createPost(input, user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/payment-card')
  @FormDataRequest()
  async addCard(
    @CurrentUser() user: UserDto,
    @Body() input: CardDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.addCard(input, user);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/task')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  async createTask(
    @CurrentUser() user: UserDto,
    @Body() input: CreateTaskDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createBrandTask(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/discount')
  @UseGuards(JwtAuthGuard)
  async createDiscount(
    @CurrentUser() user: UserDto,
    @Body() input: CreateDiscountDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createDiscount(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/discount/user')
  @UseGuards(JwtAuthGuard)
  async createDiscountToUser(
    @CurrentUser() user: UserDto,
    @Body() input: GiftUserDiscountDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createDiscountToUser(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/giftcard')
  @UseGuards(JwtAuthGuard)
  async createGiftCard(
    @CurrentUser() user: UserDto,
    @Body() input: CreateGiftCardDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createGiftCard(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/giftcard/user')
  @UseGuards(JwtAuthGuard)
  async createGiftCardToUser(
    @CurrentUser() user: UserDto,
    @Body() input: GiftUserCardDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createGiftCardToUser(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/task-submission/:task_uuid/:member_uuid')
  @UseGuards(JwtAuthGuard)
  async getSubmissionByTask(
    @CurrentUser() user: UserDto,
    @Param() input: { [key: string]: string },
    @Req() req: Request,
  ) {
    const result = await this.appService.getSubmissionByTask(
      user,
      input.task_uuid,
      input.member_uuid,
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

  @Put('/task-submission/review')
  @UseGuards(JwtAuthGuard)
  async approveSubmission(
    @CurrentUser() user: UserDto,
    @Body() input: { [key: string]: string },
    @Req() req: Request,
  ) {
    const result = await this.appService.approveSubmission(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/membership-mail')
  @UseGuards(JwtAuthGuard)
  async createMemberShipMail(
    @CurrentUser() user: UserDto,
    @Body() input: CreateMemberShipMailDto,
    @Req() req: Request,
  ) {
    const result = await this.appService.createMemberShipMail(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('graph/membership-metrics')
  @UseGuards(JwtAuthGuard)
  async getMembershipMetrics(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    const result = await this.appService.getMembershipMetrics(user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('graph/tasks-with-engagement')
  @UseGuards(JwtAuthGuard)
  getTasksWithTotalEngagement(@CurrentUser() user: UserDocument) {
    return this.appService.getTasksWithTotalEngagement(user);
  }

  @Get('graph/task-engagement/:task_uuid')
  @UseGuards(JwtAuthGuard)
  async getEngagementsByATask(
    @CurrentUser() user: UserDocument,
    @Param('task_uuid') uuid: string,
    @Req() req: Request,
  ) {
    const result = await this.appService.getEngagementsByATask(user, uuid);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('graph/all-task-engagement')
  @UseGuards(JwtAuthGuard)
  allTaskWithEngagementsFromCreation(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    const result = this.appService.allTaskWithEngagementsFromCreation(user);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @MessagePattern('create_brand')
  createBrand(@Payload() payload: any) {
    return this.appService.createBrand(payload);
  }

  @EventPattern('add_member_to_multiple_brands')
  addMemberToBrands(@Payload() payload: { [key: string]: [string] }) {
    this.appService.addMemberToBrands(payload);
  }

  @MessagePattern('add_member_to_single_brand')
  addMemberToBrand(@Payload() payload: { [key: string]: string }) {
    return this.appService.addMemberToBrand(payload);
  }

  @MessagePattern('remove_member_from_brand')
  removeMemberFromBrand(@Payload() payload: { [key: string]: string }) {
    return this.appService.removeMemberFromBrand(payload);
  }

  @MessagePattern('get_channels')
  getChannels(@Payload() payload: { [key: string]: number }) {
    return this.appService.getChannels(payload);
  }

  @MessagePattern('get_recommended_channels')
  getRecommendedChannels(@Payload() payload: { [key: string]: string }) {
    return this.appService.getRecommendedChannels(payload);
  }

  @MessagePattern('get_tasks_from_brands')
  getTasksFromBrands(@Payload() payload: { [key: string]: any }) {
    return this.appService.getTasksFromBrands(payload);
  }

  @MessagePattern('get_post_from_brands')
  getPostsFromBrands(@Payload() payload: { [key: string]: any }) {
    return this.appService.getPostsFromBrands(payload);
  }

  @MessagePattern('search')
  searchFunction(@Payload() { input, user }: Record<string, any>) {
    return this.appService.searchFunction(input, user);
  }

  @MessagePattern('get_task')
  getTask(@Payload() { user, task_uuid }: Record<string, any>) {
    return this.appService.getTaskFromBrand(user, task_uuid);
  }

  @EventPattern('update_task_completed')
  updateTaskCompleted(@Payload() payload: Record<string, any>) {
    return this.appService.updateTaskReview(payload);
  }

  @MessagePattern('post_reaction')
  postReaction(@Payload() payload: Record<string, any>) {
    return this.appService.postReaction(payload);
  }

  @MessagePattern('get_completed_tasks')
  getCompletedTasks(@Payload() payload: Record<string, any>) {
    return this.appService.getCompletedTasks(payload);
  }

  @MessagePattern('get_brands_by_industries')
  getBrandsByIndustry(@Payload() payload: { [key: string]: any }) {
    return this.appService.getBrandsByIndustry(payload);
  }
}

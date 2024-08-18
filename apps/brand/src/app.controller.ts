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
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
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
import { Request, Response } from 'express';
import { CardDto } from './dto/card/card.dto';
import { GiftUserCardDto } from './dto/giftcard/gift-user-card.dto';
import { GiftUserDiscountDto } from './dto/discount/gift-user-discount.dto';

@Controller('brand')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/healthcheck')
  healthCheck(@Res() res: Response) {
    return res.sendStatus(200);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/update')
  updateBrand(
    @CurrentUser() user: UserDto,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.appService.updatebrand(user, updateBrandDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/post')
  @FormDataRequest()
  updateBrandPost(
    @CurrentUser() user: UserDto,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.appService.updatePost(updatePostDto, user);
  }

  @Patch('/membership-mail')
  @UseGuards(JwtAuthGuard)
  updateMemberShipMail(
    @CurrentUser() user: UserDto,
    @Body() updateMemberShipMailDto: UpdateMemberShipMailDto,
  ) {
    return this.appService.updateMemberShipMail(user, updateMemberShipMailDto);
  }

  @Patch('/giftcard')
  @UseGuards(JwtAuthGuard)
  updateGiftCard(
    @CurrentUser() user: UserDto,
    @Body() updateGiftCardDto: UpdateGiftCardDto,
  ) {
    return this.appService.updateGiftCard(user, updateGiftCardDto);
  }

  @Patch('/discount')
  @UseGuards(JwtAuthGuard)
  updateDiscount(
    @CurrentUser() user: UserDto,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.appService.updateDiscount(user, updateDiscountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/post')
  deleteBrandPost(@CurrentUser() user: UserDto, @Body() uuid: string) {
    return this.appService.deletePost(uuid, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/paymant-card')
  deletePaymentCard(@CurrentUser() user: UserDto, @Body('uuid') uuid: string) {
    return this.appService.deletePaymentCard(uuid, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/members/')
  getBrandMembers(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getBrandMembers(user, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  getBrand(@CurrentUser() user: UserDto) {
    return this.appService.getBrand(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/posts')
  getBrandPosts(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getPosts(user, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/payment-cards')
  getPaymentCard(@CurrentUser() user: UserDto, @Req() req: Request) {
    return this.appService.getPaymentCard(user, req);
  }

  @Get('/tasks')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  getBrandTask(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getBrandTask(user, payload);
  }

  @Get('/discounts')
  @UseGuards(JwtAuthGuard)
  getDicounts(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getDiscounts(user, payload);
  }

  @Get('/giftcards')
  @UseGuards(JwtAuthGuard)
  getGiftCards(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getGiftCards(user, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/post')
  @FormDataRequest()
  createBrandPost(
    @CurrentUser() user: UserDto,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.appService.createPost(createPostDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/payment-card')
  @FormDataRequest()
  addCard(@CurrentUser() user: UserDto, @Body() cardDto: CardDto) {
    return this.appService.addCard(cardDto, user);
  }

  @Post('/task')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  createTask(
    @CurrentUser() user: UserDto,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.appService.createBrandTask(user, createTaskDto);
  }

  @Post('/discount')
  @UseGuards(JwtAuthGuard)
  createDiscount(
    @CurrentUser() user: UserDto,
    @Body() createDiscountDto: CreateDiscountDto,
  ) {
    return this.appService.createDiscount(user, createDiscountDto);
  }

  @Post('/discount/user')
  @UseGuards(JwtAuthGuard)
  createDiscountToUser(
    @CurrentUser() user: UserDto,
    @Body() input: GiftUserDiscountDto,
  ) {
    return this.appService.createDiscountToUser(user, input);
  }

  @Post('/giftcard')
  @UseGuards(JwtAuthGuard)
  createGiftCard(
    @CurrentUser() user: UserDto,
    @Body() createGiftCardDto: CreateGiftCardDto,
  ) {
    return this.appService.createGiftCard(user, createGiftCardDto);
  }

  @Post('/giftcard/user')
  @UseGuards(JwtAuthGuard)
  createGiftCardToUser(
    @CurrentUser() user: UserDto,
    @Body() input: GiftUserCardDto,
  ) {
    return this.appService.createGiftCardToUser(user, input);
  }

  @Get('/task-submission/:task_uuid/:member_uuid')
  @UseGuards(JwtAuthGuard)
  getSubmissionByTask(
    @CurrentUser() user: UserDto,
    @Param() input: { [key: string]: string },
  ) {
    return this.appService.getSubmissionByTask(
      user,
      input.task_uuid,
      input.member_uuid,
    );
  }

  @Put('/task-submission/review')
  @UseGuards(JwtAuthGuard)
  approveSubmission(
    @CurrentUser() user: UserDto,
    @Body() input: { [key: string]: string },
  ) {
    return this.appService.approveSubmission(user, input);
  }

  @Post('/membership-mail')
  @UseGuards(JwtAuthGuard)
  createMemberShipMail(
    @CurrentUser() user: UserDto,
    @Body() createMemberShipMailDto: CreateMemberShipMailDto,
  ) {
    return this.appService.createMemberShipMail(user, createMemberShipMailDto);
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

  @MessagePattern('get_task_from_brands')
  getTaskFromBrands(@Payload() payload: { [key: string]: string }) {
    console.log(payload);
    return this.appService.getTaskFromBrands(payload);
  }

  @MessagePattern('search')
  searchFunction(@Payload() { input, user }: Record<string, any>) {
    return this.appService.searchFunction(input, user);
  }

  @MessagePattern('get_task')
  getTask(@Payload() { uuid }: Record<string, string>) {
    return this.appService.getTask(uuid);
  }

  @EventPattern('update_task_completed')
  updateTaskCompleted(@Payload() payload: Record<string, any>) {
    return this.appService.updateTaskReview(payload);
  }
}

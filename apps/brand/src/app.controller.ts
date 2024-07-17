import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
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

@Controller('brand')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  getBrand(@CurrentUser() user: UserDto) {
    return this.appService.getBrand(user);
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
  @Post('/post')
  @FormDataRequest()
  createBrandPost(
    @CurrentUser() user: UserDto,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.appService.createPost(createPostDto, user);
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

  @UseGuards(JwtAuthGuard)
  @Delete('/post')
  deleteBrandPost(@CurrentUser() user: UserDto, @Body() uuid: string) {
    return this.appService.deletePost(uuid, user);
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
  @Get('/posts/')
  getBrandPosts(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getPosts(user, payload);
  }

  @Get('/tasks/')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  getBrandTask(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getBrandTask(user, payload);
  }

  @Get('/discount/')
  @UseGuards(JwtAuthGuard)
  getDicounts(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.appService.getDiscount(user, payload);
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

  @MessagePattern('get_task_from_brands')
  getTaskFromBrands(@Payload() payload: { [key: string]: string }) {
    return this.appService.getTaskFromBrands(payload);
  }
}

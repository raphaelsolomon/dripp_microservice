import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { Request } from 'express';

@Controller('brand')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  getBrand(@CurrentUser() user: UserDto) {
    return this.appService.getBrand(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update')
  updateBrand(
    @CurrentUser() user: UserDto,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.appService.updatebrand(user, updateBrandDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/members/:first/:page')
  getBrandMembers(@CurrentUser() user: UserDto, @Req() req: Request) {
    return this.appService.getBrandMembers(user, req);
  }

  @Post('/task/create')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  createTask(
    @CurrentUser() user: UserDto,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.appService.createBrandTask(user, createTaskDto);
  }

  @MessagePattern('create_brand')
  createBrand(@Payload() payload: any) {
    return this.appService.createBrand(payload);
  }

  @EventPattern('add_member')
  addMember(
    @CurrentUser() user: UserDto,
    @Payload() payload: { [key: string]: [string] },
  ) {
    this.appService.addMember(payload);
  }
}

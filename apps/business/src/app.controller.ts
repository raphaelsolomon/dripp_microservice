import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('business')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  getBusiness(@CurrentUser() user: UserDto) {
    return this.appService.getBusiness(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update')
  updateBusiness(
    @CurrentUser() user: UserDto,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.appService.updateBusiness(user, updateBusinessDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/task/create')
  createTask(
    @CurrentUser() user: UserDto,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.appService.createBusinessTask(user, createTaskDto);
  }

  @MessagePattern('create_business')
  createBusiness(@Payload() payload: any) {
    return this.appService.createBusiness(payload);
  }
}

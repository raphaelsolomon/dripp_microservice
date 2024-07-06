import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('business')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  getHello(@CurrentUser() user: UserDto): string {
    console.log(user);
    return this.appService.getHello();
  }

  @MessagePattern('create_business')
  createBusiness(@Payload() payload: any) {
    return this.appService.createBusiness(payload);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('business')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/update')
  updateBusiness(
    @CurrentUser() user: UserDto,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.appService.updateBusiness(user, updateBusinessDto);
  }

  @MessagePattern('create_business')
  createBusiness(@Payload() payload: any) {
    return this.appService.createBusiness(payload);
  }
}

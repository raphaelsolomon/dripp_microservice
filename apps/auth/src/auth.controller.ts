/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserDocument } from './users/models/user.schema';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { CurrentUser } from '@app/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly jwtsService: JwtService,
  ) {}

  @Post('/register')
  async createUser(@Body() createUserDto: CreateUserDto) {
    console.log(createUserDto);
    return this.usersService.create(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(user, response);
    response.json(result);
  }

  @Get('/facebook/oauth')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth(@Req() req: Request) {}

  @Get('/facebook/redirect')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const result = await this.authService.facebookLogin(req, res);
    res.json(result);
  }

  @Get('/google/oauth')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {}

  @Get('/google/redirect')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req, res);
    res.json(result);
  }

  @UseGuards(JwtAuthGuard)
  @MessagePattern('authenticate')
  async authenticate(@Payload() data: any) {
    return data.user;
  }
}

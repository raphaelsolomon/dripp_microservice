/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserDocument, UserDto } from '@app/common';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { CurrentUser } from '@app/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { VerifyEmailDto } from './users/dto/verify-email.dto';
import { ResetpasswordDto } from './users/dto/reset-password.dto';
import { XTwitterAuthGuard } from './guards/twitter-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

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

  @Post('/register')
  async createUser(
    @Body() input: CreateUserDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.create(input, res);
    res.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.login(user, response);
    response.json({
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    });
  }

  @Post('/verify')
  async verifyAccount(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.usersService.verifyAccount(verifyEmailDto);
  }

  @Post('/resend-email')
  async resendEmail(@Body() { email }: { [key: string]: string }) {
    return this.usersService.resendEmail(email);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() { email }: { [key: string]: string }) {
    return this.usersService.forgotPassword(email);
  }

  @Post('/reset-password')
  async resetPassword(@Body() input: ResetpasswordDto, @Req() req: Request) {
    const result = await this.usersService.resetPassword(input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('/facebook/oauth')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth(@Req() req: Request) {}

  @Get('/google/oauth')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {}

  @Get('/x/oauth')
  @UseGuards(XTwitterAuthGuard)
  async xAuth(@Req() req: Request) {}

  @Get('verify/oauth/:provider')
  async verifyOAuth(
    @Query('code') code: string,
    @Param('provider') provider: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.verifyOAuth(provider, code, res);
    res.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    });
  }

  @Get('/x/redirect')
  @UseGuards(XTwitterAuthGuard)
  async xAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.xLogin(req, res);
    res.json({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    });
  }

  @Post('/exchange/refreshtoken')
  async exchangeRefreshToken(
    @Body('refresh_token') token: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.exchangeRefreshToken(token, res);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: UserDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.logout(user, res);
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
  @MessagePattern('authenticate')
  async authenticate(@Payload() data: any) {
    return data.user;
  }
}

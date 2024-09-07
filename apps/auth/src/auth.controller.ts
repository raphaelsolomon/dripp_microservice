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
  healthCheck(@Res() res: Response) {
    return res.sendStatus(200);
  }

  @Post('/register')
  async createUser(@Body() input: CreateUserDto, @Res() res: Response) {
    const result = await this.authService.create(input, res);
    res.json(result);
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
  async resetPassword(
    @Body()
    resetpasswordDto: ResetpasswordDto,
  ) {
    return this.usersService.resetPassword(resetpasswordDto);
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

  @Get('/x/oauth')
  @UseGuards(XTwitterAuthGuard)
  async xAuth(@Req() req: Request) {}

  @Get('/x/redirect')
  @UseGuards(XTwitterAuthGuard)
  async xAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.xLogin(req, res);
    res.json(result);
  }

  @Post('/exchange/refreshtoken')
  exchangeRefreshToken(
    @Body('refresh_token') token: string,
    @Res() res: Response,
  ) {
    return this.authService.exchangeRefreshToken(token, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: UserDto, @Res() res: Response) {
    return this.authService.logout(user, res);
  }

  @UseGuards(JwtAuthGuard)
  @MessagePattern('authenticate')
  async authenticate(@Payload() data: any) {
    return data.user;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './users.repository';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from './models/user.schema';
import { getUserDto } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  BUSINESS_SERVICE,
  generateRandomCode,
  NOTIFICATION_SERVICE,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { map, tap } from 'rxjs';
import { VerificationRepository } from './verification.repository';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationRepository: VerificationRepository,
    @Inject(NOTIFICATION_SERVICE) private notificationClientProxy: ClientProxy,
    @Inject(BUSINESS_SERVICE) private businessClientProxy: ClientProxy,
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserDto(createUserDto);
    const username = createUserDto.email.split('@')[0];
    const user = await this.userRepository.create({
      ...createUserDto,
      username,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
    const verification = await this.verificationRepository.create({
      email: user.email,
      code: generateRandomCode(5).toUpperCase(),
      expires_at: new Date().getTime() + 7 * 60 * 1000, // expires at 7 mins,
    });
    this.notificationClientProxy.emit('mail_verify', {
      email: verification.email,
      name: createUserDto.fullname ?? username,
      code: verification.code,
    });
    return { status: true, user: this.destructureUser(user) };
  }

  async resendEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({ email });
      const verification = await this.verificationRepository.findOneAndUpdate(
        {
          email: user.email,
        },
        {
          code: generateRandomCode(5).toUpperCase(),
          expires_at: new Date().getTime() + 7 * 60 * 1000, // expires at 7 mins,
        },
      );
      this.notificationClientProxy.emit('mail_verify', {
        email: verification.email,
        name: user.fullname ?? user.username,
        code: verification.code,
      });
      return { status: true, message: 'verification code sent successfully' };
    } catch (err) {
      throw new HttpException('Record not found', HttpStatus.NOT_FOUND);
    }
  }

  async verifyAccount(verifyEmailDto: VerifyEmailDto) {
    try {
      const verification = await this.verificationRepository.findOne({
        email: verifyEmailDto.email,
      });

      if (verification.code !== verifyEmailDto.code) {
        throw new HttpException('Invalid code', HttpStatus.BAD_REQUEST);
      }

      if (new Date().getTime() > verification.expires_at) {
        throw new HttpException(
          'This code is no longer valid',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.verificationRepository.findOneAndDelete({
        email: verifyEmailDto.email,
      });

      const user = await this.userRepository.findOneAndUpdate(
        {
          email: verifyEmailDto.email,
        },
        { email_verified: true },
      );
      return this.destructureUser(user);
    } catch (err) {
      throw new HttpException('Record not found', HttpStatus.NOT_FOUND);
    }
  }

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    try {
      await this.userRepository.findOne({ email: createUserDto.email });
    } catch (err) {
      return;
    }
    throw new UnprocessableEntityException('Email already exist.');
  }

  async verifyUser(identifier: string, password: string) {
    const user = await this.userRepository.findOne(
      { $or: [{ email: identifier }, { username: identifier }] },
      '+password',
    );
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('credentials are not valid');
    }
    return user;
  }

  async getUser(getUserDto: getUserDto) {
    const user = await this.userRepository.findOne(getUserDto);
    return user;
  }

  destructureUser(user: UserDocument) {
    const { password, ...details } = user;
    return details;
  }

  async updateUser(updateDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ _id: updateDto._id });
    if (user.account_type !== 'user' && updateDto.account_type === 'business') {
      return this.businessClientProxy
        .send('create_business', { userId: user._id })
        .pipe(
          tap((response) => console.log(response)),
          map(async (response) => {
            const { password, email, ...details } = updateDto;
            const user = await this.userRepository.findOneAndUpdate(
              { _id: updateDto._id },
              { ...details, business_id: response.uuid },
            );
            return this.destructureUser(user);
          }),
        );
    } else if (
      user.account_type !== 'business' &&
      updateDto.account_type === 'user'
    ) {
      const { password, email, ...details } = updateDto;
      const user = await this.userRepository.findOneAndUpdate(
        { _id: updateDto._id },
        { ...details },
      );
      return this.destructureUser(user);
    } else {
      const { password, email, account_type, ...details } = updateDto;
      const user = await this.userRepository.findOneAndUpdate(
        { _id: updateDto._id },
        { ...details },
      );
      return this.destructureUser(user);
    }
  }

  async authenticateGoogle(profile: any) {
    const email: string = profile?._json?.email;
    try {
      return await this.userRepository.findOne({ email });
    } catch (err) {
      const createUserDto = new CreateUserDto();
      createUserDto.email = email;
      createUserDto.fullname = profile?._json?.name;

      const user = await this.userRepository.create({
        ...createUserDto,
        avatar: profile?._json?.picture,
        username: email.split('@')[0],
        email_verified: profile?._json?.email_verified,
        password: await bcrypt.hash('randompassword', 10),
      });
      return user;
    }
  }

  async authenticateFacebook(profile: Record<string, any>) {
    const email: string = profile?._json?.email;
    try {
      return await this.userRepository.findOne({ email });
    } catch (err) {
      const name: string = `${profile?._json?.first_name} ${profile?._json?.last_name}`;
      const createUserDto = new CreateUserDto();
      createUserDto.email = email;
      createUserDto.fullname = name;

      const user = await this.userRepository.create({
        ...createUserDto,
        avatar: null,
        username: email.split('@')[0],
        email_verified: true,
        gender: profile?.gender ?? null,
        password: await bcrypt.hash('randompassword', 10),
      });
      return user;
    }
  }

  async resetPassword(email: string) {
    const user = await this.userRepository.findOne({ email });
    if (user) {
      console.log('reset password');
    }
  }

  async forgotPassword(email: string) {
    try {
      const token = generateRandomCode(100);
      await this.userRepository.findOneAndUpdate(
        { email },
        { password_reset: token },
      );
      this.notificationClientProxy.emit('reset_password', {
        email: email,
        token: token,
      });
      return { status: true, message: 'password reset link sent to ' + email };
    } catch (err) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }
  }
}

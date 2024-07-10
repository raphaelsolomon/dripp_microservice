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
  CloudinaryService,
  generateRandomCode,
  NOTIFICATION_SERVICE,
  WALLET_SERVICE,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, map, tap } from 'rxjs';
import { VerificationRepository } from './verification.repository';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetpasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly verificationRepository: VerificationRepository,
    @Inject(NOTIFICATION_SERVICE) private notificationClientProxy: ClientProxy,
    @Inject(WALLET_SERVICE) private walletClientProxy: ClientProxy,
    @Inject(BUSINESS_SERVICE) private businessClientProxy: ClientProxy,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    await this.validateCreateUserDto(createUserDto);
    // Create username from the email address
    const username = createUserDto.email.split('@')[0];
    // create a new entry for the user on the database
    const user = await this.userRepository.create({
      ...createUserDto,
      username,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
    /* create a new verification entry containing the verification token & expiry time */
    const verification = await this.verificationRepository.create({
      email: user.email,
      code: generateRandomCode(5).toUpperCase(), // token used for verification
      expires_at: new Date().getTime() + 7 * 60 * 1000, // expires at 7 mins,
    });
    try {
      /* create the wallet and attach the wallet uuid to the user */
      const wallet = await firstValueFrom(
        this.walletClientProxy.send('create_wallet', {}),
      );
      /* Update the user with the wallet gotten from the message pattern */
      await this.userRepository.findOneAndUpdate(
        { uuid: user.uuid },
        { wallet_uuid: wallet.uuid },
      );
      /* send the user a verification, in other to verify their account */
      this.notificationClientProxy.emit('mail_verify', {
        email: verification.email,
        name: createUserDto.fullname ?? username,
        code: verification.code,
      });
      // send the user results as response to the client request
      return { status: true, user: this.destructureUser(user) };
    } catch (err) {
      throw new Error(err);
    }
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

      return await this.userRepository.findOneAndUpdate(
        { email: verifyEmailDto.email },
        { email_verified: true },
      );
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
    const { password, password_reset_token, ...details } = user;
    return details;
  }

  async updateUser(userInfo: UserDocument, updateDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ _id: userInfo._id });
    if (user.account_type !== 'user' && updateDto.account_type === 'business') {
      return this.businessClientProxy.send('create_business', {}).pipe(
        tap((response) => console.log('Done creating business')),
        map(async (response) => {
          const { password, email, ...details } = updateDto;
          const user = await this.userRepository.findOneAndUpdate(
            { _id: userInfo._id },
            { ...details, business_uuid: response.uuid },
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
        { _id: userInfo._id },
        { ...details },
      );
      return this.destructureUser(user);
    } else {
      const { password, email, account_type, ...details } = updateDto;
      const user = await this.userRepository.findOneAndUpdate(
        { _id: userInfo._id },
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

  async forgotPassword(email: string) {
    try {
      const token = generateRandomCode(100);
      await this.userRepository.findOneAndUpdate(
        { email },
        { password_reset_token: token },
      );
      this.notificationClientProxy.emit('reset_password', {
        email: email,
        token: token,
      });
      return { status: true, message: 'password reset link sent to ' + email };
    } catch (err) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async resetPassword(resetpasswordDto: ResetpasswordDto) {
    try {
      await this.userRepository.findOne(
        {
          password_reset_token: resetpasswordDto.token,
        },
        '+password_reset_token',
      );

      if (resetpasswordDto.new_password !== resetpasswordDto.confirm_password) {
        throw new HttpException(
          'Password does not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      const new_password = await bcrypt.hash(resetpasswordDto.new_password, 10);
      this.userRepository.findOneAndUpdate(
        { password_reset_token: resetpasswordDto.token },
        { password: new_password, password_reset_token: null },
      );
      return { status: true, message: 'Password changed successfully' };
    } catch (err) {
      throw new HttpException('Record not found', HttpStatus.NOT_FOUND);
    }
  }

  async updatePassword(
    userInfo: UserDocument,
    updatePasswordDto: UpdatePasswordDto,
  ) {
    try {
      const user = await this.userRepository.findOne(
        { uuid: userInfo.uuid },
        '+password',
      );

      const passwordIsValid = await bcrypt.compare(
        updatePasswordDto.old_password,
        user.password,
      );

      if (
        updatePasswordDto.new_password !== updatePasswordDto.confirm_password
      ) {
        throw new HttpException(
          'Password does not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!passwordIsValid) {
        throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
      }

      const newPassword = await bcrypt.hash(updatePasswordDto.new_password, 10);

      await this.userRepository.findOneAndUpdate(
        { uuid: user.uuid },
        { password: newPassword },
      );

      return { status: true, message: 'Password updated successfully' };
    } catch (err) {
      throw new HttpException(`${err}`, HttpStatus.NOT_FOUND);
    }
  }

  async uploadAvatar(userInfo: UserDocument, file: any) {
    const result = await this.cloudinaryService.uploadFile(
      file,
      'profileImage',
    );
    const user = await this.userRepository.findOneAndUpdate(
      { uuid: userInfo.uuid },
      { avatar: result.url },
    );
    return this.destructureUser(user);
  }
}

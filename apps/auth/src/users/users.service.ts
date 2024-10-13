/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './repositories/users.repository';
import * as bcrypt from 'bcryptjs';
import {
  AccountType,
  CHAT_SERVICE,
  IndustryRepository,
  SubmissionRepository,
  TaskCompletionDocument,
  TaskCompletionRepository,
  UserDocument,
} from '@app/common';
import { getUserDto } from './dto/get-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  BRAND_SERVICE,
  CloudinaryService,
  generateRandomCode,
  NOTIFICATION_SERVICE,
  WALLET_SERVICE,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom, map, tap } from 'rxjs';
import { VerificationRepository } from './repositories/verification.repository';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetpasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { TaskSubmissionDto } from './dto/submit-task.dto';
import { TokenRepository } from './repositories/token.repository';
import { countryList } from '../assets/countries';
import { TokenPayload as GoogleTokenPayload } from 'google-auth-library';
import { BrandDocument } from 'apps/brand/src/models/brand.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly taskCompletionRepository: TaskCompletionRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly verificationRepository: VerificationRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly industryRepository: IndustryRepository,
    @Inject(NOTIFICATION_SERVICE) private notificationClientProxy: ClientProxy,
    @Inject(WALLET_SERVICE) private walletClientProxy: ClientProxy,
    @Inject(BRAND_SERVICE) private brandClientProxy: ClientProxy,
    @Inject(CHAT_SERVICE) private chatServiceProxy: ClientProxy,
  ) {}

  generateRandomString(length: number): string {
    const charset = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
    let result: string = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset.charAt(randomIndex);
    }
    return result;
  }

  async getIndustries(input: { [key: string]: number }) {
    const page: number = input.page || 1;
    const first: number = input.first || 20;
    return this.industryRepository.getPaginatedDocuments(first, page, {});
  }

  async create(input: CreateUserDto) {
    let username = input?.username;
    // Check if user already exists
    await this.validateCreateUserDto(input);

    // check if username is provided
    if (username) {
      await this.validateUsername(input.username);
    } else {
      // Create username from the email address
      username = input.email.split('@')[0];
    }
    // create a new entry for the user on the database
    const user = await this.userRepository.create({
      ...input,
      username,
      password: await bcrypt.hash(input.password, 10),
    });
    //create the user refresh token record
    await this.tokenRepository.create({ user_id: user._id.toString() });
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

      /* create the chatUUID and attach the chatUUID to the user */
      const chat = await firstValueFrom(
        this.chatServiceProxy.send('create_chat', {}),
      );

      /* Update the user with the wallet & chat gotten from the message patterns */
      await this.userRepository.findOneAndUpdate(
        { uuid: user.uuid },
        { wallet_uuid: wallet.uuid, chat_uuid: chat.uuid },
      );
      /* send the user a verification, in other to verify their account */
      this.notificationClientProxy.emit('mail_verify', {
        email: verification.email,
        name: (user as any).fullname ?? username,
        code: verification.code,
      });
      // send the user results as response to the client request
      return user;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async resendEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({ email, status: true });

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
        name: (user as any).fullname ?? user.username,
        code: verification.code,
      });
      return { status: true, message: 'verification code sent successfully' };
    } catch (err) {
      throw new UnprocessableEntityException('Record not found');
    }
  }

  async verifyAccount(verifyEmailDto: VerifyEmailDto) {
    try {
      const verification = await this.verificationRepository.findOne({
        email: verifyEmailDto.email,
      });

      if (verification.code !== verifyEmailDto.code) {
        throw new Error('Invalid code');
      }

      return await this.userRepository.findOneAndUpdate(
        { email: verifyEmailDto.email, status: true },
        { email_verified: true },
      );
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err?.message);
    }
  }

  private async validateCreateUserDto(input: CreateUserDto) {
    try {
      await this.userRepository.findOne({ email: input.email });
    } catch (err) {
      return;
    }
    throw new UnprocessableEntityException('Email already exist.');
  }

  private async validateUsername(username: string) {
    try {
      await this.userRepository.findOne({ username });
    } catch (err) {
      return;
    }
    throw new UnprocessableEntityException('Username already exist.');
  }

  async verifyUser(identifier: string, password: string) {
    const user = await this.userRepository.findOne(
      { $or: [{ email: identifier }, { username: identifier }] },
      '+password',
    );
    if (user.status === false) {
      throw new UnprocessableEntityException('Could not find user');
    }
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('credentials are not valid');
    }
    return user;
  }

  async getUser(getUserDto: getUserDto) {
    const user = await this.userRepository.findOne(getUserDto);
    if (user.status === false) {
      throw new UnprocessableEntityException('Could not find user');
    }
    return user;
  }

  destructureUser(user: UserDocument) {
    const { password, password_reset_token, ...details } = user;
    return details;
  }

  async setAccountType(userInfo: UserDocument, accountType: AccountType) {
    const user = await this.userRepository.findOne({ _id: userInfo?._id });

    if (!user || user.status === false) {
      throw new UnprocessableEntityException('Could not find user');
    }

    if (user?.account_type) {
      //User cant reselct account type
      throw new BadRequestException('Account type already selected');
    }

    switch (accountType) {
      case AccountType.business: {
        const sendMessageAndUpdateUser = async () => {
          try {
            console.log('Sending message');

            const self = this;

            await lastValueFrom(this.brandClientProxy.send('create_brand', {}))
              .then(async (response) => {
                const user = await self.userRepository.findOneAndUpdate(
                  { _id: userInfo._id },
                  {
                    account_type: AccountType.business,
                    brand_uuid: response.uuid,
                  },
                );
                console.log('Added brand UUID to USER');

                return self.destructureUser(user);
              })
              .catch((err) => {
                console.log(err);
                throw new UnprocessableEntityException(err);
              });
          } catch (err) {
            console.log(err);
            throw new UnprocessableEntityException(err);
          }
        };

        const response = await sendMessageAndUpdateUser();

        return response;
      }

      case AccountType.user: {
        console.log('ACCOUNT TYPE IS USER');
        const user = await this.userRepository.findOneAndUpdate(
          { _id: userInfo._id },
          { account_type: AccountType.user },
        );

        return this.destructureUser(user);
      }

      default: {
        throw new BadRequestException('Account type not valid');
      }
    }
  }

  async updateUser(userInfo: UserDocument, updateDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ _id: userInfo._id });

    if (user.status === false) {
      throw new UnprocessableEntityException('Could not find user');
    }

    try {
      const brands = updateDto.brand_uuids;
      if (updateDto.industries && updateDto.industries.length > 0) {
        const industries = updateDto.industries.map((e) => e.toLowerCase());
        const count = await this.industryRepository.countDocs({
          name: { $in: updateDto?.industries },
        });

        if (count < industries.length)
          throw new BadRequestException('Invalid industries selected');
      }

      // emit an event to brand service to update brands with the new member
      if (
        brands?.length > 0 &&
        (user?.account_type === 'user' || updateDto?.account_type === 'user')
      ) {
        this.brandClientProxy.emit('add_member_to_multiple_brands', {
          brand_uuids: updateDto?.brand_uuids,
          user_uuid: user.uuid,
        });
      } else {
        const { password, email, account_type, ...details } = updateDto;

        const user = await this.userRepository.findOneAndUpdate(
          { _id: userInfo._id },
          { ...details },
        );

        return this.destructureUser(user);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async authenticateGoogle(profile: GoogleTokenPayload) {
    const email: string = profile?.email;

    console.log(profile);
    try {
      const user = await this.userRepository.findOne({ email });
      // if this user account is not active again
      if (user.status === false) {
        throw new UnprocessableEntityException('Could not find user');
      }
      return user;
    } catch (err) {
      const input = new CreateUserDto();
      input.email = email;
      input.setFullname(profile?.name);

      const randomPass = this.generateRandomString(16);

      const user = await this.userRepository.create({
        ...input,
        avatar: profile?.picture,
        firstname: profile?.given_name ?? '',
        lastname: profile?.family_name ?? '',
        username: email.split('@')[0],
        email_verified: true,
        password: await bcrypt.hash(randomPass, 10),
      });
      return user;
    }
  }

  async authenticateFacebook(profile: Record<string, any>) {
    const email: string = profile?.email;
    try {
      const user = await this.userRepository.findOne({ email });
      // if this user account is not active again
      if (user.status === false) {
        throw new UnprocessableEntityException('Could not find user');
      }
      return user;
    } catch (err) {
      const name: string = profile?.name;
      const [firstname, lastname] = name?.split(' ');
      const input = new CreateUserDto();
      input.email = email;
      input.setFullname(name);

      const randomPass = this.generateRandomString(16);

      const user = await this.userRepository.create({
        ...input,
        firstname: firstname ?? '',
        lastname: lastname ?? '',
        avatar: profile?.picture?.data?.url,
        username: email.split('@')[0],
        email_verified: true,
        gender: profile?.gender ?? null,
        password: await bcrypt.hash(randomPass, 10),
      });
      return user;
    }
  }

  async authenticateX(profile: Record<string, any>) {
    console.log(profile);
    const email: string = profile?.email;
    try {
      const user = await this.userRepository.findOne({ email });
      if (user.status === false) {
        throw new UnprocessableEntityException('Could not find user');
      }
      return user;
    } catch (err) {
      const input = new CreateUserDto();
      const [firstname, lastname] = profile?.name.split(' ');
      input.email = email;
      input.setFullname(profile?.name);

      const randomPass = this.generateRandomString(16);

      const user = await this.userRepository.create({
        ...input,
        firstname,
        lastname,
        avatar: profile?.profile_image_url,
        username: email.split('@')[0],
        email_verified: true,
        password: await bcrypt.hash(randomPass, 10),
      });
      return user;
    }
  }

  async forgotPassword(email: string) {
    try {
      const token = generateRandomCode(100);
      const user = await this.userRepository.findOne({ email });
      if (user.status === false) {
        throw new UnprocessableEntityException('Could not find user');
      }
      await this.userRepository.findOneAndUpdate(
        { email: user.email, status: true },
        { password_reset_token: token },
      );
      this.notificationClientProxy.emit('reset_password', {
        email: email,
        token: token,
      });
      return { status: true, message: 'password reset link sent to ' + email };
    } catch (err) {
      throw new UnprocessableEntityException('User not found');
    }
  }

  async resetPassword(resetpasswordDto: ResetpasswordDto) {
    try {
      await this.userRepository.findOne(
        {
          password_reset_token: resetpasswordDto.token,
          status: true,
        },
        '+password_reset_token',
      );

      if (resetpasswordDto.new_password !== resetpasswordDto.confirm_password) {
        throw new UnprocessableEntityException('Password does not match');
      }

      const new_password = await bcrypt.hash(resetpasswordDto.new_password, 10);
      this.userRepository.findOneAndUpdate(
        { password_reset_token: resetpasswordDto.token },
        { password: new_password, password_reset_token: null },
      );
      return { status: true, message: 'Password changed successfully' };
    } catch (err) {
      throw new UnprocessableEntityException('Record not found');
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
        throw new UnprocessableEntityException('Password does not match');
      }

      if (!passwordIsValid) {
        throw new UnprocessableEntityException('Wrong password');
      }

      const newPassword = await bcrypt.hash(updatePasswordDto.new_password, 10);

      await this.userRepository.findOneAndUpdate(
        { uuid: user.uuid },
        { password: newPassword },
      );

      return { status: true, message: 'Password updated successfully' };
    } catch (err) {
      throw new UnprocessableEntityException(`${err}`);
    }
  }

  async uploadAvatar(userInfo: UserDocument, file: any) {
    const result = await this.cloudinaryService.uploadFile(
      file,
      'profile-images',
    );
    const user = await this.userRepository.findOneAndUpdate(
      { uuid: userInfo.uuid, status: true },
      { avatar: result.url },
    );
    return this.destructureUser(user);
  }

  async getUserBy(payload: { [key: string]: string }) {
    return this.userRepository.findOne({ ...payload });
  }

  //==================================EVENTS============================================
  async getChannels(user: UserDocument, payload: { [key: string]: number }) {
    if (user.account_type === 'business') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const page: number = payload?.page ?? 1;
    const first: number = payload?.first ?? 20;
    const user_uuid = user.uuid;
    return await firstValueFrom(
      this.brandClientProxy.send('get_channels', { first, page, user_uuid }),
    );
  }

  async getRecommededChannels(
    user: UserDocument,
    payload: { [key: string]: number },
  ) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const page: number = payload?.page ?? 1;
    const first: number = payload?.first ?? 20;

    return await firstValueFrom(
      this.brandClientProxy.send('get_recommended_channels', {
        first,
        page,
        member_uuid: user.uuid,
      }),
    );
  }

  async subscribeChannel(user: UserDocument, brand_uuid: string) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }
    return await firstValueFrom(
      this.brandClientProxy.send('add_member_to_single_brand', {
        member_uuid: user.uuid,
        brand_uuid,
      }),
    );
  }

  async unsubscribeChannel(user: UserDocument, brand_uuid: string) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }
    return await firstValueFrom(
      this.brandClientProxy.send('remove_member_from_brand', {
        member_uuid: user.uuid,
        brand_uuid,
      }),
    );
  }

  async getTasks(user: UserDocument, payload: { [key: string]: number }) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const page: number = payload?.page ?? 1;
    const first: number = payload?.first ?? 20;

    return await firstValueFrom(
      this.brandClientProxy.send('get_task_from_brands', {
        member_uuid: user.uuid,
        first,
        page,
        user,
      }),
    );
  }

  async getPosts(user: UserDocument, payload: { [key: string]: string }) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const page = payload?.page ?? '1';
    const first = payload?.first ?? '20';

    return await firstValueFrom(
      this.brandClientProxy.send('get_post_from_brands', {
        member_uuid: user.uuid,
        first,
        page,
        user,
      }),
    );
  }

  async postReaction(user: UserDocument, input: string) {
    if (user.account_type !== 'user') {
      throw new BadRequestException('action not supported ontthis acount type');
    }
    const result = await firstValueFrom(
      this.brandClientProxy.send('post_reaction', {
        post_uuid: input,
        user_uuid: user.uuid,
      }),
    );

    return result;
  }

  async updateUsername(payload: { [key: string]: string }) {
    const user = await this.userRepository.findOne(
      {
        username: payload.username,
      },
      undefined,
      undefined,
      undefined,
      false,
    );
    if (user && user?._id.toString() !== payload?._id) {
      throw new BadRequestException(`User with username already exists`);
    }
    return await this.userRepository.findOneAndUpdate(
      { _id: payload._id },
      { username: payload.username },
    );
  }

  async updateChatUuid(payload: { [key: string]: string }) {
    return await this.userRepository.findOneAndUpdate(
      { _id: payload._id },
      { chat_uuid: payload.chat_uuid },
    );
  }

  async deactivateAccount(user: UserDocument, password: string) {
    const userDocument = await this.userRepository.findOne(
      { _id: user._id },
      '+password',
    );
    const passwordIsValid = await bcrypt.compare(
      password,
      userDocument.password,
    );
    if (!passwordIsValid) {
      throw new UnauthorizedException('credentials are not valid');
    }
    await this.userRepository.findOneAndUpdate(
      { _id: user._id },
      { status: false },
    );

    //TODO: emit event to other services to delette record attacht to this user
    console.log(userDocument);
  }

  async submitTask(user: UserDocument, input: TaskSubmissionDto) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const task = await firstValueFrom(
      this.brandClientProxy.send('get_task', { uuid: input.task_uuid }),
    );

    const is_social: boolean = this.isJsonParsable(input.campaign_type);
    const uuid: string = task.uuid;
    const user_uuid: string = user.uuid;

    if (is_social) {
      const campaign_type = JSON.parse(input.campaign_type);
      // check if thre task contains a social media engagement task.
      if (!task.campaign_type.hasOwnProperty('social_media_engagement')) {
        throw new BadRequestException('Invalid campaign type on task');
      }

      const social_type = campaign_type.social_media_engagement;
      const task_social_type = task.campaign_type.social_media_engagement;
      const task_social_length = Object.keys(task_social_type).length;

      //check if the social media provided is also part of the task.
      if (!task_social_type.hasOwnProperty(social_type)) {
        throw new BadRequestException('Invalid social media type on task');
      }

      //check if user has sumbitted for this task with exact camapign type
      const submission_type = task_social_type[social_type].submission_type;
      if (await this.isTaskSubmitted(uuid, user_uuid, input.campaign_type)) {
        throw new BadRequestException('task has already been submitted');
      }

      //get the kind of submission required for that task
      const getType = await this.getSubmissionType(submission_type, input);
      // then submit the task for the user.
      const result = await this.submissionRepository.create({
        task_uuid: uuid,
        user_uuid: user.uuid,
        campaign_type: input.campaign_type,
        ...getType,
      });

      //get total social tasks submitted by user
      const socialSubmittedLength = await this.submissionRepository.find({
        task_uuid: uuid,
        user_uuid: user.uuid,
        campaign_type: { $regex: /social_media_engagement/, $options: 'i' },
      });

      //check if user has completed all social media tasks.
      if (socialSubmittedLength.length >= task_social_length)
        await this.findAndCreateOrUpdateTaskCompletion(uuid, user_uuid, task);

      return result;
    } else {
      // if task is a non social media task
      const campaign_type = input.campaign_type;
      const task_campaign_type = task.campaign_type;

      //check if the social media provided is also part of the task.
      if (!task_campaign_type.hasOwnProperty(campaign_type)) {
        throw new BadRequestException('Invalid campaign type on task');
      }

      //check if user has sumbitted for this task with exact camapign type
      const submission_type = task_campaign_type[campaign_type].submission_type;
      if (await this.isTaskSubmitted(uuid, user_uuid, input.campaign_type)) {
        throw new BadRequestException('task has already been submitted');
      }

      //get the kind of submission required for that task
      const getType = await this.getSubmissionType(submission_type, input);
      // then submit the task for the user.
      const result = await this.submissionRepository.create({
        task_uuid: uuid,
        user_uuid: user.uuid,
        campaign_type: input.campaign_type,
        ...getType,
      });

      //update the task completion.
      await this.findAndCreateOrUpdateTaskCompletion(uuid, user_uuid, task);
      return result;
    }
  }

  async isTaskSubmitted(
    task_uuid: string,
    user_uuid: string,
    campaign_type: string,
  ): Promise<boolean> {
    try {
      await this.submissionRepository.findOne({
        task_uuid,
        user_uuid,
        campaign_type,
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  isJsonParsable(campaign_type: string): boolean {
    try {
      const parsed = JSON.parse(campaign_type);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }

  async getSubmissionType(submission_type: string, input: TaskSubmissionDto) {
    const submissionPayload = { submission_url: '' };
    if (submission_type === 'submission_url') {
      if (!input.submission_url)
        throw new BadRequestException('submission url is required');

      if (input.submission_file)
        throw new BadRequestException('submission file not allowed');

      submissionPayload.submission_url = input.submission_url;
    } else {
      if (input.submission_url)
        throw new BadRequestException('submission url not allowed');

      if (!input.submission_file)
        throw new BadRequestException('submission file is required');

      const cloudinary = await this.cloudinaryService.uploadFile(
        input.submission_file,
        'task-submissions',
      );
      if (cloudinary) {
        submissionPayload.submission_url = cloudinary.url;
      } else {
        throw new BadRequestException('unable to upload task file');
      }
    }

    return { submission_url: submissionPayload.submission_url };
  }

  async getCompletedTasks(
    user: UserDocument,
    payload: { [key: string]: string },
  ) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }
    return await firstValueFrom(
      this.brandClientProxy.send('get_completed_tasks', {
        uuid: user.uuid,
        ...payload,
      }),
    );
  }

  async findAndCreateOrUpdateTaskCompletion(
    task_uuid: string,
    user_uuid: string,
    task: Record<string, any>,
  ) {
    const input = { task_uuid, user_uuid };
    let completion: TaskCompletionDocument;
    try {
      const complete = await this.taskCompletionRepository.findOne(input);
      const filterQuery = { uuid: complete.uuid };
      const updateQuery = { total_completed: complete.total_completed + 1 };
      completion = await this.taskCompletionRepository.findOneAndUpdate(
        filterQuery,
        updateQuery,
      );
    } catch (err) {
      completion = await this.taskCompletionRepository.create(input);
    } finally {
      const total_task: number = Object.keys(task.campaign_type).length;
      if (completion.total_completed >= total_task) {
        this.brandClientProxy.emit('update_task_completed', {
          user_uuid,
          task_uuid,
        });
      }
    }
  }

  async updateRefreshToken(
    user_id: string,
    refresh_token: string,
    access_token: string,
  ) {
    try {
      await this.tokenRepository.findOneAndUpdate(
        { user_id },
        { refresh_token, access_token },
      );
    } catch (err) {
      console.log('CREATING NEW TOKEN RECORD');
      await this.tokenRepository.create({
        user_id,
        refresh_token,
        access_token,
      });
      console.log('CREATED RECORD');
    }
  }

  async getRefreshToken(refresh_token: string) {
    try {
      return await this.tokenRepository.findOne(
        { refresh_token },
        null,
        'user_id',
      );
    } catch (err) {
      return undefined;
    }
  }

  async getToken(user_id: string, access_token: string) {
    return this.tokenRepository.findOne({ user_id, access_token });
  }

  async logout(user_id: string) {
    await this.tokenRepository.findOneAndUpdate(
      { user_id },
      { access_token: null, refresh_token: null },
    );
  }

  async getChannelsByIndustries(
    industries: string[],
    payload: { [key: string]: number },
  ) {
    if (industries.length <= 0) {
      return [];
    }

    const page: number = payload.page || 1;
    const first: number = payload.first || 20;

    const response = await firstValueFrom(
      this.brandClientProxy.send('get_brands_by_industries', {
        page,
        first,
        industries,
      }),
    );
    if (response.status === false) {
      throw new BadRequestException(response.result);
    }
    return response;
  }

  async getCountries() {
    return countryList;
  }
}

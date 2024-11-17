/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './repositories/users.repository';
import * as bcrypt from 'bcryptjs';
import {
  AccountType,
  CHAT_SERVICE,
  IGetGalleryProps,
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
import { ITask, ITaskType } from '../constants/task.constant';
import { TaskSubmission } from './task/submission.task';
import { SubTaskTrackerRepository } from '@app/common/database/repositorys/sub-task-tracker.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly taskCompletionRepository: TaskCompletionRepository,
    private readonly subTaskTrackerRepository: SubTaskTrackerRepository,
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
            await lastValueFrom(this.brandClientProxy.send('create_brand', {}))
              .then(async (response) => {
                const user = await this.userRepository.findOneAndUpdate(
                  { _id: userInfo._id },
                  {
                    account_type: AccountType.business,
                    brand_uuid: response.uuid,
                  },
                );

                return this.destructureUser(user);
              })
              .catch((err) => {
                throw new UnprocessableEntityException(err);
              });
          } catch (err) {
            throw new UnprocessableEntityException(err);
          }
        };

        const response = await sendMessageAndUpdateUser();

        return response;
      }

      case AccountType.user: {
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
      return user;
    }
  }

  async authenticateX(profile: Record<string, any>) {
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

  async getChannel(payload: { brand_uuid: string; user_uuid: string }) {
    return await firstValueFrom(
      this.brandClientProxy.send('get_channel', payload),
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
        user: user,
      }),
    );
  }

  async subscribeChannel(user: UserDocument, brand_uuid: string) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }
    try {
      return await firstValueFrom(
        this.brandClientProxy.send('add_member_to_single_brand', {
          member_uuid: user.uuid,
          brand_uuid,
        }),
      );
    } catch (e) {
      throw new BadRequestException('Member already exist.');
    }
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

  async getTasks(
    user: UserDocument,
    payload: { [key: string]: number | string },
  ) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const page: number = <number>payload?.page ?? 1;
    const first: number = <number>payload?.first ?? 20;
    const filter: string = <string>payload?.filter ?? 'all';

    return await firstValueFrom(
      this.brandClientProxy.send('get_tasks_from_brands', {
        first,
        page,
        user,
        filter,
        ...payload,
      }),
    );
  }

  async getTask(user: UserDocument, task_uuid: string) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }
    return await firstValueFrom(
      this.brandClientProxy.send('get_task', {
        user,
        task_uuid,
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

  async submitTask(
    user: UserDocument,
    input: TaskSubmissionDto,
    task_uuid: string,
  ) {
    if (user.account_type !== 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    // get task details from the brand service
    const getTask = this.brandClientProxy.send('get_task', { task_uuid, user });

    const task: ITask = await firstValueFrom(getTask);

    const taskType: ITaskType[] = task.task_type;
    const categoryId: string = input.categoryId;

    //check if the categoryId is valid
    const i = taskType.findIndex((e) => e.categoryId === categoryId);
    if (i < 0) throw new BadRequestException('Invalid categoryId');

    //check if the task is still active
    if (task.campaign_end_date && task.campaign_end_date < new Date())
      throw new BadRequestException('Task has expired');

    //get the task type details
    const taskTypeDetails: ITaskType = taskType[i];

    //initialize the submission class
    const submission = new TaskSubmission(
      this.submissionRepository,
      user,
      task,
    );

    //check if the task type is social media
    if (taskTypeDetails.categoryId === 'social_media') {
      return await submission.socialSubmision(input, i, async () => {
        await this.findAndCreateOrUpdateTaskCompletion(
          task_uuid,
          user.uuid,
          task,
          input?.id,
        );
      });
    }

    if (taskTypeDetails.categoryId === 'user_generated') {
      return await submission.userGeneratedSubmision(input, i, async () => {
        await this.findAndCreateOrUpdateTaskCompletion(
          task_uuid,
          user.uuid,
          task,
          input?.id,
        );
      });
    }

    return await submission.customSubmision(input, i, async () => {
      await this.findAndCreateOrUpdateTaskCompletion(
        task_uuid,
        user.uuid,
        task,
        input?.id,
      );
    });
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
    task: ITask,
    sub_task_uuid: string,
  ) {
    try {
      console.log('REACHED');
      const query = {
        user_uuid,
        campaign_uuid: task_uuid,
        sub_task_id: sub_task_uuid,
        status: 'started',
      };

      console.log(query, 'Query');

      const subTaskTracker =
        await this.subTaskTrackerRepository.findOneAndUpdate(query, {
          status: 'submitted',
        });

      console.log('Updated to submitted');

      return subTaskTracker;
      // const complete = await this.taskCompletionRepository.findOne(input);
      // const filterQuery = { uuid: complete.uuid };
      // const updateQuery = { total_completed: complete.total_completed + 1 };
      // completion = await this.taskCompletionRepository.findOneAndUpdate(
      //   filterQuery,
      //   updateQuery,
      // );
    } catch (err) {
      console.log(err);

      throw new UnprocessableEntityException(err);
    } finally {
      const allCompletedTasks = await this.subTaskTrackerRepository.countDocs({
        sub_task_id: sub_task_uuid,
        campaign_uuid: task_uuid,
        user_uuid: user_uuid,
        status: 'completed',
      });

      const total_task: number = task.task_type.length;
      if (allCompletedTasks >= total_task) {
        this.brandClientProxy.emit('update_task_completed', {
          user_uuid,
          task_uuid,
        });
      }
    }
  }

  async startTask(task_uuid: string, user_uuid: string, sub_task_id: string) {
    if (!task_uuid) throw new BadRequestException('Campaign ID is required');

    if (!sub_task_id) throw new BadRequestException('Task ID is required');

    const findTask = await this.subTaskTrackerRepository.findOne(
      { sub_task_id, campaign_uuid: task_uuid, user_uuid },
      undefined,
      undefined,
      undefined,
      false,
    );

    if (findTask) throw new ForbiddenException('Task already started');

    try {
      const create = await this.subTaskTrackerRepository.create({
        campaign_uuid: task_uuid,
        sub_task_id,
        user_uuid,
        status: 'started',
      });

      return create;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
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
      await this.tokenRepository.create({
        user_id,
        refresh_token,
        access_token,
      });
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

  async uploadImage(user: UserDocument, image: any) {
    try {
      const response = await this.cloudinaryService.uploadFile(
        image,
        `gallery/${user?.uuid}`,
      );

      return response;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  async getGallery(user: UserDocument, params?: Partial<IGetGalleryProps>) {
    try {
      const folder = `gallery/${user?.uuid}`;

      const gallery = await this.cloudinaryService.getFiles(folder, params);

      return gallery;
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }
  }
}

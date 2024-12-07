/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BrandRepository } from './repositories/brand.repository';
import {
  AccountType,
  aggregationPaginationHelper,
  AUTH_SERVICE,
  caseInsensitiveRegex,
  CloudinaryResponse,
  CloudinaryService,
  getTasksAndTotalTasksAmount,
  IndustryRepository,
  noDataDefault,
  NOTIFICATION_SERVICE,
  partialMatchInsensitiveRegex,
  PopulateDto,
  SubmissionRepository,
  SubmissionStatus,
  SubTaskTrackerDocument,
  TaskCompletionDocument,
  TaskCompletionRepository,
  TrackerStatus,
  UserDocument,
  UserDto,
  WALLET_SERVICE,
} from '@app/common';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateTaskDto, ICampaignTaskItem } from './dto/task/create-task.dto';
import { MemberRepository } from './repositories/member.repository';
import { async, filter, firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePostDto } from './dto/post/create-post.dto';
import { PostRepository } from './repositories/post.repository';
import { UpdatePostDto } from './dto/post/update-post.dto';
import { TaskRepository } from './repositories/task.repository';
import { UpdateTaskDto } from './dto/task/update-task.dto';
import { BrandDocument } from './models/brand.schema';
import { CreateDiscountDto } from './dto/discount/create-discount.dto';
import { DiscountRepository } from './repositories/discount.repository';
import { CreateGiftCardDto } from './dto/giftcard/create-giftcard.dto';
import { GiftCardRepository } from './repositories/giftcard.repository';
import { UpdateGiftCardDto } from './dto/giftcard/update-giftcard.dto';
import { UpdateDiscountDto } from './dto/discount/update-discount.dto';
import { CreateMemberShipMailDto } from './dto/membership-mail/create-membership-mail.dto';
import { MemberShipMailRepository } from './repositories/membership-mail.repository';
import { UpdateMemberShipMailDto } from './dto/membership-mail/update-membership-mail.dto';
import { CardRepository } from './repositories/card.repository';
import { query, Request } from 'express';
import { CardDto } from './dto/card/card.dto';
import { GiftUserCardDto } from './dto/giftcard/gift-user-card.dto';
import { GiftCardRepository as UserGiftCardRepository } from '@app/common';
import { DiscountRepository as UserDiscountRepository } from '@app/common';
import { GiftUserDiscountDto } from './dto/discount/gift-user-discount.dto';
import { MemberDocument } from './models/member.schema';
import { v4 as uuidv4 } from 'uuid';
import { SubTaskTrackerRepository } from '@app/common/database/repositorys/sub-task-tracker.repository';
import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { ITask } from 'apps/auth/src/constants/task.constant';
import { SubTaskRepository } from './repositories/sub-task.repository';
import { InjectConnection } from '@nestjs/mongoose';
import { MongooseTransaction } from '@app/common/database/mongoose-transaction';
import { WalletRepository } from 'apps/wallet/src/repositories/wallet.repository';
import { SendRewardPayload } from 'apps/wallet/src/wallet.service';
import {
  CreateNotificationPayload,
  NotificationPattern,
} from 'apps/notification/src/notification.controller';
import { WalletDocument } from 'apps/wallet/src/models/wallet.schema';

@Injectable()
export class AppService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly memberRepository: MemberRepository,
    private readonly postRepository: PostRepository,
    private readonly taskRepository: TaskRepository,
    private readonly subTaskRepository: SubTaskRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly discountRepository: DiscountRepository,
    private readonly giftcardRepository: GiftCardRepository,
    private readonly membershipMailRepository: MemberShipMailRepository,
    private readonly cardRepository: CardRepository,
    private readonly userGiftCardRepository: UserGiftCardRepository,
    private readonly userDiscountRepository: UserDiscountRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly taskCompletionRepository: TaskCompletionRepository,
    private readonly subTaskTrackerRepository: SubTaskTrackerRepository,
    private readonly industryRepository: IndustryRepository,
    @Inject(AUTH_SERVICE) private readonly authClientproxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
    @Inject(WALLET_SERVICE) private readonly walletClientproxy: ClientProxy,

    private readonly connection: MongooseTransaction,
    private readonly walletRepository: WalletRepository,
  ) {}

  async getBrand(user: UserDto) {
    return await this.brandRepository.findOne({ uuid: user.brand_uuid });
  }

  async userGetBrand(payload: { user_uuid: string; brand_uuid: string }) {
    const result = await this.brandRepository.aggregate([
      {
        $match: {
          uuid: { $eq: String(payload?.brand_uuid) },
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'uuid',
          foreignField: 'brand_uuid',
          as: 'brand_user',
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$brand_user' },
      // Lookup to know if requesting user is following the brand
      {
        $lookup: {
          from: 'memberdocuments',
          localField: 'uuid',
          foreignField: 'brand',
          pipeline: [{ $match: { member_uuid: payload?.user_uuid } }],
          as: 'followInfo',
        },
      },
      // Lookup to get followers count
      {
        $lookup: {
          from: 'memberdocuments',
          localField: 'uuid',
          foreignField: 'brand',
          pipeline: [{ $count: 'total' }],
          as: 'subscribers',
        },
      },

      // lookup to get five followers only
      {
        $lookup: {
          from: 'memberdocuments',
          localField: 'uuid',
          foreignField: 'brand',
          pipeline: [{ $limit: 5 }],
          as: 'lastFiveMembers',
        },
      },
      // Populate members documents with real user document
      {
        $lookup: {
          from: 'userdocuments',
          let: { userId: '$lastFiveMembers.member_uuid' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$uuid', '$$userId'] },
              },
            },
            {
              $project: {
                avatar: 1,
                firstname: 1,
                lastname: 1,
                username: 1,
              },
            },
          ],
          as: 'fiveMembers',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$$ROOT', '$brand_user'],
          },
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $cond: {
              if: {
                $eq: [{ $size: '$subscribers' }, 0],
              },
              then: 0,
              else: { $arrayElemAt: ['$subscribers.total', 0] },
            },
          },
        },
      },

      {
        $project: {
          brand_name: 1,
          username: 1,
          avatar: 1,
          bio: 1,
          isSubscribed: {
            $gt: [{ $size: '$followInfo' }, 0],
          },
          fiveMembers: 1,
          subscribersCount: 1,

          uuid: 1,
        },
      },
    ]);

    return result?.data[0] || null;
  }

  async createBrand(payload: any) {
    const brand = await this.brandRepository.create({ ...payload });
    return { ...brand };
  }

  async updatebrand(user: UserDto, input: UpdateBrandDto) {
    try {
      if (input.username) {
        await firstValueFrom(
          this.authClientproxy.send('update_username', {
            username: input.username,
            _id: user._id,
          }),
        );
      }
      const industry = input.industry;

      if (industry) {
        await this.industryRepository.findOne({
          name: caseInsensitiveRegex(industry),
        });
        return await this.brandRepository.findOneAndUpdate(
          { uuid: user.brand_uuid },
          { ...input, industry: industry.toLowerCase() },
        );
      }
    } catch (err) {
      throw new HttpException('Industry not found', HttpStatus.NOT_FOUND);
    }
  }

  async createPost(createPostDto: CreatePostDto, user: UserDto) {
    try {
      if (createPostDto?.media) {
        const cloudinary = await this.cloudinaryService.uploadFile(
          createPostDto.media,
          'posts',
        );
        createPostDto.mediaUrl = cloudinary.url;
      }
      return await this.postRepository.create({
        brand: user.brand_uuid,
        ...createPostDto,
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  async updatePost(updatePostDto: UpdatePostDto, user: UserDto) {
    try {
      if (updatePostDto?.media) {
        const cloudinary = await this.cloudinaryService.uploadFile(
          updatePostDto.media,
          'posts',
        );
        updatePostDto.mediaUrl = cloudinary.url;
      }
      return await this.postRepository.findOneAndUpdate(
        {
          uuid: updatePostDto.post_uuid,
          brand: user.brand_uuid,
        },
        { ...updatePostDto },
      );
    } catch (err) {
      throw new Error(err);
    }
  }

  async deletePost(uuid: string, user: UserDto) {
    try {
      await this.postRepository.findOneAndDelete({
        uuid,
        brand: user.brand_uuid,
      });

      return {
        status: true,
        message: 'Post deleted successfully',
      };
    } catch (err) {
      throw new Error(`Unable to dlete post, ${err}`);
    }
  }

  async getPosts(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type.`);
    }
    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };

    const first: number = payload.first ?? 20;

    const page: number = payload.page ?? 1;

    const posts = await this.postRepository.getPaginatedDocuments(
      first,
      page,
      {
        brand: user.brand_uuid,
      },
      null,
      populate,
    );
    return { ...posts };
  }

  async getBrandMembers(user: UserDto, payload: { [key: string]: any }) {
    if (user.account_type === AccountType.user) {
      throw new BadRequestException(`Action not allowed on this account type`);
    }
    const searchQuery: string = payload?.searchQuery || '';

    const first: number = payload.first ?? 20;

    const page: number = payload.page ?? 1;

    const { brand_uuid } = user;

    let match = {};

    if (searchQuery) {
      const nameSplit = searchQuery?.split(' ');

      const name1 = nameSplit[0] || '';

      const name2 = nameSplit[1] || '';
      match = {
        $or: [
          { firstname: partialMatchInsensitiveRegex(searchQuery) },
          { lastname: partialMatchInsensitiveRegex(searchQuery) },
          { username: partialMatchInsensitiveRegex(searchQuery) },
          {
            $or: [
              {
                firstname: partialMatchInsensitiveRegex(name1),
                lastname: partialMatchInsensitiveRegex(name2),
              },
              {
                lastname: partialMatchInsensitiveRegex(name1),
                firstname: partialMatchInsensitiveRegex(name2),
              },
            ],
          },
        ],
      };
    }

    try {
      const result = await this.memberRepository.aggregate([
        {
          $match: {
            brand: brand_uuid,
          },
        },
        {
          $lookup: {
            from: 'userdocuments',
            localField: 'member_uuid',
            foreignField: 'uuid',
            as: 'user',
            pipeline: [
              { $match: match },
              {
                $project: {
                  avatar: 1,
                  uuid: 1,
                  firstname: 1,
                  lastname: 1,
                  username: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: '$user',
        },
        {
          $lookup: {
            from: 'taskdocuments',
            localField: 'brand',
            foreignField: 'brand',
            as: 'completedTasks',
            let: {
              user: '$user',
            },
            pipeline: [
              {
                $lookup: {
                  from: 'subtaskdocuments',
                  localField: 'brand',
                  foreignField: 'brand_uuid',
                  as: 'campaignTasks',
                },
              },
              {
                $addFields: {
                  totalTasks: {
                    $size: '$campaignTasks',
                  },
                },
              },

              {
                $project: {
                  totalTasks: 1,
                  uuid: 1,
                },
              },
              {
                $lookup: {
                  from: 'subtasktrackerdocuments',
                  foreignField: 'campaign_uuid',
                  localField: 'uuid',
                  as: 'completedSubtasks',
                  pipeline: [
                    {
                      $match: {
                        submissionStatus: 'approved' as SubmissionStatus,
                        $expr: { $eq: ['$$user.uuid', '$user_uuid'] },
                      },
                    },
                  ],
                },
              },
              {
                $project: {
                  isCompleted: {
                    $cond: {
                      if: {
                        $eq: [{ $size: '$completedSubtasks' }, '$totalTasks'],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
              {
                $match: {
                  isCompleted: true,
                },
              },
            ],
          },
        },

        {
          $project: {
            // completedTasks: 1,
            completedTasks: { $size: '$completedTasks' },
            avatar: '$user.avatar',
            uuid: '$user.uuid',
            firstname: '$user.firstname',
            lastname: '$user.lastname',
            username: '$user.username',
          },
        },
        ...aggregationPaginationHelper({ first, page }),
      ]);

      return result?.data[0] || noDataDefault;
    } catch (err) {
      console.log(err);
    }
  }

  async getBrandMember({
    member_uuid,
    user,
  }: {
    member_uuid: string;
    user: UserDocument;
  }) {
    const result = await this.memberRepository.aggregate([
      {
        $match: {
          member_uuid,
          brand: user?.brand_uuid,
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'member_uuid',
          foreignField: 'uuid',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          firstname: '$user.firstname',
          lastname: '$user.lastname',
          avatar: '$user.avatar',
          username: '$user.username',
          uuid: '$user.uuid',
        },
      },
    ]);
    return result?.data[0] || null;
  }

  private addUuidsToTasks(taskType: ICampaignTaskItem[]): ICampaignTaskItem[] {
    return taskType.map((category) => ({
      ...category,
      tasks: category.tasks.map((task) => ({
        ...task,
        id: uuidv4(),
      })),
    }));
  }

  async createBrandTask(user: UserDto, input: CreateTaskDto) {
    // check if the account accessing this endpoint is a brand
    if (user.account_type === 'user')
      throw new BadRequestException(`Action not allowed on this account type`);

    // send the request to wallet service to confirm the wallet balance.
    const wallet: WalletDocument = await firstValueFrom(
      this.walletClientproxy.send('get_wallet', { uuid: user.wallet_uuid }),
    );

    if (!input?.reward_type?.code)
      throw new BadRequestException('Reward type code is required');

    // check if the wallet balance is less than the campaign amount
    const requiredAmount =
      Number(input.campaign_amount) + Number(input.campaign_amount) * 0.1;

    console.log(wallet, 'Wallet', requiredAmount);

    const { task_type, ...inputFields } = input;

    const tasks = task_type
      ?.map((t) =>
        t.tasks?.map((t_) => ({
          ...t_,
          categoryName: t?.categoryName,
          categoryId: t?.categoryId,

          // reward_amount: 10,
        })),
      )
      ?.flat();

    const totalAmountOnTasks = tasks?.reduce(
      (acc, curr) => acc + Number(curr?.reward_amount),
      0,
    );

    if (totalAmountOnTasks > requiredAmount)
      throw new BadRequestException(
        `The cummulative amount to be earned on all tasks (${totalAmountOnTasks}) is greater than the campaign funded amount ${requiredAmount}.
         Please set the campaign amount to a greater amount`,
      );

    const walletBalance = wallet?.balances?.find(
      (b) => b?.code === input?.reward_type?.code,
    );

    if (walletBalance?.amount < requiredAmount) {
      throw new BadRequestException(
        `Your ${walletBalance?.name} balance is too low to create this campaign`,
      );
    }

    // get the brand uding the brand uuid attacted to thee user
    const brand = await this.brandRepository.findOne({ uuid: user.brand_uuid });

    //check if the task type is provided
    if (input?.task_type?.length <= 0)
      throw new BadRequestException(`Task type is required..`);

    // check if campaign type is private and selected members is not provided
    const isPrivate: boolean = input?.campaign_type === 'private';

    const errorMessage = `Selected members are required for private engagement type`;

    if (isPrivate && input?.selected_members?.length <= 0)
      throw new BadRequestException(errorMessage);

    // check if the location is provided
    if (input?.locations?.length <= 0)
      throw new BadRequestException(`Location is required..`);

    // Transform the task_type to include UUIDs
    const taskTypeWithUuids = this.addUuidsToTasks(input.task_type);

    try {
      await this.connection.transaction(async (session) => {
        console.log(inputFields);

        const task = await this.taskRepository.create(
          {
            brand: user.brand_uuid,
            ...inputFields,
            industry: brand.industry,
            status: false,
          },
          { saveOptions: { session } },
        );

        await this.walletRepository.findOneAndUpdate(
          {
            uuid: user?.wallet_uuid,
            'balances.code': input?.reward_type?.code,
          },
          {
            $inc: {
              'balances.$.amount': -Number(input?.campaign_amount),
            },
            $set: { 'balances.$.updated_at': new Date().toISOString() },
          },
          { queryOptions: { session } },
        );

        await this.taskRepository.findOneAndUpdate(
          { _id: task._id },
          { status: true },
          { queryOptions: { session } },
        );

        await this.subTaskRepository.insertMany(
          tasks?.map((t) => ({
            ...t,
            campaign_uuid: task?.uuid,
            brand_uuid: task?.brand,
          })),
          {
            insertManyOptions: { session },
          },
        );

        this.walletClientproxy.emit('create_campaign', {
          uuid: wallet?.uuid,
          amount: Number(input?.campaign_amount),
        });

        return task;
      });
    } catch (err) {
      console.log(err, 'THER ERORR');
      throw new BadRequestException(err?.message || 'An error occured');
    }

    // try {

    // } catch (err) {
    //   throw new BadRequestException(err);
    // }
  }

  async updateBrandTask(user: UserDto, input: UpdateTaskDto) {
    // check if the account accessing this endpoint is a brand
    if (user.account_type === 'user')
      throw new BadRequestException(`Action not allowed on this account type`);

    //check if the task type is provided
    if (input.task_type && input.task_type.length <= 0)
      throw new BadRequestException(`Task type is required..`);

    //check if the campaign amount is provided
    if (!input.campaign_amount) {
      // send the request to wallet service to confirm the wallet balance.
      const wallet = await firstValueFrom(
        this.walletClientproxy.send('get_wallet', { uuid: user.wallet_uuid }),
      );

      // check if the wallet balance is less than the campaign amount
      const requiredAmount = input.campaign_amount * 0.1;
      const errorMessage = `Insufficient balance: required amount ${requiredAmount}`;
      if (parseFloat(wallet.balance) <= input.campaign_amount * 0.1)
        throw new BadRequestException(errorMessage);
    }

    const task = await this.taskRepository.findOne({ uuid: input.task_uuid });

    const campaign_amount = input.campaign_amount;
    input.campaign_amount = campaign_amount + task.campaign_amount;

    return await this.taskRepository.findOneAndUpdate(
      {
        uuid: input.task_uuid,
        brand: user.brand_uuid,
        status: true,
      },
      { ...input },
    );
  }

  private async validateMemberSubscription(member_uuid: string, brand: string) {
    try {
      await this.memberRepository.findOne({ member_uuid, brand });
    } catch (err) {
      return;
    }
    throw new UnprocessableEntityException('Member already exist.');
  }

  async addMemberToBrands(payload: { [key: string]: string | [string] }) {
    for (const brand_uuid of payload.brand_uuids) {
      const member_uuid = payload.user_uuid as string;

      //check if the member is already subscribed to the brand
      await this.validateMemberSubscription(member_uuid, brand_uuid);

      //create the member subscription record
      await this.memberRepository.create({
        brand: brand_uuid,
        member_uuid: payload.user_uuid as string,
      });

      try {
        //get the membership mail template if it exists
        const memberShip = await this.membershipMailRepository.findOne({
          brand: brand_uuid,
        });

        //send the membership mail to the user
        this.notificationClientProxy.emit('membership_mail', {
          title: memberShip.title,
          body: memberShip.body,
          type: 'membership-mail',
          to: payload.user_uuid as string,
          from: { isbrand: true, sender: brand_uuid },
        });
      } catch (e) {
        console.log('No membership email found');
      }
    }
  }

  async addMemberToBrand(payload: { [key: string]: string }) {
    const member_uuid: string = payload.member_uuid;
    const brand: string = payload.brand_uuid;
    let result: MemberDocument;

    //check if the member is already subscribed to the brand
    await this.validateMemberSubscription(member_uuid, brand);

    try {
      //get the membership mail template if it exists
      const memberShip = await this.membershipMailRepository.findOne({ brand });

      //send the membership mail to the user
      this.notificationClientProxy.emit('membership_mail', {
        title: memberShip.title,
        body: memberShip.body,
        type: 'membership-mail',
        to: member_uuid,
        from: { isbrand: true, sender: brand },
      });
    } catch (e) {
      console.log('No membership email found');
    }

    //create the member subscription record
    return await this.memberRepository.create({ member_uuid, brand });
  }

  async removeMemberFromBrand(payload: { [key: string]: string }) {
    try {
      await this.memberRepository.findOneAndDelete({
        member_uuid: payload?.member_uuid,
        brand: payload?.brand_uuid,
      });
      const uuid = payload.brand_uuid;
      const brand = await this.brandRepository.findOne({ uuid });
      return { status: true, message: `Unsubscribed from ${brand.brand_name}` };
    } catch (err) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
  }

  async getDiscounts(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }
    const first: number = payload.first;
    const page: number = payload.page;
    return await this.discountRepository.getPaginatedDocuments(first, page, {
      brand: user.brand_uuid,
    });
  }

  async getGiftCards(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }
    const first: number = payload.first;
    const page: number = payload.page;
    return await this.giftcardRepository.getPaginatedDocuments(first, page, {
      brand: user.brand_uuid,
    });
  }

  async getBrandTasks(user: UserDocument, payload: { [key: string]: number }) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    const first: number = payload.first ?? 20;

    const page: number = payload.page ?? 1;

    const result = await this.taskRepository.aggregate([
      {
        $match: {
          brand: user?.brand_uuid,
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'engagements',
          pipeline: [
            {
              $match: {
                status: 'submitted',
              },
            },
            {
              $sort: {
                created_at: -1,
              },
            },
            {
              $group: {
                _id: '$user_uuid',
                doc: { $first: '$$ROOT' },
              },
            },
            {
              $replaceRoot: {
                newRoot: '$doc',
              },
            },
          ],
        },
      },
      ...getTasksAndTotalTasksAmount,
      {
        $addFields: {
          totalEngagements: {
            $size: '$engagements',
          },
          lastFiveEngagements: { $slice: ['$engagements', 0, 4] },
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'lastFiveEngagements.user_uuid',
          foreignField: 'uuid',
          as: 'lastFiveEngagements',
          pipeline: [
            {
              $project: {
                firstname: 1,
                lastname: 1,
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'submissionsPendingReview',
          pipeline: [
            {
              $match: {
                status: 'submitted',
                submissionStatus: 'pending' as SubmissionStatus,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'submissionsApproved',
          pipeline: [
            {
              $match: {
                status: 'submitted',
                submissionStatus: 'approved' as SubmissionStatus,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'submissionsRejected',
          pipeline: [
            {
              $match: {
                status: 'submitted',
                submissionStatus: 'rejected' as SubmissionStatus,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          lastFiveEngagements: '$lastFiveEngagements',
          submissionsPendingReview: {
            $size: '$submissionsPendingReview',
          },
          submissionsApproved: {
            $size: '$submissionsApproved',
          },
          submissionsRejected: {
            $size: '$submissionsRejected',
          },
        },
      },
      { $unset: 'engagements' },
      ...aggregationPaginationHelper({ first, page }),
    ]);

    return result?.data[0] || noDataDefault;
  }

  async getBrandTask(user: UserDocument, task_uuid: string) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    const result = await this.taskRepository.aggregate([
      {
        $match: {
          brand: user?.brand_uuid,
          uuid: task_uuid,
        },
      },
      ...getTasksAndTotalTasksAmount,
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'submissionsPendingReview',
          pipeline: [
            {
              $match: {
                status: 'submitted',
                submissionStatus: 'pending' as SubmissionStatus,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'submissionsApproved',
          pipeline: [
            {
              $match: {
                status: 'submitted',
                submissionStatus: 'approved' as SubmissionStatus,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'submissionsRejected',
          pipeline: [
            {
              $match: {
                status: 'submitted',
                submissionStatus: 'rejected' as SubmissionStatus,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',

          localField: 'uuid',
          foreignField: 'campaign_uuid',
          pipeline: [
            {
              $match: {
                status: 'submitted' as TrackerStatus,
              },
            },
          ],

          as: 'task_completion',
        },
      },
      {
        $addFields: {
          submissionsPendingReview: {
            $size: '$submissionsPendingReview',
          },
          submissionsApproved: {
            $size: '$submissionsApproved',
          },
          submissionsRejected: {
            $size: '$submissionsRejected',
          },
          tasks: {
            $map: {
              input: '$tasks',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    trackers: {
                      $filter: {
                        input: '$task_completion',
                        cond: {
                          $eq: ['$$this.sub_task_id', '$$item.uuid'],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    return result?.data[0] || null;
  }

  async getSubmissions({
    user,
    status,
    campaign_uuid,
    task_id,
    first,
    page,
  }: {
    user: UserDocument;
    status: string;
    campaign_uuid: string;
    page: number | string;
    first: number | string;
    task_id: string;
  }) {
    const statuses = status?.split(',');

    if (user?.account_type !== AccountType.business)
      throw new ForbiddenException('Not authorized to access this resource');

    const result = await this.subTaskTrackerRepository.aggregate([
      {
        $match: {
          status: 'submitted',
          campaign_uuid,
          sub_task_id: task_id,
          submissionStatus: {
            $in: statuses,
          },
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'user_uuid',
          foreignField: 'uuid',
          as: 'userDetails',
          pipeline: [
            {
              $project: {
                avatar: 1,
                firstname: 1,
                lastname: 1,
                uuid: 1,
                username: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$userDetails' },

      {
        $addFields: {
          userDetails: '$userDetails',
        },
      },
      ...aggregationPaginationHelper({ first, page }),
    ]);

    return result?.data[0] || noDataDefault;
  }

  async getSubmission({
    campaign_uuid,
    task_id,
    user_uuid,
  }: {
    campaign_uuid: string;
    task_id: string;
    user_uuid: string;
  }) {
    const result = await this.submissionRepository.aggregate([
      {
        $match: {
          campaign_uuid,
          sub_task_uuid: task_id,
          user_uuid,
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'sub_task_uuid',
          foreignField: 'sub_task_id',
          as: 'tracker',
          pipeline: [
            {
              $match: {
                user_uuid,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'user_uuid',
          foreignField: 'uuid',
          as: 'userDetails',
          pipeline: [
            {
              $project: {
                uuid: 1,
                avatar: 1,
                username: 1,
                firstname: 1,
                lastname: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'subtaskdocuments',
          localField: 'sub_task_uuid',
          foreignField: 'uuid',
          as: 'taskDetails',
        },
      },
      { $unwind: '$tracker' },
      { $unwind: '$userDetails' },
      { $unwind: '$taskDetails' },
      {
        $addFields: {
          tracker: '$tracker',
          userDetails: '$userDetails',
          taskDetails: '$taskDetails',
        },
      },
    ]);

    return result?.data[0] || null;
  }

  async getPostsFromBrands(payload: { [key: string]: any }) {
    const limit: number = parseInt(payload.first) || 20;

    const page: number = parseInt(payload.page) || 1;

    const skip = page * limit;

    const user: UserDocument = payload.user as UserDocument;

    const member_uuid: string = user.uuid;
    let getSubcribedBrandUuids: string[] = [];
    let subscribedBrands: MemberDocument[] = [];

    subscribedBrands = await this.memberRepository.find({ member_uuid });
    getSubcribedBrandUuids = subscribedBrands.map((b) => b.uuid);

    const countFilter = {
      $or: [
        { brand: { $in: getSubcribedBrandUuids } },
        // { brand: { $nin: getSubcribedBrandUuids } },
      ],
    };

    const aggregationPipeline: any[] = [
      {
        $match: countFilter,
      },
      {
        $addFields: {
          priority: {
            $cond: [{ $in: ['$brand', getSubcribedBrandUuids] }, 1, 2],
          },
        },
      },
      {
        $sort: {
          priority: 1,
          createdAt: -1,
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const result = await this.postRepository.aggregate(
      aggregationPipeline,
      null,
      countFilter,
    );

    const totalPostsCount = <number>result.count;
    const totalPages = Math.ceil(totalPostsCount / limit);
    const hasMorePages = page < totalPages;

    return { totalPages, hasMorePages, data: result.data };
  }

  async getRecommendedChannels(payload: Record<string, any>) {
    const first: number = <number>payload.first ?? 20;

    const page: number = <number>payload.page ?? 1;

    const user: UserDocument = payload?.user;

    const result = await this.brandRepository.aggregate([
      {
        $match: {
          industry: {
            $in: user?.industries?.map((i) => caseInsensitiveRegex(i)),
          },
        },
      },

      {
        $lookup: {
          from: 'memberdocuments',
          localField: 'uuid',
          foreignField: 'brand',
          as: 'user_member',
          pipeline: [
            {
              $match: {
                member_uuid: user?.uuid,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          isFollowing: {
            $gt: [{ $size: '$user_member' }, 0],
          },
        },
      },
      { $match: { isFollowing: false } },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'uuid',
          foreignField: 'brand_uuid',
          as: 'brand_user_details',
        },
      },
      {
        $lookup: {
          from: 'memberdocuments',
          localField: 'uuid',
          foreignField: 'brand',
          as: 'followers',
          pipeline: [{ $count: 'total' }],
        },
      },
      { $unwind: { preserveNullAndEmptyArrays: true, path: '$followers' } },
      { $unwind: '$brand_user_details' },

      {
        $addFields: {
          subscribersCount: '$followers.total',
          avatar: '$brand_user_details.avatar',
          username: '$brand_user_details.username',
        },
      },
      {
        $project: {
          subscribersCount: { $ifNull: ['$subscribersCount', 0] },
          bio: 1,
          brand_name: 1,
          uuid: 1,
          isFollowing: 1,
          avatar: 1,
          username: 1,
        },
      },
      ...aggregationPaginationHelper({ first, page }),
    ]);

    return result?.data[0] || noDataDefault;
  }

  async getChannels(payload: { [key: string]: number | string }) {
    const page: number = <number>payload.page;

    const first: number = <number>payload.first;

    const skip = page * first;

    const user_uuid: string = <string>payload.user_uuid;

    console.log(skip, first, page, 'PAGINATION');

    const result = await this.brandRepository.aggregate([
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'uuid',
          foreignField: 'brand_uuid',
          as: 'brand_user_details',
        },
      },
      {
        $lookup: {
          from: 'memberdocuments',

          localField: 'uuid',
          foreignField: 'brand',

          as: 'followInfo',
        },
      },
      { $unwind: '$brand_user_details' },
      {
        $addFields: {
          avatar: '$brand_user_details.avatar',
          username: '$brand_user_details.username',
          subscribersCount: { $size: '$followInfo' },
          isSubscribed: {
            $in: [user_uuid, '$followInfo.member_uuid'],
          },
          lastFiveMembers: { $slice: ['$followInfo', 0, 4] },
        },
      },

      {
        $lookup: {
          from: 'userdocuments',
          let: { userId: '$lastFiveMembers.member_uuid' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$uuid', '$$userId'] },
              },
            },
            {
              $project: {
                avatar: 1,
                firstname: 1,
                lastname: 1,
                username: 1,
              },
            },
          ],
          as: 'fiveMembers',
        },
      },

      {
        $project: {
          brand_name: 1,
          uuid: 1,
          avatar: 1,
          username: 1,
          fiveMembers: 1,
          subscribersCount: 1,
          isSubscribed: 1,
        },
      },
      ...aggregationPaginationHelper({ first, page }),
    ]);

    return result?.data[0] || noDataDefault;
  }

  async getTasksFromBrands(payload: { [key: string]: any }) {
    const first: number = <number>payload.first;

    const page: number = <number>payload.page;

    const filter: string = <string>payload.filter;

    const status: 'in-progress' | 'completed' = payload?.status;

    let brand_uuid: string = payload?.brand_uuid;

    let memberState: string = '';
    let memberCountry: string = '';
    let memberInds = [];

    const member: UserDocument = <UserDocument>payload.user;
    const member_uuid: string = member.uuid;

    if (member) {
      memberState = member?.state?.toLowerCase();
      memberCountry = member?.country?.toLowerCase();
      memberInds = member?.industries.map((e) => e.toLowerCase());
    }

    /* get channel/brands users are subscribed to and also brands they are not subscribed to */
    const subscribeBrands = await this.memberRepository.find({ member_uuid });

    const subscribeBrandsUuids = subscribeBrands.map((member) => member.brand);

    let match = [
      {
        $or: [
          { campaign_type: { $ne: 'private' } },
          {
            selected_members: { $in: [member_uuid] },
            campaign_type: 'private',
          },
        ],
      },
      {
        $or: [
          // Include campaigns where location is not defined
          { locations: { $size: 0 } },
          { locations: { $exists: false } },
          {
            locations: {
              $elemMatch: {
                country: caseInsensitiveRegex(memberCountry),
                $or: [
                  {
                    states: {
                      $in: [caseInsensitiveRegex(memberState)],
                    },
                  },
                  { states: { $exists: false } },
                  { states: { $size: 0 } }, // Empty states array means all states allowed
                ],
              },
            },
          },
        ],
      },
      {
        $or: [
          {
            industry: {
              $in: memberInds?.map((e) => caseInsensitiveRegex(e)),
            },
          },
          { industry: null },
          { industry: { $size: 0 } },
          { industry: { $exists: false } }, // Include tasks with no industry specified
          { brand: { $in: subscribeBrandsUuids } },
        ],
      },
      {
        $or: [
          { campaign_end_date: { $gte: new Date() } },
          { campaign_end_date: { $exists: false } },
          { campaign_end_date: null },
        ],
      },
    ] as FilterQuery<any>[];

    const publicCampaignFilter = {
      $or: [{ campaign_type: 'public' }],
    };

    const privateCampaignFilter = {
      $or: [
        {
          campaign_type: 'private',
          selected_members: { $in: [member_uuid] },
        },
      ],
    };

    const membersCampaignFilter = {
      $or: [{ brand: { $in: subscribeBrandsUuids }, campaign_type: 'members' }],
    };

    switch (filter) {
      case 'public':
        {
          match.push(publicCampaignFilter);
        }
        break;
      case 'private': {
        match.push(privateCampaignFilter);
        break;
      }
      case 'members': {
        match.push(membersCampaignFilter);
      }
      default: {
        match.push({
          $or: [
            publicCampaignFilter,
            privateCampaignFilter,
            membersCampaignFilter,
          ],
        });
      }
    }

    let statusFilter = {};

    switch (status) {
      case 'in-progress': {
        statusFilter = {
          $or: [
            {
              task_completion: {
                $elemMatch: {
                  status: 'started',
                },
              },
            },
            {
              $and: [
                {
                  $expr: {
                    $lt: ['$task_tracker_length', '$totalTasks'],
                  },
                },
                {
                  task_completion: {
                    $elemMatch: {
                      status: 'submitted',
                    },
                  },
                },
              ],
            },
          ],
        };
        break;
      }
      case 'completed': {
      }
      default: {
      }
    }

    let brandMatch = {};

    if (brand_uuid) {
      brandMatch = { brand: brand_uuid };
    }

    console.log(statusFilter, status);
    const result = await this.taskRepository.aggregate([
      {
        $match: {
          ...brandMatch,
          $and: match,
        },
      },
      {
        $lookup: {
          as: 'brand',
          from: 'branddocuments',
          localField: 'brand',
          foreignField: 'uuid',
        },
      },
      { $unwind: '$brand' },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          let: {
            request_user_id: member?.uuid,
          },
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          pipeline: [{ $match: { user_uuid: member?.uuid } }],

          as: 'task_completion',
        },
      },
      ...getTasksAndTotalTasksAmount,
      {
        $lookup: {
          from: 'userdocuments',
          foreignField: 'brand_uuid',
          localField: 'brand.uuid',
          as: 'brand_user',
        },
      },
      { $unwind: '$brand_user' },
      {
        $addFields: {
          totalTasks: {
            $size: '$tasks',
          },
          task_tracker_length: {
            $size: '$task_completion',
          },
        },
      },
      { $match: statusFilter },
      {
        $lookup: {
          from: 'memberdocuments',

          localField: 'brand.uuid',
          foreignField: 'brand',
          pipeline: [
            {
              $match: {
                member_uuid: member?.uuid,
              },
            },
          ],
          as: 'followInfo',
        },
      },
      {
        $lookup: {
          from: 'subtasktrackerdocuments',
          localField: 'uuid',
          foreignField: 'campaign_uuid',
          as: 'engagements',
          pipeline: [
            {
              $match: {
                status: 'submitted',
              },
            },
            {
              $sort: {
                created_at: -1,
              },
            },
            {
              $group: {
                _id: '$user_uuid',
                doc: { $first: '$$ROOT' },
              },
            },
            {
              $replaceRoot: {
                newRoot: '$$ROOT.doc',
              },
            },
          ],
        },
      },

      {
        $addFields: {
          'brand.following': {
            $gt: [{ $size: '$followInfo' }, 0],
          },
          lastFiveEngagements: { $slice: ['$engagements', 0, 4] },
          totalEngagements: { $size: '$engagements' },
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'lastFiveEngagements.user_uuid',
          foreignField: 'uuid',
          as: 'lastFiveEngagements',
          pipeline: [
            {
              $project: {
                firstname: 1,
                lastname: 1,
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          totalEngagements: 1,
          lastFiveEngagements: 1,
          totalTasks: 1,
          uuid: 1,
          campaign_title: 1,
          campaign_banner_url: 1,
          total_task: 1,
          reward_type: 1,
          campaign_type: 1,
          selected_members: 1,
          campaign_end_date: 1,
          reward_per_engagement: 1,
          task_completion: 1,
          brand: {
            brand_name: '$brand.brand_name',
            uuid: '$brand.uuid',
            following: '$brand.following',
            username: '$brand_user.username',
            avatar: '$brand_user.avatar',
          },
          created_at: 1,
          total_engagement_reward: 1,
          tasks: 1,
        },
      },
      ...aggregationPaginationHelper({ first, page }),
    ]);

    return result?.data[0] || noDataDefault;
  }

  async getSubTaskFromBrand(sub_task_uuid: string) {
    const task = await this.subTaskRepository.findOne({ uuid: sub_task_uuid });

    return task;
  }

  async getTaskFromBrand(member: UserDocument, task_uuid: string) {
    const lookup = {
      as: 'brand',
      from: 'branddocuments',
      localField: 'brand',
      foreignField: 'uuid',
    };

    console.log(BrandDocument.name, SubTaskTrackerDocument.name);

    let memberState: string = '';
    let memberCountry: string = '';
    let memberIndustries: string[] = [];
    const member_uuid = member.uuid;

    if (member) {
      memberState = member?.state?.toLowerCase();
      memberCountry = member?.country?.toLowerCase();
      memberIndustries = member?.industries.map((e) => e.toLowerCase());
    }

    /* get channel/brands users are subscribed to and also brands they are not subscribed to */
    const subscribeBrands = await this.memberRepository.find({ member_uuid });

    const subscribeBrandsUuids = subscribeBrands.map((member) => member.brand);

    const filter = {
      uuid: task_uuid,
      $and: [
        {
          $or: [
            { campaign_type: 'public' },
            { selected_members: { $in: [member_uuid] } },
            { brand: { $in: subscribeBrandsUuids } },
          ],
        },
        {
          $or: [
            {
              industry: {
                $in: memberIndustries?.map((e) => caseInsensitiveRegex(e)),
              },
            },
            { industry: null },
            { industry: { $exists: false } }, // Include tasks with no industry specified
            { brand: { $in: subscribeBrandsUuids } },
          ],
        },

        {
          $or: [
            {
              locations: {
                $elemMatch: {
                  country: caseInsensitiveRegex(memberCountry),
                  $or: [
                    {
                      states: {
                        $in: [caseInsensitiveRegex(memberState)],
                      },
                    },
                    { states: { $size: 0 } }, // Empty states array means all states allowed
                  ],
                },
              },
            },
          ],
        },
      ],
    };

    const aggregation = await this.taskRepository.aggregate(
      [
        {
          $match: filter,
        },
        // Brand lookup
        { $lookup: lookup },
        { $unwind: '$brand' },

        // Subtask tracker lookup and join
        {
          $lookup: {
            from: 'subtasktrackerdocuments',
            let: {
              request_user_id: member?.uuid,
            },
            localField: 'uuid',
            foreignField: 'campaign_uuid',
            pipeline: [{ $match: { user_uuid: member?.uuid } }],

            as: 'task_completion',
          },
        },
        ...getTasksAndTotalTasksAmount,
        {
          $addFields: {
            totalTasks: {
              $size: '$tasks',
            },
            task_tracker_length: {
              $size: '$task_completion',
            },

            filteredTasks: {
              $filter: {
                input: '$task_completion',
                cond: { $eq: ['$$this.status', 'submitted'] },
              },
            },
          },
        },
        {
          $addFields: {
            completed_tasks_length: {
              $size: '$filteredTasks',
            },
          },
        },
        // Is following lookup
        {
          $lookup: {
            from: 'memberdocuments',

            localField: 'brand.uuid',
            foreignField: 'brand',
            pipeline: [
              {
                $match: {
                  member_uuid: member?.uuid,
                },
              },
            ],
            as: 'followInfo',
          },
        },

        {
          $lookup: {
            from: 'subtasktrackerdocuments',
            localField: 'uuid',
            foreignField: 'campaign_uuid',
            as: 'engagements',
            pipeline: [
              {
                $match: {
                  status: 'submitted',
                },
              },
              {
                $sort: {
                  created_at: -1,
                },
              },
              {
                $group: {
                  _id: '$user_uuid',
                  doc: { $first: '$$ROOT' },
                },
              },
              {
                $replaceRoot: {
                  newRoot: '$$ROOT.doc',
                },
              },
            ],
          },
        },

        {
          $lookup: {
            from: 'userdocuments',
            foreignField: 'brand_uuid',
            localField: 'brand.uuid',
            as: 'brand_user',
          },
        },
        { $unwind: '$brand_user' },
        {
          $addFields: {
            'brand.following': {
              $gt: [{ $size: '$followInfo' }, 0],
            },
            lastFiveEngagements: { $slice: ['$engagements', 0, 4] },
            totalEngagements: { $size: '$engagements' },
          },
        },
        {
          $lookup: {
            from: 'userdocuments',
            localField: 'lastFiveEngagements.user_uuid',
            foreignField: 'uuid',
            as: 'lastFiveEngagements',
            pipeline: [
              {
                $project: {
                  firstname: 1,
                  lastname: 1,
                  avatar: 1,
                  username: 1,
                },
              },
            ],
          },
        },
        {
          $project: {
            uuid: 1,
            lastFiveEngagements: 1,
            totalEngagements: 1,
            progress: {
              $multiply: [
                {
                  $divide: [
                    '$completed_tasks_length',
                    {
                      $cond: {
                        if: { $lt: ['$totalTasks', 1] },
                        then: 1,
                        else: '$totalTasks',
                      },
                    },
                  ],
                },
                100,
              ],
            },
            brand: {
              brand_name: '$brand.brand_name',
              uuid: '$brand.uuid',
              following: '$brand.following',
              username: '$brand_user.username',
              avatar: '$brand_user.avatar',
            },
            campaign_title: 1,
            campaign_banner_url: 1,
            total_task: 1,
            reward_type: 1,
            campaign_type: 1,
            selected_members: 1,
            campaign_end_date: 1,
            total_engagement_reward: 1,

            // task_completion: 1,

            tasks: {
              $map: {
                input: '$tasks',
                as: 'item',
                in: {
                  $mergeObjects: [
                    '$$item',
                    {
                      tracker: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$task_completion',
                              cond: {
                                $eq: ['$$this.sub_task_id', '$$item.uuid'],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
      // null,
      // populate,
      // projection,
    );
    return aggregation?.data[0] || null;
  }

  async createDiscount(user: UserDto, input: CreateDiscountDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }
    // get wallet balance from wallet service...
    try {
      const walletResult = await firstValueFrom(
        this.walletClientproxy.send('create_discount', {
          uuid: user.wallet_uuid,
          amount: input.discount_amount,
        }),
      );

      if (walletResult !== 'success') {
        throw new BadRequestException(walletResult);
      }

      return await this.discountRepository.create({
        ...input,
        brand: user.brand_uuid,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createGiftCard(user: UserDto, input: CreateGiftCardDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }
    // get wallet balance from wallet service...
    try {
      const walletResult = await firstValueFrom(
        this.walletClientproxy.send('create_giftcard', {
          uuid: user.wallet_uuid,
          amount: input.gift_card_amount,
        }),
      );

      if (walletResult !== 'success') {
        throw new BadRequestException(walletResult);
      }
      return await this.giftcardRepository.create({
        ...input,
        brand: user.brand_uuid,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateGiftCard(user: UserDto, updateGiftCardDto: UpdateGiftCardDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    const { gift_card_campaign_amount, ...details } = updateGiftCardDto;
    return await this.giftcardRepository.findOneAndUpdate(
      { uuid: updateGiftCardDto.gift_card_uuid, brand: user.brand_uuid },
      details,
    );
  }

  async updateDiscount(user: UserDto, input: UpdateDiscountDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }
    const { discount_amount, ...details } = input;
    return await this.discountRepository.findOneAndUpdate(
      { uuid: input.discount_uuid, brand: user.brand_uuid },
      { ...details },
    );
  }

  async createMemberShipMail(
    user: UserDocument,
    input: CreateMemberShipMailDto,
  ) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    try {
      return await this.membershipMailRepository.findOne({
        brand: user.brand_uuid,
      });
    } catch (e) {
      return await this.membershipMailRepository.create({
        ...input,
        brand: user.brand_uuid,
      });
    }
  }

  async updateMemberShipMail(user: UserDto, input: UpdateMemberShipMailDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    try {
      return await this.membershipMailRepository.findOneAndUpdate(
        { brand: user.brand_uuid },
        { ...input },
      );
    } catch (e) {
      throw new BadRequestException('This brand does not exist');
    }
  }

  async getPaymentCard(user: UserDto, req: Request) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type.`);
    }

    const first: number = Number.parseInt(`${req.query.first}`) ?? 20;
    const page: number = Number.parseInt(`${req.query.page}`) ?? 1;
    return await this.cardRepository.getPaginatedDocuments(first, page, {
      brand: user.brand_uuid,
    });
  }

  async deletePaymentCard(uuid: string, user: UserDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type.`);
    }
    try {
      await this.cardRepository.findOneAndDelete({
        uuid,
        brand: user.brand_uuid,
      });
      return { status: true, message: 'Card deleted successfully' };
    } catch (e) {
      throw new BadRequestException('Card was not found');
    }
  }

  async addCard(cardDto: CardDto, user: UserDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type.`);
    }

    return await this.cardRepository.create({
      ...cardDto,
      brand: user.brand_uuid,
    });
  }

  async createDiscountToUser(user: UserDto, input: GiftUserDiscountDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type.`);
    }
    const walletResult = await firstValueFrom(
      this.walletClientproxy.send('create_discount', {
        uuid: user.wallet_uuid,
        amount: input.discount_amount,
        receiver: input.receiver_user_uuid,
      }),
    );

    if (walletResult !== 'success') {
      throw new BadRequestException(walletResult);
    }

    await this.userDiscountRepository.create({
      ...input,
      user_uuid: input.receiver_user_uuid,
      brand_uuid: user.brand_uuid,
    });

    return {
      status: true,
      message: `Gifted ${input.receiver_user_uuid} with ${input.discount_amount} Discounts`,
    };
  }

  async createGiftCardToUser(user: UserDto, input: GiftUserCardDto) {
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type.`);
    }
    const walletResult = await firstValueFrom(
      this.walletClientproxy.send('create_giftcard', {
        uuid: user.wallet_uuid,
        amount: input.gift_card_amount,
        receiver: input.receiver_user_uuid,
      }),
    );

    if (walletResult !== 'success') {
      throw new BadRequestException(walletResult);
    }

    await this.userGiftCardRepository.create({
      ...input,
      user_uuid: input.receiver_user_uuid,
      brand_uuid: user.brand_uuid,
    });

    return {
      status: true,
      message: `Gifted ${input.receiver_user_uuid} with ${input.gift_card_amount} Gift card`,
    };
  }

  async searchFunction(input: string, user: UserDto) {
    if (user.account_type === 'user') {
      const tasks = await this.taskRepository.find({
        campaign_title: { $regex: input, $options: 'i' },
        status: true,
      });
      const brands = await this.brandRepository.find({
        brand_name: { $regex: input, $options: 'i' },
      });
      const posts = await this.postRepository.find({
        post_title: { $regex: input, $options: 'i' },
      });

      return { tasks, brands, posts };
    } else {
      const discounts = await this.discountRepository.find({
        product_name: { $regex: input, $options: 'i' },
        brand: user.brand_uuid,
      });
      const giftCards = await this.giftcardRepository.find({
        gift_card_product: { $regex: input, $options: 'i' },
        brand: user.brand_uuid,
      });
      const posts = await this.postRepository.find({
        post_title: { $regex: input, $options: 'i' },
        brand: user.brand_uuid,
      });
      const members = await this.memberRepository.find({
        brand: user.brand_uuid,
      });

      const member_uuids: string[] = members.map((m) => m.member_uuid);

      const tasks = await this.taskRepository.find({
        campaign_title: { $regex: input, $options: 'i' },
        brand: user.brand_uuid,
        status: true,
      });

      return { tasks, discounts, giftCards, posts, member_uuids };
    }
  }

  async getTask(uuid: string) {
    try {
      const task = await this.taskRepository.findOne({ uuid, status: true });
      return task;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async updateTaskReview(payload: Record<string, any>) {
    const { task_uuid, user_uuid } = payload;

    const task = await this.taskRepository.findOne({
      uuid: task_uuid,
      status: false,
    });
    let campaign_engagement: number = task.campaign_engagement;
    if (!task.members_review.includes(user_uuid)) {
      const members_review = task.members_review;
      members_review.push(user_uuid);
      campaign_engagement = campaign_engagement + 1;
      await this.taskRepository.findOneAndUpdate(
        { uuid: task_uuid },
        { members_review, campaign_engagement },
      );
    }
  }

  async approveSubmission(
    user: UserDocument,
    input: { submission_uuid: string },
  ) {
    if (user.account_type === 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const Submission = await this.submissionRepository.findOne({
      uuid: input?.submission_uuid,
    });

    const SubTask = await this.subTaskRepository.findOne({
      uuid: Submission?.sub_task_uuid,
    });

    const Campaign = await this.taskRepository.findOne({
      uuid: SubTask?.campaign_uuid,
    });

    const Tracker = await this.subTaskTrackerRepository.findOne({
      campaign_uuid: SubTask.campaign_uuid,
      sub_task_id: SubTask?.uuid,
      user_uuid: Submission?.user_uuid,
    });

    const available_campaign_amount = Number(Campaign?.campaign_amount);

    const amount_to_earn_on_task = Number(SubTask?.reward_amount);

    console.log(Tracker.submissionStatus, Tracker);
    if (Tracker?.submissionStatus !== 'pending')
      throw new BadRequestException(
        'This submission has been previously reviewed',
      );

    if (amount_to_earn_on_task > available_campaign_amount)
      throw new BadRequestException(
        'Reward amount on this task exceeds the available campaign balance, please fund the campaign to continue',
      );

    // Logic to debit campaign and fund user wallet or revert if any error is encountered.

    try {
      await this.connection.transaction(async (session) => {
        const memberDetails: UserDocument = await firstValueFrom(
          this.authClientproxy.send('get_user', { uuid: Tracker?.user_uuid }),
        );

        // Debit the amount from the campaign
        await this.taskRepository.findOneAndUpdate(
          { uuid: Campaign?.uuid },
          {
            $inc: {
              campaign_amount: -amount_to_earn_on_task,
            },
          },
          { queryOptions: { session } },
        );

        // Credit the user wallet
        await this.walletRepository.findOneAndUpdate(
          {
            uuid: memberDetails?.wallet_uuid,
            'balances.code': Campaign?.reward_type?.code,
          },
          {
            $inc: {
              'balances.$.amount': amount_to_earn_on_task,
            },
            $set: { 'balances.$.updated_at': new Date().toISOString() },
          },
          { queryOptions: { session } },
        );

        await this.subTaskTrackerRepository.findOneAndUpdate(
          { uuid: Tracker?.uuid, _id: Tracker?._id },
          {
            submissionStatus: 'approved' as SubmissionStatus,
            reviewed_at: new Date().toISOString(),
          },
          { queryOptions: { session } },
        );

        this.walletClientproxy.emit('send_award', {
          amount: amount_to_earn_on_task,
          receiver: Tracker?.user_uuid,
          task: Campaign,
          sub_task: SubTask,
        } as SendRewardPayload);
      });
    } catch (err) {
      throw new BadRequestException(err);
    }
    // const { task_uuid, member_uuid, is_approved, reason } = input;

    // const task = await this.taskRepository.findOne({
    //   uuid: task_uuid,
    //   brand: user.brand_uuid,
    //   members_review: { $in: [member_uuid] },
    //   status: true,
    // });
    // if (is_approved) {
    //   let members_review: string[] = task.members_review;
    //   const members_completed = task.members_completed;
    //   if (members_review.includes(member_uuid)) {
    //     members_review = members_review.filter((m) => member_uuid !== m);
    //   }
    //   if (!members_completed.includes(member_uuid)) {
    //     members_completed.push(member_uuid);
    //   }
    //   await this.taskRepository.findOneAndUpdate(
    //     { uuid: task_uuid, status: true },
    //     { members_review, members_completed },
    //   );

    //   //send the reward to the user's wallet
    //   const memberDetails = await firstValueFrom(
    //     this.authClientproxy.send('get_user', { uuid: member_uuid }),
    //   );
    //   let newcampaignAmount = task.campaign_amount;

    //   //check if user is a member of this brand
    //   const rewardPerEngagement: string = task.reward_per_engagement;
    //   let rewardPrice: number = 0;
    //   //check if task contains membership or non membership rewards.

    //   newcampaignAmount = newcampaignAmount - Number(rewardPerEngagement);
    //   rewardPrice = Number.parseInt(rewardPerEngagement);

    //   //senf the reward to the member wallet
    //   this.walletClientproxy.emit('send_award', {
    //     amount: rewardPrice,
    //     reward_type: task.reward_type,
    //     wallet_uuid: memberDetails.wallet_uuid,
    //     receiver: member_uuid,
    //     task: task,
    //   });

    //   // update the task with the new campaign amount balance amount
    //   await this.taskRepository.findOneAndUpdate(
    //     { _id: task._id, status: true },
    //     { campaign_amount: newcampaignAmount },
    //   );
    // } else {
    //   let members_review: string[] = task.members_review;
    //   if (members_review.includes(member_uuid)) {
    //     members_review = members_review.filter((m) => member_uuid !== m);
    //   }

    //   await this.taskRepository.findOneAndUpdate(
    //     { uuid: task_uuid, status: true },
    //     { members_review },
    //   );

    //   const payload = {
    //     to: member_uuid,
    //     from: { isBrand: true, sender: task.brand },
    //     title: `${task.campaign_title} Task Submission was rejected`,
    //     type: 'task',
    //     body: reason,
    //     metadata: {},
    //   };
    //   this.notificationClientProxy.emit('create_notification', { ...payload });
    // }
    // return this.taskRepository.findOne({ uuid: task_uuid, status: true });
  }

  async rejectSubmission(
    user: UserDocument,
    payload: { submission_uuid: string; rejectionReason: string },
  ) {
    if (user?.account_type !== AccountType.business)
      throw new ForbiddenException('Not allowed');

    const Submission = await this.submissionRepository.findOne({
      uuid: payload?.submission_uuid,
    });

    const SubTask = await this.subTaskRepository.findOne({
      uuid: Submission?.sub_task_uuid,
    });

    const Tracker = await this.subTaskTrackerRepository.findOne({
      campaign_uuid: SubTask.campaign_uuid,
      sub_task_id: SubTask?.uuid,
      user_uuid: Submission?.user_uuid,
    });

    if (Tracker?.submissionStatus !== 'pending')
      throw new BadRequestException(
        'This submission has been previously reviewed',
      );

    if (!payload?.rejectionReason)
      throw new BadRequestException('Please add a rejection reason');

    await this.subTaskTrackerRepository.findOneAndUpdate(
      { uuid: Tracker.uuid },
      {
        submissionStatus: 'rejected' as SubmissionStatus,
        rejectionReason: payload?.rejectionReason,
        reviewed_at: new Date().toISOString(),
      },
    );

    this.notificationClientProxy.emit(NotificationPattern.CreateNotification, {
      from: { isBrand: true, sender: SubTask?.brand_uuid },
      title: `Submission for task rejected`,
      type: 'task_rejected',
      body: `Reason: ${payload?.rejectionReason}`,
      to: Tracker?.user_uuid,
      metadata: {
        sub_task_uuid: SubTask?.uuid,
        campaign_uuid: Tracker?.campaign_uuid,
        brand: SubTask?.brand_uuid,
      },
    } as CreateNotificationPayload);
  }

  async postReaction(payload: Record<string, any>) {
    const { user_uuid, post_uuid } = payload;
  }

  async isMember(member_uuid: string): Promise<MemberDocument | boolean> {
    try {
      return this.memberRepository.findOne({ member_uuid });
    } catch (err) {
      return false;
    }
  }

  async getCompletedTasks(payload: Record<string, any>) {
    const first: number = parseInt(payload.first ?? '20');
    const page: number = parseInt(payload.page ?? '1');
    const member_uuid: string = payload.uuid;

    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };

    return this.taskRepository.getPaginatedDocuments(
      first,
      page,
      {
        status: true,
        $or: [
          { members_review: { $in: [member_uuid] } },
          { members_completed: { $in: [member_uuid] } },
        ],
      },
      null,
      [populate],
    );
  }

  async getMembershipMetrics(user: UserDocument) {
    if (user.account_type === 'user') {
      throw new BadRequestException('Action not allowed on this account type.');
    }
    /* 
      {{ $match }} is like where condition brand equal uuid.
      {{ $group }} is like transformation which filters the by the date the member join the brand
       threby seting the date as an id sum up the member that joined on that paticular date
      {{  $project }} is like transformation which reshapes result of the query to a desired value
    */
    return this.memberRepository.aggregate([
      {
        $match: {
          brand: user.brand_uuid,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          members: '$count',
          _id: 0,
        },
      },
    ]);
  }

  async getTasksWithTotalEngagement(user: UserDocument) {
    if (user.account_type === 'user') {
      throw new BadRequestException('Action not allowed on this account type.');
    }
    const brand: string = user.brand_uuid;
    const page: number = 1;
    const first: number = 20;

    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };
    const userPopulate: PopulateDto = {
      path: 'members_completed',
      model: UserDocument.name,
      localField: 'members_completed',
      foreignField: 'uuid',
    };

    return this.taskRepository.getPaginatedDocuments(
      first,
      page,
      { brand },
      `-non_member_reward -member_reward -general_reward 
      -campaign_type -state -country -updated_at 
      -campaign_banner_url -campaign_amount`,
      [populate, userPopulate],
    );
  }

  async getEngagementsByATask(user: UserDocument, task_uuid: string) {
    if (user.account_type === 'user') {
      throw new BadRequestException('Action not allowed on this account type.');
    }
    /* 
      {{ $match }} is like where condition brand equal uuid.
      {{ $group }} is like transformation which filters the by the date the member join the brand
       threby seting the date as an id sum up the member that joined on that paticular date
      {{  $project }} is like transformation which reshapes result of the query to a desired value
    */
    const brand: string = user.brand_uuid;

    const task = await this.taskRepository.findOne({ uuid: task_uuid, brand });

    return this.taskCompletionRepository.aggregate([
      {
        $match: {
          task_uuid: task.uuid,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          engagements: '$count',
          _id: 0,
        },
      },
    ]);
  }

  async allTaskWithEngagementsFromCreation(user: UserDocument) {
    if (user.account_type === 'user') {
      throw new BadRequestException('Action not allowed on this account type.');
    }

    return this.taskRepository.aggregate([
      {
        $project: {
          task_uuid: '$uuid',
          taskName: '$campaign_title',
          members_review: '$members_review',
          members_completed: '$members_completed',
          created_at: { $ifNull: ['$created_at', new Date(0)] }, // Default to Unix epoch if null
          totalEngagement: {
            $add: [
              { $size: { $ifNull: ['$members_review', []] } },
              { $size: { $ifNull: ['$members_completed', []] } },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$created_at', new Date(0)] },
              then: 'Unknown',
              else: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
            },
          },
          tasks: {
            $push: {
              task_uuid: '$task_uuid',
              taskName: '$taskName',
              members_review: '$members_review',
              members_completed: '$members_completed',
              totalEngagement: '$totalEngagement',
            },
          },
          totalMonthlyEngagement: { $sum: '$totalEngagement' },
        },
      },
      {
        $sort: {
          _id: 1,
          'tasks.totalEngagement': -1,
        },
      },
      {
        $project: {
          month: '$_id',
          tasks: 1,
          totalMonthlyEngagement: 1,
          _id: 0,
        },
      },
    ]);
  }

  async getBrandsByIndustry(input: Record<string, any>) {
    const page: number = input.page || 1;

    const first: number = input.first || 20;

    const industries: string[] = input?.industries?.map((i: string) =>
      caseInsensitiveRegex(i),
    );

    const user: UserDocument = input?.user;

    const result = await this.brandRepository.aggregate([
      {
        $match: {
          industry: {
            $in: industries,
          },
        },
      },
      {
        $lookup: {
          from: 'userdocuments',
          localField: 'uuid',
          foreignField: 'brand_uuid',
          as: 'brand_user',
          pipeline: [
            {
              $project: {
                avatar: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$brand_user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'memberdocuments',
          localField: 'uuid',
          foreignField: 'brand',
          as: 'members',
        },
      },
      {
        $addFields: {
          isSubscribed: {
            $in: [user?.uuid, '$members.member_uuid'],
          },
        },
      },
      {
        $project: {
          brand_name: 1,
          uuid: 1,
          avatar: '$brand_user.avatar',
          username: '$brand_user.username',
          isSubscribed: 1,
          subscribersCount: { $size: '$members' },
        },
      },
      ...aggregationPaginationHelper({ page, first }),
    ]);

    return result?.data[0] || noDataDefault;
  }
}

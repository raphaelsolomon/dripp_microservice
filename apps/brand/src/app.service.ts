/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BrandRepository } from './repositories/brand.repository';
import {
  AUTH_SERVICE,
  caseInsensitiveRegex,
  CloudinaryResponse,
  CloudinaryService,
  IndustryRepository,
  NOTIFICATION_SERVICE,
  PopulateDto,
  SubmissionRepository,
  TaskCompletionRepository,
  UserDocument,
  UserDto,
  WALLET_SERVICE,
} from '@app/common';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateTaskDto } from './dto/task/create-task.dto';
import { MemberRepository } from './repositories/member.repository';
import { firstValueFrom } from 'rxjs';
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
import { Request } from 'express';
import { CardDto } from './dto/card/card.dto';
import { GiftUserCardDto } from './dto/giftcard/gift-user-card.dto';
import { GiftCardRepository as UserGiftCardRepository } from '@app/common';
import { DiscountRepository as UserDiscountRepository } from '@app/common';
import { GiftUserDiscountDto } from './dto/discount/gift-user-discount.dto';
import { MemberDocument } from './models/member.schema';

// interface ICampaignTask {
//   url?: string;
//   instruction: string;
//   submissionType: 'url' | 'image' | 'text';
//   socialMediaPlatform?: string; //Required only if category id is social_media
// }

// interface ICampaignTaskList {
//   categoryId: 'social_media' | 'user_generated' | 'custom';
//   categoryName: string; //Social Media, User Generated or Custom name when user clicks on add new type
//   tasks: ICampaignTask[];
// }

// const taskList: ICampaignTaskList[] = [
//   {
//     categoryId: 'social_media',
//     categoryName: 'Social Media',
//     tasks: [
//       {
//         instruction: '',
//         socialMediaPlatform: 'facebook',
//         submissionType: 'image',
//         url: '',
//       },
//       {
//         instruction: '',
//         submissionType: 'text',
//         socialMediaPlatform: 'tiktok',
//         url: '',
//       },
//     ],
//   },
//   {
//     categoryId: 'user_generated',
//     categoryName: 'User generated',
//     tasks: [{ instruction: 'Make a video', submissionType: 'url' }],
//   },
//   {
//     categoryId: 'custom',
//     categoryName: 'A custom category',
//     tasks: [{ instruction: 'Make a video', submissionType: 'url' }],
//   },
// ];
@Injectable()
export class AppService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly memberRepository: MemberRepository,
    private readonly postRepository: PostRepository,
    private readonly taskRepository: TaskRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly discountRepository: DiscountRepository,
    private readonly giftcardRepository: GiftCardRepository,
    private readonly membershipMailRepository: MemberShipMailRepository,
    private readonly cardRepository: CardRepository,
    private readonly userGiftCardRepository: UserGiftCardRepository,
    private readonly userDiscountRepository: UserDiscountRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly taskCompletionRepository: TaskCompletionRepository,
    private readonly industryRepository: IndustryRepository,
    @Inject(AUTH_SERVICE) private readonly authClientproxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
    @Inject(WALLET_SERVICE) private readonly walletClientproxy: ClientProxy,
  ) {}

  async getBrand(user: UserDto) {
    return await this.brandRepository.findOne({ uuid: user.brand_uuid });
  }

  async createBrand(payload: any) {
    const brand = await this.brandRepository.create({ ...payload });
    return { ...brand };
  }

  async updatebrand(user: UserDto, input: UpdateBrandDto) {
    try {
      console.log('REAHCEd');
      if (input.username) {
        await firstValueFrom(
          this.authClientproxy.send('update_username', {
            username: input.username,
            _id: user._id,
          }),
        );
      }
      console.log('DiD not REAHCEd');
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

  async getBrandMembers(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'users') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    const first: number = payload.first ?? 20;
    const page: number = payload.page ?? 1;

    const { brand_uuid } = user;
    const members = await this.memberRepository.getPaginatedDocuments(
      first,
      page,
      {
        brand: brand_uuid,
      },
      null,
      null,
    );

    const { paginationInfo, data } = members;
    for (let i = 0; i < data.length; i++) {
      const member: UserDto = await firstValueFrom(
        this.authClientproxy.send('get_user', { uuid: data[i].member_uuid }),
      );
      if (user) {
        const { fullname, email, avatar, username, wallet_uuid } = member;
        delete data[i].member_uuid;
        data[i]['member_details'] = {
          fullname,
          email,
          avatar,
          username,
          wallet_uuid,
        };
      }
    }
    return {
      data,
      paginationInfo,
    };
  }

  async createBrandTask(user: UserDto, input: CreateTaskDto) {
    // check if the account accessing this endpoint is a brand
    if (user.account_type === 'user')
      throw new BadRequestException(`Action not allowed on this account type`);

    // send the request to wallet service to confirm the wallet balance.
    const wallet = await firstValueFrom(
      this.walletClientproxy.send('get_wallet', { uuid: user.wallet_uuid }),
    );

    // check if the wallet balance is less than the campaign amount
    const requiredAmount = input?.campaign_amount * 0.1;
    if (parseFloat(wallet?.balance) <= input.campaign_amount * 0.1)
      throw new BadRequestException(`Insufficient balance: ${requiredAmount}`);

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

    try {
      const task = await this.taskRepository.create({
        brand: user.brand_uuid,
        ...input,
        industry: brand.industry,
        total_task: input.task_type.length,
        status: false,
      });

      if (task.reward_type === 'FIAT') {
        // send the request to wallet service to confirm the wallet balance.
        const walletResult: string = await firstValueFrom(
          this.walletClientproxy.send('create_campaign', {
            uuid: user.wallet_uuid,
            amount: input.campaign_amount,
          }),
        );

        if (walletResult !== 'success') {
          throw new BadRequestException(walletResult);
        }

        await this.taskRepository.findOneAndUpdate(
          { _id: task._id },
          { status: true },
        );
        return task;
      } else {
        // TODO: this should make them fund with usdt
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
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
        console.log(e);
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
      await this.memberRepository.findOneAndDelete({ ...payload });
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

  async getBrandTask(user: UserDto, payload: { [key: string]: number }) {
    const brandPopulate: PopulateDto = {
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
    const first: number = payload.first ?? 20;
    const page: number = payload.page ?? 1;

    return await this.taskRepository.getPaginatedDocuments(
      first,
      page,
      { brand: user.brand_uuid, status: true },
      null,
      [brandPopulate, userPopulate],
    );
  }

  async getPostsFromBrands(payload: { [key: string]: any }) {
    const limit: number = parseInt(payload.first) || 20;
    const page: number = parseInt(payload.page) || 1;

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

  async getChannels(payload: { [key: string]: number | string }) {
    const page: number = <number>payload.page;
    const first: number = <number>payload.first;
    const user_uuid: string = <string>payload.user_uuid;

    const result = await this.brandRepository.getPaginatedDocuments(
      first,
      page,
      {},
    );
    const { data, paginationInfo } = result;

    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }

    for (let i = 0; i < data.length; i++) {
      const brandMembers = [];
      const members = await this.memberRepository.find({ brand: data[i].uuid });
      const index = members.findIndex((v) => v.member_uuid === user_uuid);
      if (index > -1) {
        data[i]['isSubscribed'] = true;
      } else {
        data[i]['isSubscribed'] = false;
      }
      for (const member of members) {
        const uuid = member.member_uuid;
        const memberData: UserDto = await firstValueFrom(
          this.authClientproxy.send('get_user', { uuid }),
        );
        brandMembers.push(memberData);
      }
      data[i]['members_count'] = brandMembers.length;
      data[i]['members'] = brandMembers;
    }

    return {
      data,
      paginationInfo,
    };
  }

  async getTasksFromBrands(payload: { [key: string]: string | number }) {
    const member_uuid: string = <string>payload.member_uuid;
    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };
    const first: number = <number>payload.first;
    const page: number = <number>payload.page;
    const filter: string = <string>payload.filter;

    let memberState: string = '';
    let memberCountry: string = '';
    let memberIndustries: string[] = [];

    const memberDetails = await firstValueFrom(
      this.authClientproxy.send('get_user', { uuid: member_uuid }),
    );

    if (memberDetails) {
      memberState = memberDetails?.state?.toLowerCase();
      memberCountry = memberDetails?.country?.toLowerCase();
      memberIndustries = memberDetails?.industries.map((e) => e.toLowerCase());
    }

    /* get channel/brands users are subscribed to and also brands they are not subscribed to */
    const subscribeBrands = await this.memberRepository.find({ member_uuid });
    const subscribeBrandsUuids = subscribeBrands.map((member) => member.brand);

    console.log(memberCountry, memberState, filter, subscribeBrandsUuids);

    const projection = {
      uuid: 1,
      brand: 1,
      campaign_title: 1,
      campaign_banner_url: 1,
      member_reward: 1,
      non_member_reward: 1,
      total_task: 1,
      general_reward: 1,
      campaign_type: 1,
    };

    switch (filter) {
      case 'public':
        return await this.taskRepository.getPaginatedDocuments(
          first,
          page,
          {
            $and: [
              {
                $or: [{ campaign_type: 'public' }],
              },
              {
                industry: {
                  $in: memberIndustries?.map((e) => caseInsensitiveRegex(e)),
                },
              },
              {
                $or: [
                  {
                    locations: {
                      $elemMatch: {
                        country: memberCountry,
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
          },
          null,
          populate,
          projection,
        );

      case 'private':
        return await this.taskRepository.getPaginatedDocuments(
          first,
          page,
          {
            $and: [
              {
                $or: [{ selected_members: { $in: [member_uuid] } }],
              },
              {
                industry: {
                  $in: memberIndustries?.map((e) => caseInsensitiveRegex(e)),
                },
              },
              {
                $or: [
                  {
                    locations: {
                      $elemMatch: {
                        country: memberCountry,
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
          },
          null,
          populate,
          projection,
        );

      case 'members':
        return await this.taskRepository.getPaginatedDocuments(
          first,
          page,
          {
            $and: [
              {
                $or: [{ brand: { $in: subscribeBrandsUuids } }],
              },
              {
                industry: {
                  $in: memberIndustries?.map((e) => caseInsensitiveRegex(e)),
                },
              },
              {
                $or: [
                  {
                    locations: {
                      $elemMatch: {
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
          },
          null,
          populate,
          projection,
        );

      default:
        return await this.taskRepository.getPaginatedDocuments(
          first,
          page,
          {
            $and: [
              {
                $or: [
                  { campaign_type: 'public' },
                  { selected_members: { $in: [member_uuid] } },
                  { brand: { $in: subscribeBrandsUuids } },
                ],
              },
              {
                industry: {
                  $in: memberIndustries?.map((e) => caseInsensitiveRegex(e)),
                },
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
          },
          null,
          populate,
          projection,
        );
    }
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

  async getRecommendedChannels(payload: { [key: string]: number | string }) {
    const first: number = <number>payload.first ?? 20;
    const page: number = <number>payload.page ?? 1;

    const { data, paginationInfo } =
      await this.memberRepository.getPaginatedDocuments(first, page, {
        brand: { $ne: null },
      });

    const memberCounts = data.reduce((acc, member) => {
      acc[member.brand] = (acc[member.brand] || 0) + 1;
      return acc;
    }, {});

    const sortedBrandIds = Object.keys(memberCounts)
      .sort((a, b) => memberCounts[b] - memberCounts[a])
      .slice(0, 10);

    const recommendedBrands = await this.brandRepository.find({
      uuid: { $in: sortedBrandIds },
    });
    return { data: recommendedBrands, paginationInfo };
  }

  async createMemberShipMail(user: UserDto, input: CreateMemberShipMailDto) {
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

  async getSubmissionByTask(
    user: UserDto,
    task_uuid: string,
    member_uuid: string,
  ) {
    if (user.account_type === 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const result: { [key: string]: any } = {};

    try {
      const submissions = await this.submissionRepository.find({
        task_uuid,
        user_uuid: member_uuid,
      });

      // Initialize the member's category in the result
      result[member_uuid] = {};

      // Categorize submissions
      for (const submission of submissions) {
        let campaignType = submission.campaign_type;

        // If campaignType is a JSON string, parse it
        try {
          campaignType = JSON.parse(<string>submission.campaign_type);
        } catch (e) {
          // If parsing fails, use the campaignType as is (assuming it's a string)
        }

        if (typeof campaignType === 'object') {
          for (const [key, value] of Object.entries(campaignType)) {
            // If the key doesn't exist, create it
            if (!result[member_uuid][key]) {
              result[member_uuid][key] = {};
            }

            // If value is an object, iterate over it to set the submission URL
            if (typeof value === 'object') {
              for (const subKey in value) {
                result[member_uuid][key][subKey] = {
                  submission_url: submission.submission_url,
                };
              }
            } else {
              result[member_uuid][key][value] = {
                submission_url: submission.submission_url,
              };
            }
          }
        } else {
          // If campaignType is not an object, categorize directly
          if (!result[member_uuid][campaignType]) {
            result[member_uuid][campaignType] = {};
          }
          result[member_uuid][campaignType] = {
            submission_url: submission.submission_url,
          };
        }
      }

      return result;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async approveSubmission(user: UserDto, input: { [key: string]: string }) {
    if (user.account_type === 'user') {
      throw new BadRequestException(
        'Action not supported on the account type.',
      );
    }

    const { task_uuid, member_uuid, is_approved, reason } = input;

    const task = await this.taskRepository.findOne({
      uuid: task_uuid,
      brand: user.brand_uuid,
      members_review: { $in: [member_uuid] },
      status: true,
    });
    if (is_approved) {
      let members_review: string[] = task.members_review;
      const members_completed = task.members_completed;
      if (members_review.includes(member_uuid)) {
        members_review = members_review.filter((m) => member_uuid !== m);
      }
      if (!members_completed.includes(member_uuid)) {
        members_completed.push(member_uuid);
      }
      await this.taskRepository.findOneAndUpdate(
        { uuid: task_uuid, status: true },
        { members_review, members_completed },
      );

      //send the reward to the user's wallet
      const memberDetails = await firstValueFrom(
        this.authClientproxy.send('get_user', { uuid: member_uuid }),
      );
      let newcampaignAmount = task.campaign_amount;

      //check if user is a member of this brand
      const rewardPerEngagement: string = task.reward_per_engagement;
      let rewardPrice: number = 0;
      //check if task contains membership or non membership rewards.

      newcampaignAmount = newcampaignAmount - Number(rewardPerEngagement);
      rewardPrice = Number.parseInt(rewardPerEngagement);

      //senf the reward to the member wallet
      this.walletClientproxy.emit('send_award', {
        amount: rewardPrice,
        wallet_uuid: memberDetails.wallet_uuid,
        receiver: member_uuid,
        task: task,
      });
      // update the task with the new campaign amount balance amount
      await this.taskRepository.findOneAndUpdate(
        { _id: task._id, status: true },
        { campaign_amount: newcampaignAmount },
      );
    } else {
      let members_review: string[] = task.members_review;
      if (members_review.includes(member_uuid)) {
        members_review = members_review.filter((m) => member_uuid !== m);
      }

      await this.taskRepository.findOneAndUpdate(
        { uuid: task_uuid, status: true },
        { members_review },
      );

      const payload = {
        to: member_uuid,
        from: { isBrand: true, sender: task.brand },
        title: `${task.campaign_title} Task Submission was rejected`,
        type: 'task',
        body: reason,
        metadata: {},
      };
      this.notificationClientProxy.emit('create_notification', { ...payload });
    }
    return this.taskRepository.findOne({ uuid: task_uuid, status: true });
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

    const industries: string[] = input.industries.map((e: string) =>
      caseInsensitiveRegex(e),
    );
    const countIndustries = await this.industryRepository.countDocs({
      name: { $in: industries },
    });
    if (countIndustries < industries.length) {
      return { status: false, result: 'invalid selected industries' };
    }
    const { data, paginationInfo } =
      await this.brandRepository.getPaginatedDocuments(first, page, {
        industry: { $in: industries },
      });
    return { status: true, data, paginationInfo };
  }
}

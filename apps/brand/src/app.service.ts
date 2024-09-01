/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { BrandRepository } from './repositories/brand.repository';
import {
  AUTH_SERVICE,
  CloudinaryResponse,
  CloudinaryService,
  NOTIFICATION_SERVICE,
  PopulateDto,
  SubmissionRepository,
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

  async updatebrand(user: UserDto, updatebrandDto: UpdateBrandDto) {
    try {
      if (updatebrandDto.username) {
        await firstValueFrom(
          this.authClientproxy.send('update_username', {
            username: updatebrandDto.username,
            _id: user._id,
          }),
        );
      }
      return await this.brandRepository.findOneAndUpdate(
        { uuid: user.brand_uuid },
        { ...updatebrandDto },
      );
    } catch (err) {
      throw new HttpException(err, HttpStatus.NOT_FOUND);
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
    if (user.account_type === 'user') {
      throw new BadRequestException(`Action not allowed on this account type`);
    }

    let cloudinary: CloudinaryResponse = undefined;

    if (input.campaign_banner) {
      cloudinary = await this.cloudinaryService.uploadFile(
        input.campaign_banner,
        'campaign-banners',
      );
    }

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

    const campaign_type = JSON.parse(input.campaign_type);
    if (Object.keys(campaign_type).length <= 0) {
      throw new BadRequestException(`Campaign type is required..`);
    }

    console.log(Object.keys(campaign_type).length);

    return await this.taskRepository.create({
      campaign_banner_url: cloudinary !== undefined ? cloudinary.url : '',
      brand: user.brand_uuid,
      ...input,
      campaign_type,
      total_task: Object.keys(campaign_type).length,
    });
  }

  async updateBrandTask(user: UserDto, input: UpdateTaskDto) {
    if (input.campaign_banner) {
      const cloudinary = await this.cloudinaryService.uploadFile(
        input.campaign_banner,
        'campaign-banners',
      );
      input.bannerUrl = cloudinary.url;
    }

    if (input.campaign_type) {
      const campaign_type = JSON.parse(input.campaign_type);
      if (Object.keys(campaign_type).length <= 0) {
        throw new BadRequestException(`Campaign type is required..`);
      }

      return await this.taskRepository.findOneAndUpdate(
        {
          uuid: input.task_uuid,
          brand: user.brand_uuid,
        },
        {
          ...input,
          campaign_type,
          total_task: Object.keys(campaign_type).length,
        },
      );
    }

    return await this.taskRepository.findOneAndUpdate(
      {
        uuid: input.task_uuid,
        brand: user.brand_uuid,
      },
      { ...input },
    );
  }

  async addMemberToBrands(payload: { [key: string]: string | [string] }) {
    for (const brand_uuid of payload.brand_uuids) {
      await this.memberRepository.create({
        brand: brand_uuid,
        member_uuid: payload.user_uuid as string,
      });
      try {
        const memberShip = await this.membershipMailRepository.findOne({
          brand: brand_uuid,
        });
        this.notificationClientProxy.emit('membership_mail', {
          title: memberShip.title,
          body: memberShip.body,
          type: 'membership-mail',
          to: payload.user_uuid as string,
          from: { isbrand: true, sender: brand_uuid },
        });
      } catch (error) {
        console.log('No membership email found');
      }
    }
    console.log('member added');
  }

  async addMemberToBrand(payload: { [key: string]: string }) {
    const member_uuid: string = payload.member_uuid;
    const brand: string = payload.brand_uuid;

    const result = await this.memberRepository.findOneOrCreate(
      { member_uuid, brand },
      { member_uuid, brand },
    );
    try {
      const memberShip = await this.membershipMailRepository.findOne({ brand });
      this.notificationClientProxy.emit('membership_mail', {
        title: memberShip.title,
        body: memberShip.body,
        type: 'membership-mail',
        to: member_uuid,
        from: { isbrand: true, sender: brand },
      });
    } catch (error) {
      console.log('No membership email found');
    }

    return result;
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
      { brand: user.brand_uuid },
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
        { brand: { $nin: getSubcribedBrandUuids } },
      ],
    };

    const aggregationPipeline: any[] = [
      {
        $match: {
          $or: [
            { brand: { $in: getSubcribedBrandUuids } },
            { brand: { $nin: getSubcribedBrandUuids } },
          ],
        },
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
    // const first: number = <number>payload.first;
    // const page: number = <number>payload.page;

    /* get channel/brands users are subscribed to and also brands they are not subscribed to */
    const subscribeBrands = await this.memberRepository.find({ member_uuid });
    const subscribeBrandsUuids = subscribeBrands.map((member) => member.brand);
    const subscribedTasks = await this.taskRepository.find(
      {
        brand: { $in: subscribeBrandsUuids },
      },
      populate,
    );

    const unsubscribeTasks = await this.taskRepository.find(
      {
        brand: { $nin: subscribeBrandsUuids },
      },
      populate,
    );

    for (let i = subscribedTasks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [subscribedTasks[i], subscribedTasks[j]] = [
        subscribedTasks[j],
        subscribedTasks[i],
      ];
    }

    return [...subscribedTasks, ...unsubscribeTasks];
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
      });

      return { tasks, discounts, giftCards, posts, member_uuids };
    }
  }

  async getTask(uuid: string) {
    try {
      const task = await this.taskRepository.findOne({ uuid });
      return task;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async updateTaskReview(payload: Record<string, any>) {
    const { task_uuid, user_uuid } = payload;

    const task = await this.taskRepository.findOne({ uuid: task_uuid });
    if (!task.members_review.includes(user_uuid)) {
      const members_review = task.members_review;
      members_review.push(user_uuid);
      await this.taskRepository.findOneAndUpdate(
        { uuid: task_uuid },
        { members_review },
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
        { uuid: task_uuid },
        { members_review, members_completed },
      );

      //send the reward to the user's wallet
      const memberDetails = await firstValueFrom(
        this.authClientproxy.send('get_user', { uuid: member_uuid }),
      );
      let newcampaignAmount = task.campaign_amount;

      //check if user is a member of this brand
      const isMember = await this.isMember(member_uuid);
      let rewardPrice: number = 0;
      //check if task contains membership or non membership rewards.
      if (isMember && task.member_reward) {
        newcampaignAmount = newcampaignAmount - Number(task.member_reward);
        rewardPrice = Number.parseInt(task.member_reward);
      } else if (!isMember && task.non_member_reward) {
        newcampaignAmount = newcampaignAmount - Number(task.non_member_reward);
        rewardPrice = Number.parseInt(task.non_member_reward);
      } else {
        newcampaignAmount = newcampaignAmount - Number(task.general_reward);
        rewardPrice = Number(task.general_reward);
      }
      //senf the reward to the member wallet
      this.walletClientproxy.emit('send_award', {
        amount: rewardPrice,
        wallet_uuid: memberDetails.wallet_uuid,
        receiver: member_uuid,
        task: task,
      });
      // update the task with the new campaign amount balance amount
      await this.taskRepository.findOneAndUpdate(
        { _id: task._id },
        { campaign_amount: newcampaignAmount },
      );
    } else {
      let members_review: string[] = task.members_review;
      if (members_review.includes(member_uuid)) {
        members_review = members_review.filter((m) => member_uuid !== m);
      }

      await this.taskRepository.findOneAndUpdate(
        { uuid: task_uuid },
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
    return this.taskRepository.findOne({ uuid: task_uuid });
  }

  async postReaction(payload: Record<string, any>) {
    const { user_uuid, post_uuid } = payload;

    try {
      const post = await this.postRepository.findOne({ uuid: post_uuid });
      let post_likes: string[] = post.post_likes;
      if (post_likes.includes(user_uuid)) {
        post_likes = post_likes.filter((e) => e !== user_uuid);
      } else {
        post_likes.push(user_uuid);
      }
      return this.postRepository.findOneAndUpdate(
        { _id: post._id },
        { post_likes },
      );
    } catch (err) {
      throw new BadRequestException(err);
    }
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
        $or: [
          { members_review: { $in: [member_uuid] } },
          { members_completed: { $in: [member_uuid] } },
        ],
      },
      null,
      [populate],
    );
  }
}

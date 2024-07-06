import { Injectable } from '@nestjs/common';
import { BusinessRepository } from './business.repository';

@Injectable()
export class AppService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async createBusiness(payload: any) {
    const getBusiness = await this.validateCreateBusinessUser(payload.userId);
    if (getBusiness) return { ...getBusiness };
    const business = await this.businessRepository.create({ ...payload });
    return { ...business };
  }

  private async validateCreateBusinessUser(userId: string) {
    try {
      return await this.businessRepository.findOne({ userId: userId });
    } catch (err) {
      return null;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}

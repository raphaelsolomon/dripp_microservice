import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BusinessRepository } from './business.repository';
import { UserDto } from '@app/common';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class AppService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async createBusiness(payload: any) {
    const business = await this.businessRepository.create({ ...payload });
    return { ...business };
  }

  async updateBusiness(user: UserDto, updateBusinessDto: UpdateBusinessDto) {
    try {
      return await this.businessRepository.findOneAndUpdate(
        { uuid: user.business_uuid },
        { ...updateBusinessDto },
      );
    } catch (err) {
      throw new HttpException('Record not found', HttpStatus.NOT_FOUND);
    }
  }
}

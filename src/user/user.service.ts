import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPasswordHelper } from 'src/common/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  // check email exist
  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });
    if (user) return true;
    return false;
  };

  // check phone exist
  isPhoneExist = async (phone: string) => {
    const user = await this.userModel.exists({ phone });
    if (user) return true;
    return false;
  };

  // generate code expired
  getCodeExpired = () => {
    const expireValue = this.configService.get<number>('CODE_EXPIRE_VALUE', 5);
    const expireUnit = this.configService.get<string>('CODE_EXPIRE_UNIT', 'm');
    const codeExpired = dayjs()
      .add(expireValue, expireUnit as dayjs.ManipulateType)
      .toDate();
    return codeExpired;
  };

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, password, phone, avatar } = createUserDto;
    //check email
    const isExist = await this.isEmailExist(email);
    if (isExist === true) {
      throw new ConflictException(`Email exist.`);
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password);

    const user = new this.userModel({
      username,
      email,
      password: hashPassword,
      phone,
      avatar,
    });
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById({ _id: id }).exec();
  }
}

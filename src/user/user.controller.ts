import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { cleanObject } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { promises as fs } from 'fs';
import { diskStorage } from 'multer';

@ApiTags('User')
@ApiCookieAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-user')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
      limits: { fieldSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'Nguyễn Văn A' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' },
        phone: { type: 'string' },
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['username', 'email', 'password'],
    },
  })
  async create(
    @Body() dto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarPath = file ? file.filename : null;

    try {
      const cleanedData = cleanObject(dto);

      const user = await this.userService.create({
        ...cleanedData,
        avatar: avatarPath,
      } as CreateUserDto);

      return {
        message: 'Created user success!',
        data: user,
      };
    } catch (error) {
      if (avatarPath) {
        const fullPath = join(process.cwd(), 'uploads/avatars', avatarPath);
        try {
          await fs.unlink(fullPath);
          console.warn(`Photo deleted due to user failure: ${avatarPath}`);
        } catch (fsErr) {
          console.error('Photo deletion failed:', fsErr);
        }
      }
      throw error;
    }
  }
}

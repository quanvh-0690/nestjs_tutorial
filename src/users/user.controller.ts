import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Put,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthService } from '../auth/auth.service.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { UpdateUserDto, UpdateUserRequestDto } from './dto/update-user.dto.js';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

/** Current user: /api/user */
@ApiTags('User')
@ApiBearerAuth()
@ApiExtraModels(UpdateUserDto)
@Controller('user')
@UseGuards(JwtAuthGuard) // every route in this controller requires login
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  /** Get Current User */
  @Get()
  getCurrentUser(@CurrentUser() user: User) {
    return { user: this.authService.buildUserResponse(user) };
  }

  /**
   * Update User: accepts JSON or multipart/form-data (when uploading an avatar).
   * FileInterceptor (Multer) reads the file into memory; limits reject oversized files during upload.
   */
  @Put()
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: MAX_AVATAR_SIZE } }),
  )
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(UpdateUserDto) },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image',
        },
      },
    },
  })
  async update(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserRequestDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false, // without an image only the profile fields are updated
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE }),
          // Check the file's "magic number" instead of trusting the extension alone
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
        exceptionFactory: () =>
          new UnprocessableEntityException({
            errors: { image: ['attachment.INVALID_IMAGE'] },
          }),
      }),
    )
    image?: Express.Multer.File,
  ) {
    const updated = await this.usersService.update(user, dto.user, image);
    return { user: this.authService.buildUserResponse(updated) };
  }
}

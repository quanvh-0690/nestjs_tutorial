import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { AttachmentsService } from './attachments.service.js';

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  /**
   * Return the file content (private): login required + permission check.
   * ParseUUIDPipe: an id that is not a UUID => 400 right away, without touching the database.
   */
  @Get(':id')
  @ApiOkResponse({ description: 'File content (binary)' })
  async download(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() viewer: User,
  ): Promise<StreamableFile> {
    const { attachment, stream } = await this.attachmentsService.openForViewer(
      id,
      viewer,
    );
    return new StreamableFile(stream, {
      type: attachment.fileType,
      length: attachment.fileSize,
      disposition: `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
    });
  }
}

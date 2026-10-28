import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { ReadStream } from 'node:fs';
import path from 'node:path';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { Attachment } from './entities/attachment.entity.js';
import { PrivateStorageService } from './private-storage.service.js';
import { AttachableType, AttachmentCollection } from './attachable-type.js';

export interface AttachInput {
  attachableType: AttachableType;
  attachableId: string | number;
  collection: AttachmentCollection;
  file: Express.Multer.File;
  uploadedBy?: number;
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class AttachmentsService {
  private readonly appUrl: string;

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly storage: PrivateStorageService,
    config: ConfigService,
  ) {
    this.appUrl = config.get<string>('app.url', 'http://localhost:3000');
  }

  /**
   * Attach a new file to the object and DELETE the old file of the same collection
   * (a user has only one avatar). Returns the new attachment.
   */
  async replace(input: AttachInput): Promise<Attachment> {
    const old = await this.findFor(
      input.attachableType,
      input.attachableId,
      input.collection,
    );
    const attachment = await this.create(input);
    if (old) await this.remove(old);
    return attachment;
  }

  async create(input: AttachInput): Promise<Attachment> {
    const { file } = input;
    const ext =
      MIME_EXTENSIONS[file.mimetype] ??
      path.extname(file.originalname).toLowerCase();
    const storedPath = await this.storage.save(
      file.buffer,
      input.collection,
      ext,
    );

    try {
      const attachment = this.attachmentsRepository.create({
        attachableType: input.attachableType,
        attachableId: String(input.attachableId),
        collection: input.collection,
        fileName: path.basename(file.originalname),
        fileType: file.mimetype,
        fileSize: file.size,
        path: storedPath,
        url: '', // the id (generated on insert) is needed to build the url
        uploadedBy: input.uploadedBy ?? null,
      });
      await this.attachmentsRepository.save(attachment);
      attachment.url = `${this.appUrl}/api/attachments/${attachment.id}`;
      return await this.attachmentsRepository.save(attachment);
    } catch (error) {
      // DB save failed => delete the file just written so no "orphan" file is left behind
      await this.storage.remove(storedPath);
      throw error;
    }
  }

  findFor(
    attachableType: AttachableType,
    attachableId: string | number,
    collection: AttachmentCollection,
  ): Promise<Attachment | null> {
    return this.attachmentsRepository.findOneBy({
      attachableType,
      attachableId: String(attachableId),
      collection,
    });
  }

  async remove(attachment: Attachment): Promise<void> {
    await this.attachmentsRepository.remove(attachment);
    await this.storage.remove(attachment.path);
  }

  /** Load the file to return to the client, after checking view permission */
  async openForViewer(
    id: string,
    viewer: User,
  ): Promise<{ attachment: Attachment; stream: ReadStream }> {
    const attachment = await this.attachmentsRepository.findOneBy({ id });
    if (!attachment) throw new NotFoundException('attachment.NOT_FOUND');
    if (!this.canView(attachment, viewer)) {
      throw new ForbiddenException('attachment.FORBIDDEN');
    }
    return { attachment, stream: this.storage.read(attachment.path) };
  }

  /**
   * View permission for a file:
   *  - Avatar: any logged-in user can view it (to display other people's profiles)
   *  - Other files: only the uploader or an admin
   */
  canView(attachment: Attachment, viewer: User): boolean {
    const isAvatar =
      attachment.attachableType === AttachableType.USER &&
      attachment.collection === AttachmentCollection.AVATAR;
    return (
      isAvatar ||
      attachment.uploadedBy === viewer.id ||
      viewer.role === UserRole.ADMIN
    );
  }
}

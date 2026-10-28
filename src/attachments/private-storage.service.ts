import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream, ReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Store files in a PRIVATE directory (default ./storage/private). This directory
 * is NOT served publicly; files are only readable through GET /api/attachments/:id.
 */
@Injectable()
export class PrivateStorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = path.resolve(
      config.get<string>('storage.privatePath', 'storage/private'),
    );
  }

  /** Save a buffer, return the relative path e.g. "avatars/<uuid>.png" */
  async save(buffer: Buffer, folder: string, ext: string): Promise<string> {
    const relativePath = path.posix.join(folder, `${randomUUID()}${ext}`);
    const absolute = this.resolve(relativePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, buffer);
    return relativePath;
  }

  read(relativePath: string): ReadStream {
    return createReadStream(this.resolve(relativePath));
  }

  async remove(relativePath: string): Promise<void> {
    await rm(this.resolve(relativePath), { force: true });
  }

  /** Block path traversal (e.g. "../../etc/passwd"): the file must stay inside root */
  private resolve(relativePath: string): string {
    const absolute = path.resolve(this.root, relativePath);
    if (!absolute.startsWith(this.root + path.sep)) {
      throw new Error(`Invalid storage path: ${relativePath}`);
    }
    return absolute;
  }
}

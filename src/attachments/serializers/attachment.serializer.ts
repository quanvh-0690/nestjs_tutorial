import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AttachmentSerializer {
  @Expose() id: string;
  @Expose() url: string;
  @Expose() fileName: string;
  @Expose() fileType: string;
  @Expose() fileSize: number;
  @Expose() createdAt: Date;
  // path (location on the server) must NOT be exposed

  constructor(partial: Partial<AttachmentSerializer>) {
    Object.assign(this, partial);
  }
}

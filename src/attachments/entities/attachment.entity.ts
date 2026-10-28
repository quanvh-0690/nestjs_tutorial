import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Uploaded files table, polymorphic design:
 *   (attachable_type, attachable_id) tells which object the file belongs to,
 *   e.g. ('User', '12').
 * id is a UUID (not auto-increment) => cannot guess/scan /attachments/1, /2, /3...
 */
@Entity('attachments')
@Index(['attachableType', 'attachableId', 'collection'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attachable_type', type: 'varchar', length: 50 })
  attachableType: string;

  // varchar so it works for objects with numeric ids as well as uuid ids
  @Column({ name: 'attachable_id', type: 'varchar', length: 36 })
  attachableId: string;

  @Column({ type: 'varchar', length: 50 })
  collection: string;

  /** Original file name as uploaded by the user (used for Content-Disposition) */
  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  /** MIME type, e.g. image/png */
  @Column({ name: 'file_type', type: 'varchar', length: 100 })
  fileType: string;

  /** Size (bytes) */
  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  /** Relative path inside the storage directory (NOT returned by the API) */
  @Column({ type: 'varchar', length: 500 })
  path: string;

  /** URL for the client to fetch the file, goes through the API with permission check */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ name: 'uploaded_by', type: 'int', nullable: true })
  uploadedBy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

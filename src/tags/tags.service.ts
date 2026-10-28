import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from './entities/tag.entity.js';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findAllNames(): Promise<string[]> {
    const tags = await this.tagsRepository.find({ order: { name: 'ASC' } });
    return tags.map((tag) => tag.name);
  }

  /** Return existing tags and create the missing ones */
  async findOrCreate(names: string[]): Promise<Tag[]> {
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    if (!unique.length) return [];
    await this.tagsRepository
      .createQueryBuilder()
      .insert()
      .values(unique.map((name) => ({ name })))
      .orIgnore()
      .execute();
    return this.tagsRepository.findBy({ name: In(unique) });
  }
}

import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service.js';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll() {
    return { tags: await this.tagsService.findAllNames() };
  }
}

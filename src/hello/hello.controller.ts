import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HelloService } from './hello.service.js';
import { HelloQueryDto } from './hello-query.dto.js';

@ApiTags('Hello')
@Controller('hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  /** GET /api/hello?name=Quan&lang=vi */
  @Get()
  hello(@Query() query: HelloQueryDto) {
    return { message: this.helloService.greet(query.name) };
  }
}

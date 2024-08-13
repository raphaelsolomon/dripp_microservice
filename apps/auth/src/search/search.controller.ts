import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, UserDto } from '@app/common';
import { Request } from 'express';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/:input')
  @UseGuards(JwtAuthGuard)
  searchDocuments(@CurrentUser() user: UserDto, @Req() req: Request) {
    return this.searchService.searchDocuments(user, req.params?.input);
  }
}

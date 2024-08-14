import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, UserDto } from '@app/common';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/:input')
  @UseGuards(JwtAuthGuard)
  searchDocuments(@CurrentUser() user: UserDto, @Param('input') s: string) {
    return this.searchService.searchDocuments(user, s);
  }
}

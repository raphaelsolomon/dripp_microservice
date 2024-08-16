import { Controller, Get, UseGuards } from '@nestjs/common';
import { GraphService } from './graph.service';
import { JwtAuthGuard } from '@app/common';

@Controller('brand/graph')
export class GraphController {
  constructor(readonly graphService: GraphService) {}

  @UseGuards(JwtAuthGuard)
  @Get('engagements-per-month')
  async getTotalEngagementPerMonth() {
    return this.graphService.getTotalEngagementPerMonth();
  }

  @UseGuards(JwtAuthGuard)
  @Get('engagements-per-task')
  async getEngagementPerTask() {
    return this.graphService.getEngagementPerTask();
  }
}

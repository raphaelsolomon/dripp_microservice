import { Injectable } from '@nestjs/common';

@Injectable()
export class GraphService {
  constructor() {}
  getEngagementPerTask() {
    return 'good';
  }
  getTotalEngagementPerMonth() {
    return 'good';
  }
}

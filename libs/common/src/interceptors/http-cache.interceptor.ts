import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const excludePaths = []; // Routes to be excluded
    const getRequest = httpAdapter.getRequestUrl(request);
    const isIncluded = excludePaths.includes(getRequest);
    if (!isGetRequest || (isGetRequest && isIncluded)) {
      return undefined;
    }
    return httpAdapter.getRequestUrl(request);
  }
}

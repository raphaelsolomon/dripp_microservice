import { HasMimeType, IsFile, MaxFileSize } from 'nestjs-form-data';

export class CreatePostDto {
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
  media?: Express.Multer.File;

  post_title: string;

  post_content: string;

  media_type?: 'image' | 'video';

  protected media_url?: string;

  set mediaUrl(url: string) {
    if (!url) {
      throw new Error('url cannot be empty');
    }
    this.media_url = url;
  }
}

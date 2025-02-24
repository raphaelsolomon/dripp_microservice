import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CloudinaryResponse } from './cloudinary.response';
export interface IGetGalleryProps {
  limit: number;
  next_cursor: string | boolean;
}

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder, filename_override: `${new Date().getTime()}` },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async getFiles(folder: string, props?: Partial<IGetGalleryProps>) {
    const searchRes = await cloudinary.api.resources_by_asset_folder(folder, {
      type: 'upload',
      max_results: props?.limit || 40,
      next_cursor: props?.next_cursor || null,
    });

    return searchRes;
  }
}

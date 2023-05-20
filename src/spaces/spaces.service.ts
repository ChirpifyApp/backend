import { Inject, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { DoSpacesServiceLib, UploadedMulterFileI } from '.';
const sharp = require('sharp');

@Injectable()
export class SpacesService {
  constructor(@Inject(DoSpacesServiceLib) private readonly s3: AWS.S3) { }

  async uploadFile(file: UploadedMulterFileI) {
    let { buffer, originalname } = file;
    const timestamp = new Date().toISOString();
    const ref = `${timestamp}-${originalname}.webp`;
    buffer = await sharp(buffer)
    .webp( { quality: 50} )
    .toBuffer();

    // Return a promise that resolves only when the file upload is complete
    return new Promise((resolve, reject) => {
      this.s3.putObject(
        {
          Bucket: 'chirpify-space',
          Key: ref,
          Body: buffer,
          ACL: 'public-read',
        },
        (error: AWS.AWSError) => {
          if (!error) {
            resolve(`https://chirpify-space.fra1.cdn.digitaloceanspaces.com/${ref}`);
          } else {
            console.error(error);
            reject(
              new Error(
                `DoSpacesService_ERROR: ${error.message || 'Something went wrong'}`,
              ),
            );
          }
        },
      );
    });
  }
}

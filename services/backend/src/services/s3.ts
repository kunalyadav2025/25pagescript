import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET || '25pagescript-scripts';

/**
 * Upload a PDF file to S3
 */
export async function uploadPDF(
  scriptId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const key = `scripts/${scriptId}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      // Make it publicly readable or use signed URLs
      // ACL: 'public-read',
    })
  );

  return key;
}

/**
 * Get a pre-signed URL for reading a PDF (valid for 1 hour)
 */
export async function getSignedPDFUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

/**
 * Get a pre-signed URL for uploading a PDF (valid for 15 minutes)
 */
export async function getUploadUrl(
  scriptId: string,
  fileName: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const key = `scripts/${scriptId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: 'application/pdf',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return { uploadUrl, s3Key: key };
}

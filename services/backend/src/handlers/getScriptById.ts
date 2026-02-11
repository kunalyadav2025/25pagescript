import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getScriptById } from '../services/dynamodb';
import { getSignedPDFUrl } from '../services/s3';
import { success, notFound, badRequest, serverError } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scriptId = event.pathParameters?.id;

    if (!scriptId) {
      return badRequest('Script ID is required');
    }

    const script = await getScriptById(scriptId);

    if (!script) {
      return notFound('Script not found');
    }

    // Only return published scripts
    if (script.status !== 'PUBLISHED') {
      return notFound('Script not found');
    }

    // Generate signed URL for PDF download (optional)
    let pdfUrl: string | undefined;
    if (script.scriptFileS3Key) {
      try {
        pdfUrl = await getSignedPDFUrl(script.scriptFileS3Key);
      } catch (error) {
        console.warn('Failed to generate PDF URL:', error);
      }
    }

    return success({
      ...script,
      pdfUrl,
    });
  } catch (error) {
    console.error('Error fetching script:', error);
    return serverError('Failed to fetch script');
  }
}

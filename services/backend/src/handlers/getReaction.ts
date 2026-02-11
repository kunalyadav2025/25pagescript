import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getReaction } from '../services/dynamodb';
import { success, badRequest, serverError } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scriptId = event.pathParameters?.id;
    const deviceId = event.queryStringParameters?.deviceId;

    if (!scriptId) {
      return badRequest('Script ID is required');
    }

    if (!deviceId) {
      return badRequest('Device ID is required');
    }

    const reaction = await getReaction(scriptId, deviceId);

    return success({
      reaction: reaction?.reaction || null,
    });
  } catch (error) {
    console.error('Error getting reaction:', error);
    return serverError('Failed to get reaction');
  }
}

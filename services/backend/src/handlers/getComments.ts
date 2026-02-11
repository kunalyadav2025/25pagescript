import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getComments, getScriptById } from '../services/dynamodb';
import { success, badRequest, notFound, serverError } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scriptId = event.pathParameters?.id;

    if (!scriptId) {
      return badRequest('Script ID is required');
    }

    // Verify script exists
    const script = await getScriptById(scriptId);

    if (!script || script.status !== 'PUBLISHED') {
      return notFound('Script not found');
    }

    // Parse pagination parameters
    const queryParams = event.queryStringParameters || {};
    const page = queryParams.page ? parseInt(queryParams.page, 10) : 1;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return badRequest('Invalid pagination parameters');
    }

    // Get comments
    const result = await getComments(scriptId, { page, limit });

    return success({
      comments: result.comments,
      total: result.total,
      page,
      limit,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return serverError('Failed to fetch comments');
  }
}

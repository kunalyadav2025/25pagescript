import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getScripts } from '../services/dynamodb';
import { success, badRequest, serverError } from '../utils/response';
import { Genre, GENRES } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const queryParams = event.queryStringParameters || {};

    // Parse query parameters
    const genre = queryParams.genre as Genre | undefined;
    const page = queryParams.page ? parseInt(queryParams.page, 10) : 1;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 20;

    // Validate genre if provided
    if (genre && !GENRES.includes(genre)) {
      return badRequest(`Invalid genre. Must be one of: ${GENRES.join(', ')}`);
    }

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return badRequest('Invalid pagination parameters');
    }

    // Get scripts
    const result = await getScripts({ genre, page, limit });

    return success({
      scripts: result.scripts,
      total: result.total,
      page,
      limit,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return serverError('Failed to fetch scripts');
  }
}

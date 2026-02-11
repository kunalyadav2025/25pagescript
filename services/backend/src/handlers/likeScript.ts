import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  getScriptById,
  getReaction,
  setReaction,
  incrementScriptLikes,
  decrementScriptDislikes,
} from '../services/dynamodb';
import { success, badRequest, notFound, conflict, serverError, parseBody } from '../utils/response';
import { ReactionRequest } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scriptId = event.pathParameters?.id;

    if (!scriptId) {
      return badRequest('Script ID is required');
    }

    const body = parseBody<ReactionRequest>(event.body);

    if (!body || !body.deviceId) {
      return badRequest('Device ID is required');
    }

    const { deviceId } = body;

    // Check if script exists
    const script = await getScriptById(scriptId);

    if (!script || script.status !== 'PUBLISHED') {
      return notFound('Script not found');
    }

    // Check if user already reacted
    const existingReaction = await getReaction(scriptId, deviceId);

    if (existingReaction) {
      if (existingReaction.reaction === 'LIKE') {
        // Already liked
        return conflict('You have already liked this script');
      }

      // User previously disliked, change to like
      await setReaction(scriptId, deviceId, 'LIKE');
      await decrementScriptDislikes(scriptId);
      const counts = await incrementScriptLikes(scriptId);

      return success({
        likeCount: counts.likeCount,
        dislikeCount: counts.dislikeCount,
      });
    }

    // New like
    await setReaction(scriptId, deviceId, 'LIKE');
    const counts = await incrementScriptLikes(scriptId);

    return success({
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
    });
  } catch (error) {
    console.error('Error liking script:', error);
    return serverError('Failed to like script');
  }
}

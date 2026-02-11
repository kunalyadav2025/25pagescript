import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  getScriptById,
  getReaction,
  setReaction,
  incrementScriptDislikes,
  decrementScriptLikes,
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
      if (existingReaction.reaction === 'DISLIKE') {
        // Already disliked
        return conflict('You have already disliked this script');
      }

      // User previously liked, change to dislike
      await setReaction(scriptId, deviceId, 'DISLIKE');
      await decrementScriptLikes(scriptId);
      const counts = await incrementScriptDislikes(scriptId);

      return success({
        likeCount: counts.likeCount,
        dislikeCount: counts.dislikeCount,
      });
    }

    // New dislike
    await setReaction(scriptId, deviceId, 'DISLIKE');
    const counts = await incrementScriptDislikes(scriptId);

    return success({
      likeCount: counts.likeCount,
      dislikeCount: counts.dislikeCount,
    });
  } catch (error) {
    console.error('Error disliking script:', error);
    return serverError('Failed to dislike script');
  }
}

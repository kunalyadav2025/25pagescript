import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createComment, getScriptById } from '../services/dynamodb';
import { success, badRequest, notFound, serverError, parseBody, created } from '../utils/response';
import { AddCommentRequest } from '../types';

const MAX_NAME_LENGTH = 50;
const MAX_COMMENT_LENGTH = 500;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scriptId = event.pathParameters?.id;

    if (!scriptId) {
      return badRequest('Script ID is required');
    }

    const body = parseBody<AddCommentRequest>(event.body);

    if (!body) {
      return badRequest('Invalid request body');
    }

    const { name, comment } = body;

    // Validate name
    if (!name || !name.trim()) {
      return badRequest('Name is required');
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      return badRequest(`Name must be ${MAX_NAME_LENGTH} characters or less`);
    }

    // Validate comment
    if (!comment || !comment.trim()) {
      return badRequest('Comment is required');
    }

    if (comment.trim().length > MAX_COMMENT_LENGTH) {
      return badRequest(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
    }

    // Verify script exists
    const script = await getScriptById(scriptId);

    if (!script || script.status !== 'PUBLISHED') {
      return notFound('Script not found');
    }

    // Create comment
    const newComment = await createComment(
      scriptId,
      name.trim(),
      comment.trim()
    );

    return created({
      commentId: newComment.commentId,
      scriptId: newComment.scriptId,
      commenterName: newComment.commenterName,
      commentText: newComment.commentText,
      createdAt: newComment.createdAt,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return serverError('Failed to add comment');
  }
}

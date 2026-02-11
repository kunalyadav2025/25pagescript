import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Script, Comment, Reaction, OTPRecord, Genre } from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Table names from environment
const SCRIPTS_TABLE = process.env.SCRIPTS_TABLE || 'Scripts';
const COMMENTS_TABLE = process.env.COMMENTS_TABLE || 'Comments';
const REACTIONS_TABLE = process.env.REACTIONS_TABLE || 'Reactions';
const OTP_TABLE = process.env.OTP_TABLE || 'OTP';

// ============ SCRIPTS ============

export async function createScript(script: Omit<Script, 'scriptId' | 'createdAt' | 'updatedAt'>): Promise<Script> {
  const now = new Date().toISOString();
  const newScript: Script = {
    ...script,
    scriptId: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: SCRIPTS_TABLE,
      Item: newScript,
    })
  );

  return newScript;
}

export async function getScriptById(scriptId: string): Promise<Script | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
    })
  );

  return (result.Item as Script) || null;
}

export async function getScripts(params: {
  genre?: Genre;
  page?: number;
  limit?: number;
}): Promise<{ scripts: Script[]; total: number; hasMore: boolean }> {
  const { genre, page = 1, limit = 20 } = params;

  let command;

  if (genre) {
    // Use GSI for genre filtering
    command = new QueryCommand({
      TableName: SCRIPTS_TABLE,
      IndexName: 'genre-createdAt-index',
      KeyConditionExpression: 'genre = :genre',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':genre': genre,
        ':status': 'PUBLISHED',
      },
      ScanIndexForward: false, // newest first
    });
  } else {
    // Scan all published scripts
    command = new ScanCommand({
      TableName: SCRIPTS_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'PUBLISHED',
      },
    });
  }

  const result = await docClient.send(command);
  const items = (result.Items as Script[]) || [];

  // Sort by createdAt descending (newest first)
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const total = items.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const scripts = items.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return { scripts, total, hasMore };
}

export async function updateScriptPayment(
  scriptId: string,
  paymentId: string,
  status: 'PAID' | 'FAILED'
): Promise<Script | null> {
  const now = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
      UpdateExpression: 'SET payment.paymentId = :paymentId, payment.#status = :paymentStatus, #scriptStatus = :scriptStatus, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#scriptStatus': 'status',
      },
      ExpressionAttributeValues: {
        ':paymentId': paymentId,
        ':paymentStatus': status,
        ':scriptStatus': status === 'PAID' ? 'PUBLISHED' : 'PENDING_PAYMENT',
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as Script) || null;
}

export async function updateScriptMetadata(
  scriptId: string,
  updates: {
    title?: string;
    logline?: string;
    synopsis?: string;
    genre?: Genre;
    language?: string;
    copyright?: {
      hasCertificate: boolean;
      certificateNumber?: string;
    };
  }
): Promise<Script | null> {
  const now = new Date().toISOString();

  const expressionParts: string[] = ['updatedAt = :updatedAt'];
  const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };
  const expressionAttributeNames: Record<string, string> = {};

  if (updates.title !== undefined) {
    expressionParts.push('title = :title');
    expressionAttributeValues[':title'] = updates.title;
  }
  if (updates.logline !== undefined) {
    expressionParts.push('logline = :logline');
    expressionAttributeValues[':logline'] = updates.logline;
  }
  if (updates.synopsis !== undefined) {
    expressionParts.push('synopsis = :synopsis');
    expressionAttributeValues[':synopsis'] = updates.synopsis;
  }
  if (updates.genre !== undefined) {
    expressionParts.push('genre = :genre');
    expressionAttributeValues[':genre'] = updates.genre;
  }
  if (updates.language !== undefined) {
    expressionParts.push('#lang = :language');
    expressionAttributeValues[':language'] = updates.language;
    expressionAttributeNames['#lang'] = 'language';
  }
  if (updates.copyright !== undefined) {
    expressionParts.push('copyright = :copyright');
    expressionAttributeValues[':copyright'] = updates.copyright;
  }

  if (expressionParts.length === 1) {
    return null;
  }

  const params: any = {
    TableName: SCRIPTS_TABLE,
    Key: { scriptId },
    UpdateExpression: 'SET ' + expressionParts.join(', '),
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: 'attribute_exists(scriptId)',
    ReturnValues: 'ALL_NEW',
  };

  if (Object.keys(expressionAttributeNames).length > 0) {
    params.ExpressionAttributeNames = expressionAttributeNames;
  }

  const result = await docClient.send(new UpdateCommand(params));
  return (result.Attributes as Script) || null;
}

export async function incrementScriptLikes(scriptId: string): Promise<{ likeCount: number; dislikeCount: number }> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
      UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :zero) + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  const script = result.Attributes as Script;
  return { likeCount: script.likeCount, dislikeCount: script.dislikeCount };
}

export async function incrementScriptDislikes(scriptId: string): Promise<{ likeCount: number; dislikeCount: number }> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
      UpdateExpression: 'SET dislikeCount = if_not_exists(dislikeCount, :zero) + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  const script = result.Attributes as Script;
  return { likeCount: script.likeCount, dislikeCount: script.dislikeCount };
}

export async function decrementScriptLikes(scriptId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
      UpdateExpression: 'SET likeCount = likeCount - :dec',
      ConditionExpression: 'likeCount > :zero',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':zero': 0,
      },
    })
  );
}

export async function decrementScriptDislikes(scriptId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
      UpdateExpression: 'SET dislikeCount = dislikeCount - :dec',
      ConditionExpression: 'dislikeCount > :zero',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':zero': 0,
      },
    })
  );
}

export async function incrementScriptComments(scriptId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SCRIPTS_TABLE,
      Key: { scriptId },
      UpdateExpression: 'SET commentCount = if_not_exists(commentCount, :zero) + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
      },
    })
  );
}

// ============ COMMENTS ============

export async function createComment(
  scriptId: string,
  commenterName: string,
  commentText: string
): Promise<Comment> {
  const now = new Date().toISOString();
  const comment: Comment = {
    scriptId,
    commentId: uuidv4(),
    commenterName,
    commentText,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: COMMENTS_TABLE,
      Item: comment,
    })
  );

  // Increment comment count on script
  await incrementScriptComments(scriptId);

  return comment;
}

export async function getComments(
  scriptId: string,
  params: { page?: number; limit?: number }
): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
  const { page = 1, limit = 20 } = params;

  const result = await docClient.send(
    new QueryCommand({
      TableName: COMMENTS_TABLE,
      KeyConditionExpression: 'scriptId = :scriptId',
      ExpressionAttributeValues: {
        ':scriptId': scriptId,
      },
      ScanIndexForward: false, // newest first
    })
  );

  const items = (result.Items as Comment[]) || [];

  // Sort by createdAt descending
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const total = items.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const comments = items.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return { comments, total, hasMore };
}

// ============ REACTIONS ============

export async function getReaction(
  scriptId: string,
  deviceId: string
): Promise<Reaction | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: REACTIONS_TABLE,
      Key: { scriptId, deviceId },
    })
  );

  return (result.Item as Reaction) || null;
}

export async function setReaction(
  scriptId: string,
  deviceId: string,
  reaction: 'LIKE' | 'DISLIKE'
): Promise<Reaction> {
  const now = new Date().toISOString();
  const reactionRecord: Reaction = {
    scriptId,
    deviceId,
    reaction,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: REACTIONS_TABLE,
      Item: reactionRecord,
    })
  );

  return reactionRecord;
}

export async function deleteReaction(scriptId: string, deviceId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: REACTIONS_TABLE,
      Key: { scriptId, deviceId },
    })
  );
}

// ============ OTP ============

export async function createOTP(
  mobile: string,
  otpHash: string
): Promise<OTPRecord> {
  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + 300; // 5 minutes TTL

  const otpRecord: OTPRecord = {
    otpId: uuidv4(),
    mobile,
    otpHash,
    attempts: 0,
    verified: false,
    createdAt: now.toISOString(),
    expiresAt,
  };

  await docClient.send(
    new PutCommand({
      TableName: OTP_TABLE,
      Item: otpRecord,
    })
  );

  return otpRecord;
}

export async function getOTP(otpId: string): Promise<OTPRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: OTP_TABLE,
      Key: { otpId },
    })
  );

  return (result.Item as OTPRecord) || null;
}

export async function incrementOTPAttempts(otpId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: OTP_TABLE,
      Key: { otpId },
      UpdateExpression: 'SET attempts = attempts + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
    })
  );
}

export async function markOTPVerified(otpId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: OTP_TABLE,
      Key: { otpId },
      UpdateExpression: 'SET verified = :verified',
      ExpressionAttributeValues: {
        ':verified': true,
      },
    })
  );
}

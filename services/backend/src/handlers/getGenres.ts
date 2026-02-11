import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../utils/response';
import { GENRES } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return success({
    genres: GENRES,
  });
}

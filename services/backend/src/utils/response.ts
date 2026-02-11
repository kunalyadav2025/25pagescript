import { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export function success<T>(data: T): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function created<T>(data: T): APIGatewayProxyResult {
  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function badRequest(message: string): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function unauthorized(message: string = 'Unauthorized'): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function forbidden(message: string = 'Forbidden'): APIGatewayProxyResult {
  return {
    statusCode: 403,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function notFound(message: string = 'Not found'): APIGatewayProxyResult {
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function conflict(message: string): APIGatewayProxyResult {
  return {
    statusCode: 409,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function serverError(message: string = 'Internal server error'): APIGatewayProxyResult {
  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function parseBody<T>(body: string | null): T | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

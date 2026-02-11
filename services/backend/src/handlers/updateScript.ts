import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getScriptById, updateScriptMetadata } from '../services/dynamodb';
import { getSignedPDFUrl } from '../services/s3';
import { verifyVerificationToken } from '../services/sms';
import { success, badRequest, unauthorized, forbidden, notFound, serverError, parseBody } from '../utils/response';
import { UpdateScriptRequest, GENRES } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const scriptId = event.pathParameters?.id;
    if (!scriptId) {
      return badRequest('Script ID is required');
    }

    const body = parseBody<UpdateScriptRequest>(event.body);
    if (!body) {
      return badRequest('Invalid request body');
    }

    const { verificationToken, writerMobile } = body;

    if (!verificationToken || !writerMobile) {
      return badRequest('verificationToken and writerMobile are required');
    }

    // Verify the token is valid for the provided mobile
    if (!verifyVerificationToken(verificationToken, writerMobile)) {
      return unauthorized('Invalid or expired verification token. Please verify your mobile number again.');
    }

    // Fetch the existing script
    const existingScript = await getScriptById(scriptId);
    if (!existingScript || existingScript.status !== 'PUBLISHED') {
      return notFound('Script not found');
    }

    // Check ownership: verified mobile must match the script's writer mobile
    if (existingScript.writer.mobile !== writerMobile) {
      return forbidden('You are not authorized to edit this script. Mobile number does not match the script owner.');
    }

    // Validate update fields
    if (body.genre && !GENRES.includes(body.genre)) {
      return badRequest(`Invalid genre. Must be one of: ${GENRES.join(', ')}`);
    }

    if (body.logline && body.logline.length > 200) {
      return badRequest('Logline must be 200 characters or less');
    }

    if (body.title !== undefined && !body.title.trim()) {
      return badRequest('Title cannot be empty');
    }

    if (body.logline !== undefined && !body.logline.trim()) {
      return badRequest('Logline cannot be empty');
    }

    if (body.synopsis !== undefined && !body.synopsis.trim()) {
      return badRequest('Synopsis cannot be empty');
    }

    if (body.hasCopyright === true && !body.copyrightNumber) {
      return badRequest('Copyright certificate number is required when copyright is selected');
    }

    // Build update payload (only include provided fields)
    const updates: Parameters<typeof updateScriptMetadata>[1] = {};

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.logline !== undefined) updates.logline = body.logline.trim();
    if (body.synopsis !== undefined) updates.synopsis = body.synopsis.trim();
    if (body.genre !== undefined) updates.genre = body.genre;
    if (body.language !== undefined) updates.language = body.language;
    if (body.hasCopyright !== undefined) {
      updates.copyright = {
        hasCertificate: body.hasCopyright,
        certificateNumber: body.hasCopyright ? body.copyrightNumber : undefined,
      };
    }

    if (Object.keys(updates).length === 0) {
      return badRequest('No fields to update');
    }

    // Perform the update
    const updatedScript = await updateScriptMetadata(scriptId, updates);
    if (!updatedScript) {
      return serverError('Failed to update script');
    }

    // Generate signed PDF URL
    let pdfUrl: string | undefined;
    if (updatedScript.scriptFileS3Key) {
      try {
        pdfUrl = await getSignedPDFUrl(updatedScript.scriptFileS3Key);
      } catch (error) {
        console.warn('Failed to generate PDF URL:', error);
      }
    }

    return success({ ...updatedScript, pdfUrl });
  } catch (error) {
    console.error('Error updating script:', error);
    return serverError('Failed to update script');
  }
}

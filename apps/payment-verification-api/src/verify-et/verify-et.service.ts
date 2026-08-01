import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { VerifyEtNormalizedResult } from '@payment-verification/types';

@Injectable()
export class VerifyEtService {
  private readonly logger = new Logger(VerifyEtService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('VERIFY_ET_BASE_URL') || 'https://verify.et';
    this.apiKey = this.configService.get<string>('VERIFY_ET_API_KEY') || '';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
  }

  /**
   * Verify a transaction reference via Verify.ET API (https://verify.et/docs/api).
   * Supports HTTP 202 Queued polling loop and array payload normalization.
   */
  async verifyPayment(
    bank: string,
    referenceNumber: string,
    accountSuffix?: string,
    waitMs = 5000,
  ): Promise<VerifyEtNormalizedResult> {
    const formattedBank = bank.toLowerCase();
    const cleanRef = referenceNumber.trim();

    const payload: Record<string, any> = {
      bank: formattedBank,
      referenceNumber: cleanRef,
      reference: cleanRef,
    };

    // Include accountSuffix / suffix for CBE and BOA if provided
    if ((formattedBank === 'cbe' || formattedBank === 'boa') && accountSuffix) {
      payload.accountSuffix = accountSuffix.trim();
      payload.suffix = accountSuffix.trim();
    }

    // Strict Check: Ensure VERIFY_ET_API_KEY is configured
    if (!this.apiKey || this.apiKey === 'mock-verify-et-api-key' || this.apiKey === 'YOUR_API_KEY_HERE') {
      const errorMsg = `VERIFY_ET_API_KEY is missing or unconfigured in .env file. Real deposit verification cannot proceed.`;
      this.logger.error(`[Verify.ET Error] ${errorMsg}`);
      return {
        verified: false,
        amount: 0,
        reason: errorMsg,
        settlementMatch: false,
        confirmedBefore: false,
        raw: { error: errorMsg, apiKeyConfigured: false },
      };
    }

    const requestUrl = `${this.baseUrl}/api/verify?waitMs=${waitMs}`;
    const maskedKey = this.apiKey.length > 8 ? `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}` : '***';
    const idempotencyKey = `verify-${cleanRef}-${Date.now()}`;

    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    };

    // Log full outgoing HTTPS request details per Verify.ET API documentation
    this.logger.log(`================================================================================`);
    this.logger.log(`[Verify.ET Request Outgoing] POST ${requestUrl}`);
    this.logger.log(`[Verify.ET Request Headers] x-api-key: ${maskedKey}`);
    this.logger.log(`[Verify.ET Request Headers] Idempotency-Key: ${idempotencyKey}`);
    this.logger.log(`[Verify.ET Request Payload] ${JSON.stringify(payload, null, 2)}`);
    this.logger.log(`================================================================================`);

    const startTime = Date.now();
    try {
      const response = await this.httpClient.post(`/api/verify?waitMs=${waitMs}`, payload, { headers });
      const durationMs = Date.now() - startTime;

      this.logger.log(`================================================================================`);
      this.logger.log(`[Verify.ET Response Incoming] HTTP ${response.status} (${durationMs}ms)`);
      this.logger.log(`[Verify.ET Response Data] ${JSON.stringify(response.data, null, 2)}`);
      this.logger.log(`================================================================================`);

      // Handle 202 Queued Response by polling statusUrl until completion
      if (response.status === 202 || response.data?.verification?.processingStatus === 'queued') {
        const requestId = response.data?.requestId || response.data?.verification?.requestId;
        if (requestId) {
          return await this.pollVerificationUntilComplete(requestId, response.data);
        }
      }

      return this.normalizeResponse(response.data);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errorResponse = error?.response?.data || { message: error?.message || 'Network/Server Error' };

      this.logger.error(`================================================================================`);
      this.logger.error(
        `[Verify.ET Response Error] HTTP ${error?.response?.status || 500} (${durationMs}ms): ${error?.message}`,
      );
      this.logger.error(`[Verify.ET Response Error Body] ${JSON.stringify(errorResponse, null, 2)}`);
      this.logger.error(`================================================================================`);

      return {
        verified: false,
        amount: 0,
        reason: errorResponse?.message || errorResponse?.error || error?.message || 'Verification service communication error',
        settlementMatch: false,
        confirmedBefore: false,
        raw: errorResponse,
      };
    }
  }

  /**
   * Poll status endpoint GET /api/verify/:requestId when Verify.ET returns HTTP 202 Queued.
   */
  private async pollVerificationUntilComplete(requestId: string, initialResponse: any): Promise<VerifyEtNormalizedResult> {
    const maxPollAttempts = 8;
    const pollIntervalMs = initialResponse?.links?.pollAfterMs || 1500;

    this.logger.log(`[Verify.ET Queue Poller] Starting status poll for requestId=${requestId} (interval: ${pollIntervalMs}ms)`);

    for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      try {
        const pollResponse = await this.httpClient.get(`/api/verify/${requestId}`, {
          headers: { 'x-api-key': this.apiKey },
        });

        this.logger.log(`[Verify.ET Poll Attempt ${attempt}/${maxPollAttempts}] Status: ${pollResponse.data?.verification?.processingStatus || pollResponse.data?.processingStatus || 'running'}`);
        this.logger.log(`[Verify.ET Poll Response Data] ${JSON.stringify(pollResponse.data, null, 2)}`);

        const data = pollResponse.data;
        const processingStatus = data?.verification?.processingStatus || data?.data?.processingStatus || data?.processingStatus;

        if (processingStatus === 'completed' || processingStatus === 'success' || data?.data?.verified || data?.verification?.verified) {
          return this.normalizeResponse(data);
        }
      } catch (pollErr: any) {
        this.logger.error(`[Verify.ET Poll Error] Attempt ${attempt} failed: ${pollErr?.message}`);
      }
    }

    // If max polling attempts reached without completion, return queued status
    return this.normalizeResponse(initialResponse);
  }

  /**
   * Fetch status for an existing verification request ID.
   */
  async getVerificationStatus(requestId: string): Promise<VerifyEtNormalizedResult> {
    if (!this.apiKey || this.apiKey === 'mock-verify-et-api-key') {
      return {
        verified: false,
        amount: 0,
        requestId,
        reason: 'VERIFY_ET_API_KEY not configured',
        settlementMatch: false,
        confirmedBefore: false,
      };
    }

    const requestUrl = `${this.baseUrl}/api/verify/${requestId}`;
    this.logger.log(`[Verify.ET Request Status] GET ${requestUrl}`);

    try {
      const response = await this.httpClient.get(`/api/verify/${requestId}`, {
        headers: { 'x-api-key': this.apiKey },
      });
      this.logger.log(`[Verify.ET Response Status Data] ${JSON.stringify(response.data, null, 2)}`);
      return this.normalizeResponse(response.data);
    } catch (error: any) {
      this.logger.error(`[Verify.ET Status Error] GET ${requestUrl}: ${error?.message}`);
      return {
        verified: false,
        amount: 0,
        requestId,
        reason: error?.response?.data?.message || 'Status check failed',
        settlementMatch: false,
        confirmedBefore: false,
      };
    }
  }

  /**
   * Normalizes raw response from Verify.ET into standardized internal domain result.
   * Handles both object and array response envelopes per official docs.
   */
  normalizeResponse(rawResponse: any): VerifyEtNormalizedResult {
    if (!rawResponse || rawResponse.success === false) {
      return {
        verified: false,
        amount: 0,
        reason: rawResponse?.error || rawResponse?.message || 'Verification rejected by Verify.ET',
        settlementMatch: false,
        confirmedBefore: false,
        raw: rawResponse,
      };
    }

    // Extract item from data array or data object
    let item: any = rawResponse;
    if (Array.isArray(rawResponse.data) && rawResponse.data.length > 0) {
      item = rawResponse.data[0];
    } else if (rawResponse.data && typeof rawResponse.data === 'object') {
      item = rawResponse.data;
    }

    const isVerified = Boolean(item.verified || rawResponse.verification?.verified);
    const settlementMatch = item.settlementAccountMatch?.matched ?? true;
    const confirmedBefore = Boolean(item.confirmationHistory?.confirmedBefore);

    let reason: string | undefined;
    if (!isVerified) {
      const processingStatus = rawResponse.verification?.processingStatus || rawResponse.processingStatus;
      if (processingStatus === 'queued' || processingStatus === 'pending') {
        reason = `Payment verification queued/pending with bank (requestId: ${rawResponse.requestId})`;
      } else {
        reason = 'Payment transaction reference could not be verified with bank';
      }
    } else if (!settlementMatch) {
      reason = 'Payment settlement account does not match expected merchant account';
    } else if (confirmedBefore) {
      reason = 'Payment reference number has already been confirmed/claimed previously';
    }

    return {
      verified: isVerified && settlementMatch && !confirmedBefore,
      amount: Number(item.amount) || Number(rawResponse.amount) || 0,
      payerName: item.senderName || item.payerName || item.receiverName,
      requestId: rawResponse.requestId || rawResponse.verification?.requestId || item.requestId,
      transactionTime: item.timestamp || item.transactionTime,
      reason,
      settlementMatch,
      confirmedBefore,
      raw: rawResponse,
    };
  }
}

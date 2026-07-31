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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Verify a transaction reference via Verify.ET API (https://verify.et/docs/api).
   * EVERY call makes an actual HTTPS POST request to ${VERIFY_ET_BASE_URL}/api/verify.
   */
  async verifyPayment(
    bank: string,
    referenceNumber: string,
    accountSuffix?: string,
    waitMs = 5000,
  ): Promise<VerifyEtNormalizedResult> {
    const formattedBank = bank.toLowerCase();

    const payload: Record<string, any> = {
      bank: formattedBank,
      reference: referenceNumber.trim(),
      waitMs,
    };

    // Include accountSuffix for CBE and BOA if provided
    if ((formattedBank === 'cbe' || formattedBank === 'boa') && accountSuffix) {
      payload.accountSuffix = accountSuffix.trim();
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

    const requestUrl = `${this.baseUrl}/api/verify`;
    const maskedKey = this.apiKey.length > 8 ? `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}` : '***';

    // Log full outgoing HTTPS request details to console & server logs
    this.logger.log(`================================================================================`);
    this.logger.log(`[Verify.ET Request Outgoing] POST ${requestUrl}`);
    this.logger.log(`[Verify.ET Request Headers] Authorization: Bearer ${maskedKey}`);
    this.logger.log(`[Verify.ET Request Payload] ${JSON.stringify(payload, null, 2)}`);
    this.logger.log(`================================================================================`);

    const startTime = Date.now();
    try {
      const response = await this.httpClient.post('/api/verify', payload);
      const durationMs = Date.now() - startTime;

      // Log full incoming HTTPS response details
      this.logger.log(`================================================================================`);
      this.logger.log(`[Verify.ET Response Incoming] HTTP ${response.status} (${durationMs}ms)`);
      this.logger.log(`[Verify.ET Response Data] ${JSON.stringify(response.data, null, 2)}`);
      this.logger.log(`================================================================================`);

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
      const response = await this.httpClient.get(`/api/verify/${requestId}`);
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

    const data = rawResponse.data || rawResponse;
    const isVerified = Boolean(data.verified);
    const settlementMatch = data.settlementAccountMatch?.matched ?? true;
    const confirmedBefore = Boolean(data.confirmationHistory?.confirmedBefore);

    let reason: string | undefined;
    if (!isVerified) {
      reason = 'Payment transaction reference could not be verified with bank by Verify.ET';
    } else if (!settlementMatch) {
      reason = 'Payment settlement account does not match expected merchant account';
    } else if (confirmedBefore) {
      reason = 'Payment reference number has already been confirmed/claimed previously';
    }

    return {
      verified: isVerified && settlementMatch && !confirmedBefore,
      amount: Number(data.amount) || 0,
      payerName: data.payerName || data.senderName,
      requestId: rawResponse.requestId || data.requestId,
      transactionTime: data.transactionTime,
      reason,
      settlementMatch,
      confirmedBefore,
      raw: rawResponse,
    };
  }
}

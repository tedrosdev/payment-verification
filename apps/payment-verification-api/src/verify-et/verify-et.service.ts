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
      timeout: 10000,
    });
  }

  /**
   * Verify a transaction reference via Verify.ET API.
   * Handles bank-specific payload normalization (CBE/BOA need accountSuffix, Telebirr does not).
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
      payload.accountSuffix = accountSuffix;
    }

    // In local development or mock mode without real Verify.ET API key
    if (!this.apiKey || this.apiKey === 'mock-verify-et-api-key') {
      return this.handleMockVerification(bank, referenceNumber, accountSuffix);
    }

    try {
      const response = await this.httpClient.post('/api/verify', payload);
      return this.normalizeResponse(response.data);
    } catch (error: any) {
      this.logger.error(`Verify.ET API call failed: ${error?.message}`, error?.response?.data);

      return {
        verified: false,
        amount: 0,
        reason: error?.response?.data?.message || error?.message || 'Verification service communication error',
        settlementMatch: false,
        confirmedBefore: false,
        raw: error?.response?.data || { error: error?.message },
      };
    }
  }

  /**
   * Fetch status for an existing verification request ID.
   */
  async getVerificationStatus(requestId: string): Promise<VerifyEtNormalizedResult> {
    if (!this.apiKey || this.apiKey === 'mock-verify-et-api-key') {
      return {
        verified: true,
        amount: 500,
        requestId,
        settlementMatch: true,
        confirmedBefore: false,
      };
    }

    try {
      const response = await this.httpClient.get(`/api/verify/${requestId}`);
      return this.normalizeResponse(response.data);
    } catch (error: any) {
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
      reason = 'Payment transaction could not be verified with bank';
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

  /**
   * Mock fallback generator for test/dev environments.
   */
  private handleMockVerification(
    bank: string,
    referenceNumber: string,
    accountSuffix?: string,
  ): VerifyEtNormalizedResult {
    const refUpper = referenceNumber.toUpperCase();

    if (refUpper.includes('INVALID') || refUpper.includes('FAIL')) {
      return {
        verified: false,
        amount: 0,
        reason: 'Payment reference number is invalid or not found',
        settlementMatch: false,
        confirmedBefore: false,
      };
    }

    if (refUpper.includes('MISMATCH')) {
      return {
        verified: false,
        amount: 500,
        reason: 'Payment settlement account does not match expected merchant account',
        settlementMatch: false,
        confirmedBefore: false,
      };
    }

    if (refUpper.includes('USED') || refUpper.includes('DUP')) {
      return {
        verified: false,
        amount: 500,
        reason: 'Payment reference number has already been confirmed/claimed previously',
        settlementMatch: true,
        confirmedBefore: true,
      };
    }

    // Default mock success (e.g. 500 ETB for standard reference numbers)
    return {
      verified: true,
      amount: 500,
      payerName: 'Sample Customer',
      requestId: `mock_req_${Date.now()}`,
      transactionTime: new Date().toISOString(),
      settlementMatch: true,
      confirmedBefore: false,
      raw: { mock: true, bank, referenceNumber, accountSuffix },
    };
  }
}

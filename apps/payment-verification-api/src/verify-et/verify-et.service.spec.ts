import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VerifyEtService } from './verify-et.service';

describe('VerifyEtService', () => {
  let service: VerifyEtService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'VERIFY_ET_BASE_URL') return 'https://verify.et';
      if (key === 'VERIFY_ET_API_KEY') return 'test-key-123';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEtService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<VerifyEtService>(VerifyEtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeResponse', () => {
    it('should correctly normalize successful verification', () => {
      const raw = {
        success: true,
        requestId: 'req_001',
        data: {
          verified: true,
          amount: 1000,
          payerName: 'Abebe Bikila',
          transactionTime: '2026-07-31T10:00:00Z',
          settlementAccountMatch: { matched: true },
          confirmationHistory: { confirmedBefore: false },
        },
      };

      const result = service.normalizeResponse(raw);
      expect(result.verified).toBe(true);
      expect(result.amount).toBe(1000);
      expect(result.payerName).toBe('Abebe Bikila');
      expect(result.requestId).toBe('req_001');
      expect(result.settlementMatch).toBe(true);
      expect(result.confirmedBefore).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should handle verified: false branch per BUSINESS_RULES', () => {
      const raw = {
        success: true,
        requestId: 'req_002',
        data: {
          verified: false,
          amount: 0,
          settlementAccountMatch: { matched: true },
          confirmationHistory: { confirmedBefore: false },
        },
      };

      const result = service.normalizeResponse(raw);
      expect(result.verified).toBe(false);
      expect(result.reason).toContain('could not be verified');
    });

    it('should handle settlementAccountMatch.matched: false branch per BUSINESS_RULES', () => {
      const raw = {
        success: true,
        requestId: 'req_003',
        data: {
          verified: true,
          amount: 500,
          settlementAccountMatch: { matched: false },
          confirmationHistory: { confirmedBefore: false },
        },
      };

      const result = service.normalizeResponse(raw);
      expect(result.verified).toBe(false);
      expect(result.settlementMatch).toBe(false);
      expect(result.reason).toContain('settlement account does not match');
    });

    it('should handle confirmationHistory.confirmedBefore: true branch per BUSINESS_RULES', () => {
      const raw = {
        success: true,
        requestId: 'req_004',
        data: {
          verified: true,
          amount: 500,
          settlementAccountMatch: { matched: true },
          confirmationHistory: { confirmedBefore: true },
        },
      };

      const result = service.normalizeResponse(raw);
      expect(result.verified).toBe(false);
      expect(result.confirmedBefore).toBe(true);
      expect(result.reason).toContain('already been confirmed/claimed');
    });
  });
});

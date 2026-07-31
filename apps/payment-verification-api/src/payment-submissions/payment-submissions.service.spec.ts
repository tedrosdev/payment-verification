import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSubmissionsService } from './payment-submissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyEtService } from '../verify-et/verify-et.service';
import { generateTicketCode } from '../tickets/tickets.service';
import { SubmissionStatus, BankType } from '@payment-verification/types';

describe('PaymentSubmissionsService & Ticket Code Logic', () => {
  let service: PaymentSubmissionsService;
  let prisma: PrismaService;
  let verifyEtService: VerifyEtService;

  const mockPrisma = {
    batch: {
      findUnique: jest.fn(),
    },
    paymentSubmission: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    settlementAccount: {
      findUnique: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockVerifyEtService = {
    verifyPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentSubmissionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VerifyEtService, useValue: mockVerifyEtService },
      ],
    }).compile();

    service = module.get<PaymentSubmissionsService>(PaymentSubmissionsService);
    prisma = module.get<PrismaService>(PrismaService);
    verifyEtService = module.get<VerifyEtService>(VerifyEtService);
    jest.clearAllMocks();
  });

  describe('generateTicketCode', () => {
    it('should generate sequential ticket codes starting from AA01', () => {
      expect(generateTicketCode(1)).toBe('AA01');
      expect(generateTicketCode(2)).toBe('AA02');
      expect(generateTicketCode(99)).toBe('AA99');
      expect(generateTicketCode(100)).toBe('AB01');
      expect(generateTicketCode(198)).toBe('AB99');
      expect(generateTicketCode(199)).toBe('AC01');
    });
  });

  describe('submitAndVerify', () => {
    it('should handle local duplicate check without calling Verify.ET', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue({
        id: 'batch-1',
        name: 'Test Batch',
        ticketPrice: 100,
        status: 'ACTIVE',
      });

      mockPrisma.paymentSubmission.findFirst.mockResolvedValue({
        id: 'sub-existing',
        batchId: 'batch-1',
        bank: 'CBE',
        referenceNumber: 'FT123',
        participantPhone: '0911223344',
        amount: 500,
        status: 'VERIFIED' as const,
        createdAt: new Date(),
        tickets: [{ id: 't1', code: 'AA01', createdAt: new Date() }],
      });

      const result = await service.submitAndVerify(
        {
          batchId: 'batch-1',
          bank: 'CBE' as const,
          referenceNumber: 'FT123',
          participantPhone: '0911223344',
        },
        'admin-1',
      );

      expect(result.status).toBe('DUPLICATE');
      expect(mockVerifyEtService.verifyPayment).not.toHaveBeenCalled();
    });

    it('should perform ticket price math and issue tickets on verification success', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue({
        id: 'batch-1',
        name: 'Test Batch',
        ticketPrice: 100,
        status: 'ACTIVE',
      });

      mockPrisma.paymentSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.settlementAccount.findUnique.mockResolvedValue({
        bank: 'CBE',
        accountNumber: '1000123',
        accountSuffix: '0123',
        isActive: true,
      });

      mockVerifyEtService.verifyPayment.mockResolvedValue({
        verified: true,
        amount: 300,
        payerName: 'John Doe',
        requestId: 'req-100',
        settlementMatch: true,
        confirmedBefore: false,
      });

      mockPrisma.ticket.findFirst.mockResolvedValue(null); // start ticketNumber = 1
      mockPrisma.paymentSubmission.create.mockResolvedValue({
        id: 'sub-new',
        batchId: 'batch-1',
        bank: 'CBE',
        referenceNumber: 'FT999',
        participantPhone: '0911223344',
        participantName: 'John Doe',
        amount: 300,
        status: 'VERIFIED' as const,
        verifyEtRequestId: 'req-100',
        createdAt: new Date(),
      });

      mockPrisma.ticket.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.ticket.findMany.mockResolvedValue([
        { id: 't1', code: 'AA01', ticketNumber: 1, createdAt: new Date() },
      ]);

      const result = await service.submitAndVerify(
        {
          batchId: 'batch-1',
          bank: 'CBE' as const,
          referenceNumber: 'FT999',
          participantPhone: '0911223344',
        },
        'admin-1',
      );

      expect(result.status).toBe('VERIFIED');
      expect(result.tickets.length).toBe(1);
      expect(result.tickets[0].code).toBe('AA01');
    });

    it('should reject submission if deposited amount is less than batch ticket price', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue({
        id: 'batch-1',
        name: 'Test Batch',
        ticketPrice: 200,
        status: 'ACTIVE',
      });

      mockPrisma.paymentSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.settlementAccount.findUnique.mockResolvedValue({
        bank: 'CBE',
        accountNumber: '1000123',
        accountSuffix: '0123',
        isActive: true,
      });

      mockVerifyEtService.verifyPayment.mockResolvedValue({
        verified: true,
        amount: 50, // 50 ETB < 200 ETB required
        payerName: 'Jane Doe',
        requestId: 'req-200',
        settlementMatch: true,
        confirmedBefore: false,
      });

      mockPrisma.paymentSubmission.create.mockResolvedValue({
        id: 'sub-rejected',
        batchId: 'batch-1',
        bank: 'CBE',
        referenceNumber: 'FT50',
        participantPhone: '0911223344',
        participantName: 'Jane Doe',
        amount: 50,
        status: 'REJECTED' as const,
        rejectionReason: 'Payment deposited amount (50 ETB) is less than required batch ticket price (200 ETB)',
        verifyEtRequestId: 'req-200',
        createdAt: new Date(),
      });

      const result = await service.submitAndVerify(
        {
          batchId: 'batch-1',
          bank: 'CBE' as const,
          referenceNumber: 'FT50',
          participantPhone: '0911223344',
        },
        'admin-1',
      );

      expect(result.status).toBe('REJECTED');
      expect(result.tickets.length).toBe(0);
      expect((result as any).rejectionReason).toContain('less than required batch ticket price');
    });
  });
});

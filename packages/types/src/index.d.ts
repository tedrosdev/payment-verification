export type BankType = 'CBE' | 'TELEBIRR' | 'BOA';
export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';
export type BatchStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type SubmissionStatus = 'VERIFIED' | 'REJECTED' | 'DUPLICATE' | 'NEEDS_REVIEW';
export interface AdminDto {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    createdAt: string;
}
export interface AuthLoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AdminDto;
}
export interface SettlementAccountDto {
    id: string;
    bank: BankType;
    accountNumber: string;
    accountSuffix?: string;
    accountHolderName?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateSettlementAccountDto {
    bank: BankType;
    accountNumber: string;
    accountSuffix?: string;
    accountHolderName?: string;
    isActive?: boolean;
}
export interface BatchDto {
    id: string;
    name: string;
    ticketPrice: number;
    status: BatchStatus;
    description?: string;
    totalSubmissions?: number;
    totalVerifiedSubmissions?: number;
    totalTicketsIssued?: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateBatchDto {
    name: string;
    ticketPrice: number;
    description?: string;
}
export interface TicketDto {
    id: string;
    batchId: string;
    submissionId: string;
    code: string;
    ticketNumber: number;
    participantPhone: string;
    participantName?: string;
    createdAt: string;
}
export interface CreateSubmissionDto {
    batchId: string;
    bank: BankType;
    referenceNumber: string;
    participantPhone: string;
    participantName?: string;
}
export interface SubmissionResponseDto {
    id: string;
    batchId: string;
    bank: BankType;
    referenceNumber: string;
    participantPhone: string;
    participantName?: string;
    amount: number;
    status: SubmissionStatus;
    rejectionReason?: string;
    tickets: TicketDto[];
    verifyEtRequestId?: string;
    createdAt: string;
}
export interface VerifyEtRequestPayload {
    bank: string;
    reference: string;
    accountSuffix?: string;
    waitMs?: number;
}
export interface VerifyEtNormalizedResult {
    verified: boolean;
    amount: number;
    payerName?: string;
    requestId?: string;
    transactionTime?: string;
    reason?: string;
    settlementMatch: boolean;
    confirmedBefore: boolean;
    raw?: Record<string, unknown>;
}
export interface DashboardStatsDto {
    activeBatchesCount: number;
    totalSubmissionsCount: number;
    verifiedSubmissionsCount: number;
    totalTicketsIssuedCount: number;
    recentSubmissions: SubmissionResponseDto[];
}

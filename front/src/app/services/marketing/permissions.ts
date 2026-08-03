// ============================================================
// MARKETING AGENT — PERMISSIONS & GUARDRAILS
// Sensitive operations require human approval. AI may never
// change budget or publish a campaign without confirmation.
// ============================================================

export type AiAuthorityLevel = 'off' | 'suggest-only' | 'execute-with-approval' | 'autonomous';

export const AI_AUTHORITY_LABELS: Record<AiAuthorityLevel, string> = {
  'off': 'خاموش',
  'suggest-only': 'فقط پیشنهاد',
  'execute-with-approval': 'اجرا با تأیید مدیر',
  'autonomous': 'اجرای خودکار',
};

// Default authority for sensitive operations
export const DEFAULT_AI_AUTHORITY: AiAuthorityLevel = 'execute-with-approval';

export type SensitiveOp =
  | 'bulk-message'
  | 'publish-campaign'
  | 'increase-budget'
  | 'pause-campaign'
  | 'segment-major-change'
  | 'external-report'
  | 'delete-lead'
  | 'lead-score-major-change'
  | 'autonomous-campaign'
  | 'sensitive-message';

export const SENSITIVE_OPS: Record<SensitiveOp, string> = {
  'bulk-message': 'ارسال پیام انبوه',
  'publish-campaign': 'انتشار کمپین',
  'increase-budget': 'افزایش بودجه',
  'pause-campaign': 'توقف کمپین',
  'segment-major-change': 'تغییر گسترده سگمنت',
  'external-report': 'ارسال گزارش خارجی',
  'delete-lead': 'حذف لید',
  'lead-score-major-change': 'تغییر مهم Lead Score',
  'autonomous-campaign': 'اجرای خودکار کمپین',
  'sensitive-message': 'ارسال پیام حساس',
};

export function isSensitive(op: SensitiveOp): boolean {
  return op in SENSITIVE_OPS;
}

/**
 * Whether an AI-initiated action of this op may execute directly.
 * With the default authority (execute-with-approval) sensitive ops
 * ALWAYS require human confirmation first.
 */
export function aiCanExecute(op: SensitiveOp, authority: AiAuthorityLevel = DEFAULT_AI_AUTHORITY): boolean {
  if (!isSensitive(op)) return true;
  return authority === 'autonomous';
}

/** Human-triggered sensitive ops still surface a confirmation modal. */
export function requiresConfirmation(op: SensitiveOp): boolean {
  return isSensitive(op);
}

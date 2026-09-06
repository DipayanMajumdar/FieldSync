import { getPendingSubmissions, updateSubmissionStatus } from './database';
import { submitProgress } from './api';

export const syncPendingSubmissions = async () => {
  const pending = await getPendingSubmissions();
  let synced = 0;
  let failed = 0;

  for (const submission of pending) {
    try {
      await submitProgress({
        idempotency_key: submission.idempotency_key,
        wbs_node_id: submission.wbs_node_id,
        pct_complete: submission.pct_complete,
        qty: submission.qty,
        notes: submission.notes,
        gps_lat: submission.gps_lat,
        gps_lng: submission.gps_lng,
        captured_at: submission.captured_at,
        device_id: submission.device_id,
      });
      await updateSubmissionStatus(submission.idempotency_key, 'synced');
      synced++;
    } catch (error: any) {
      await updateSubmissionStatus(
        submission.idempotency_key,
        'failed',
        error.message || 'Unknown error during sync'
      );
      failed++;
    }
  }

  return { synced, failed };
};


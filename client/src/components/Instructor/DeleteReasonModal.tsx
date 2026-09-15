'use client';
import { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import styles from './DeleteReasonModal.module.css';

interface DeleteReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  itemType: 'problem' | 'course';
  itemTitle: string;
}

export default function DeleteReasonModal({
  isOpen,
  onClose,
  onSubmit,
  itemType,
  itemTitle,
}: DeleteReasonModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Trash2 size={20} />
          </div>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>
              Request {itemType === 'problem' ? 'Problem' : 'Course'} Deletion
            </h3>
            <p className={styles.subtitle}>
              Instructors must provide a reason. Once submitted, an administrator will review and approve the permanent deletion.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.targetPill}>
            <span className={`${styles.badge} ${itemType === 'course' ? styles.badgeCourse : ''}`}>
              {itemType}
            </span>
            <span className={styles.targetTitle} title={itemTitle}>
              {itemTitle}
            </span>
          </div>

          <div className={styles.field}>
            <label htmlFor="delete-reason" className={styles.label}>
              Reason for Deletion <span style={{ color: '#ff7b72' }}>*</span>
            </label>
            <textarea
              id="delete-reason"
              className={styles.textarea}
              placeholder={`Explain why this ${itemType} should be removed (e.g., duplicated question, deprecated API, superseded by updated lesson)...`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              disabled={submitting}
              autoFocus
            />
            <div className={styles.charCount}>
              {reason.trim().length} / 5 chars min
            </div>
          </div>

          <div className={styles.notice}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              This item will remain in a <strong>Deletion Pending</strong> state until reviewed by an administrator.
            </span>
          </div>

          {error && (
            <div style={{ color: '#ff7b72', fontSize: '0.82rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || reason.trim().length < 5}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Deletion Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

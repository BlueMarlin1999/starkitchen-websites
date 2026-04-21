'use client';

import { useState } from 'react';
import { submitFeedback } from '@/lib/agents-api';

interface Props {
  sessionId: string;
  agentId: string;
  confidenceScore?: number;
  decisionLevel?: number;
  onFeedback?: (rating: number) => void;
}

function IconButton(props: {
  title: string;
  disabled: boolean;
  className: string;
  onClick: () => void;
  iconClassName: string;
}) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className={props.className}
      title={props.title}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className={props.iconClassName}>
        <path d="M8.834.066c.763.087 1.5.295 2.01.884.505.581.656 1.378.656 2.197 0 .472-.07.96-.166 1.453h2.916c.456 0 .891.184 1.21.516.313.327.49.781.472 1.25l-.36 7.077c-.064 1.27-1.105 2.307-2.372 2.307H5.75a.75.75 0 0 1-.75-.75V6.383l2.834-5.317a.75.75 0 0 1 .667-.416.75.75 0 0 1 .333.066ZM4 6.75H1.75a.75.75 0 0 0-.75.75v7.5c0 .414.336.75.75.75H4V6.75Z" />
      </svg>
    </button>
  );
}

function FeedbackInput(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <input
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') props.onSubmit();
      }}
      placeholder="可选：哪里不好？"
      className="ml-1 px-2 py-1 rounded-md bg-white/5 border border-white/10
                 text-white/60 text-xs w-40 focus:outline-none focus:border-white/25"
      autoFocus
    />
  );
}

function SubmittedFeedback({ submitted }: { submitted: number }) {
  return (
    <span className="text-white/25 text-xs">
      {submitted > 0 ? '👍' : '👎'} 已收到反馈
    </span>
  );
}

function FeedbackActions(props: {
  comment: string;
  showComment: boolean;
  setShowComment: (value: boolean) => void;
  setComment: (value: string) => void;
  submitting: boolean;
  submitRating: (rating: number, feedbackComment?: string) => Promise<void>;
}) {
  const commonClass = 'p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50';
  return (
    <div className="flex items-center gap-1">
      <IconButton
        onClick={() => props.submitRating(1)}
        disabled={props.submitting}
        className={`${commonClass} text-white/25 hover:text-emerald-400`}
        title="有帮助"
        iconClassName="w-3.5 h-3.5"
      />
      <IconButton
        onClick={() => {
          if (!props.showComment) {
            props.setShowComment(true);
          } else {
            void props.submitRating(-1, props.comment);
          }
        }}
        disabled={props.submitting}
        className={`${commonClass} text-white/25 hover:text-red-400`}
        title="需要改进"
        iconClassName="w-3.5 h-3.5 rotate-180"
      />
      {props.showComment && (
        <FeedbackInput
          value={props.comment}
          onChange={props.setComment}
          onSubmit={() => props.submitRating(-1, props.comment)}
        />
      )}
    </div>
  );
}

export function FeedbackButtons({
  sessionId,
  agentId,
  confidenceScore,
  decisionLevel,
  onFeedback,
}: Props) {
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRating = async (rating: number, feedbackComment?: string) => {
    setSubmitting(true);
    try {
      await submitFeedback({
        sessionId,
        agentId,
        rating,
        comment: feedbackComment,
        feedbackType: feedbackComment ? 'correction' : 'rating',
        confidenceScore,
        decisionLevel,
      });
      setSubmitted(rating);
      onFeedback?.(rating);
    } catch {
      // Silent fail — feedback is non-critical
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted !== null) return <SubmittedFeedback submitted={submitted} />;
  return (
    <FeedbackActions
      comment={comment}
      showComment={showComment}
      setShowComment={setShowComment}
      setComment={setComment}
      submitting={submitting}
      submitRating={submitRating}
    />
  );
}

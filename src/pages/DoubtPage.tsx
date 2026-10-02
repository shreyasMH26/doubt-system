import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, ThumbsDown, CheckCircle2, MessageSquare, Trash2, Flag, ChevronDown, ChevronUp, Sparkles, Loader2, ExternalLink, FileText, BookmarkCheck, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDoubtById, getAnswers, createAnswer, acceptAnswer,
  vote, getUserVote, deleteDoubt, deleteAnswer,
  getComments, createComment, deleteComment,
  toggleBookmark
} from '../services/doubtService';
import { submitReport } from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/ui/Avatar';
import { PageLoader } from '../components/ui/Skeleton';
import { timeAgo, formatDateTime, REPORT_REASONS } from '../lib/utils';
import type { Answer, Comment, Profile } from '../types';
import toast from 'react-hot-toast';

const AI_EXPLANATIONS = [
  "Let me break this down step by step:\n\n**Key Concept:** The core idea here involves applying fundamental principles systematically.\n\n1. First, identify what's given and what's unknown\n2. Choose the appropriate formula or approach\n3. Apply it carefully, checking units and signs\n4. Verify your answer makes sense\n\n**Tip:** Practice similar problems to strengthen your understanding.",
  "Great question! Here's a clear explanation:\n\nThe key is to understand the underlying concept rather than just memorizing steps. Think about *why* each step makes sense, and the solution will become intuitive.",
];

export function DoubtPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answerText, setAnswerText] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState<{ target: string; type: 'doubt' | 'answer' } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  const { data: doubt, isLoading } = useQuery({
    queryKey: ['doubt', id],
    queryFn: () => getDoubtById(id!),
    enabled: !!id,
  });

  const { data: answers = [], isLoading: loadingAnswers } = useQuery({
    queryKey: ['answers', id],
    queryFn: () => getAnswers(id!),
    enabled: !!id,
  });

  const postAnswerMutation = useMutation({
    mutationFn: () => createAnswer({ doubt_id: id!, author_id: profile!.id, content: answerText.trim() }),
    onSuccess: () => {
      setAnswerText('');
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      toast.success('Answer posted!');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to post answer'),
  });

  const handleVote = async (targetId: string, targetType: 'doubt' | 'answer', value: 1 | -1) => {
    if (!profile) { toast.error('Sign in to vote'); return; }
    await vote(profile.id, targetId, targetType, value);
    setUserVotes((prev) => ({ ...prev, [targetId]: prev[targetId] === value ? 0 : value }));
    queryClient.invalidateQueries({ queryKey: ['doubt', id] });
    queryClient.invalidateQueries({ queryKey: ['answers', id] });
  };

  const handleAccept = async (answerId: string) => {
    if (!doubt || doubt.author_id !== profile?.id) return;
    await acceptAnswer(answerId, id!);
    queryClient.invalidateQueries({ queryKey: ['doubt', id] });
    queryClient.invalidateQueries({ queryKey: ['answers', id] });
    toast.success('Answer accepted!');
  };

  const handleDeleteDoubt = async () => {
    if (!confirm('Delete this doubt? This cannot be undone.')) return;
    await deleteDoubt(id!);
    toast.success('Doubt deleted');
    navigate('/dashboard');
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm('Delete this answer?')) return;
    await deleteAnswer(answerId);
    queryClient.invalidateQueries({ queryKey: ['answers', id] });
    toast.success('Answer deleted');
  };

  const handleBookmark = async () => {
    if (!profile) { toast.error('Sign in to bookmark'); return; }
    const added = await toggleBookmark(profile.id, id!);
    setIsBookmarked(added);
    toast.success(added ? 'Bookmarked!' : 'Removed');
  };

  const handleReport = async () => {
    if (!profile || !reportOpen || !reportReason) return;
    await submitReport({
      reporter_id: profile.id,
      target_id: reportOpen.target,
      target_type: reportOpen.type,
      reason: reportReason as 'spam',
    });
    toast.success('Report submitted. Thank you.');
    setReportOpen(null);
    setReportReason('');
  };

  const handleAI = async () => {
    if (!doubt) return;
    setShowAI(true);
    setAiLoading(true);
    setAiResponse('');

    // Simulate AI response (replace with real Gemini/OpenAI API call via edge function)
    await new Promise((r) => setTimeout(r, 1500));
    setAiResponse(AI_EXPLANATIONS[Math.floor(Math.random() * AI_EXPLANATIONS.length)]);
    setAiLoading(false);
  };

  if (isLoading) return <PageLoader />;
  if (!doubt) return (
    <div className="card p-12 text-center">
      <div className="text-4xl mb-3">🤷</div>
      <p className="font-medium text-zinc-700 dark:text-zinc-300">Doubt not found</p>
      <Link to="/explore" className="btn-primary mt-4 text-sm">Browse Doubts</Link>
    </div>
  );

  const isAuthor = profile?.id === doubt.author_id;
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Doubt header */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`badge ${doubt.status === 'resolved' ? 'badge-green' : 'badge-indigo'}`}>{doubt.status}</span>
          <span className="badge badge-zinc">{doubt.subject}</span>
          {doubt.branch && <span className="badge badge-zinc">{doubt.branch}</span>}
          {doubt.semester && <span className="badge badge-zinc">Sem {doubt.semester}</span>}
          {doubt.tags.map((t) => <span key={t} className="badge badge-zinc">{t}</span>)}
        </div>

        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-snug">{doubt.title}</h1>

        <div className="flex items-center gap-3 mb-4 text-xs text-zinc-400">
          {doubt.author && (
            <Link to={`/profile/${doubt.author.id}`} className="flex items-center gap-2 hover:text-zinc-600 dark:hover:text-zinc-200">
              <Avatar src={doubt.author.avatar_url} name={doubt.author.full_name || doubt.author.username} size="xs" />
              <span className="font-medium text-zinc-600 dark:text-zinc-300">{doubt.author.username}</span>
              <span className="text-indigo-500">{doubt.author.reputation} rep</span>
            </Link>
          )}
          <span>· {formatDateTime(doubt.created_at)}</span>
          <span>· {doubt.views} views</span>
        </div>

        <div className="prose-doubthub whitespace-pre-wrap mb-4">{doubt.description}</div>

        {/* Attachments */}
        {doubt.attachments && doubt.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {doubt.attachments.map((att) => (
              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 card p-2 text-xs text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {att.file_type.startsWith('image/') ? (
                  <img src={att.url} alt={att.file_name} className="h-8 w-8 rounded object-cover" />
                ) : <FileText size={16} />}
                <span className="truncate max-w-[120px]">{att.file_name}</span>
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleVote(doubt.id, 'doubt', 1)} className={`btn-ghost text-xs gap-1 ${userVotes[doubt.id] === 1 ? 'text-indigo-600' : ''}`}>
            <ThumbsUp size={13} /> {(doubt.vote_count ?? 0) + (userVotes[doubt.id] === 1 ? 1 : 0)}
          </button>
          <button onClick={() => handleVote(doubt.id, 'doubt', -1)} className={`btn-ghost text-xs gap-1 ${userVotes[doubt.id] === -1 ? 'text-red-500' : ''}`}>
            <ThumbsDown size={13} />
          </button>
          <button onClick={handleBookmark} className="btn-ghost text-xs gap-1">
            {isBookmarked ? <BookmarkCheck size={13} className="text-indigo-500" /> : <Bookmark size={13} />}
          </button>
          <button onClick={() => setReportOpen({ target: doubt.id, type: 'doubt' })} className="btn-ghost text-xs gap-1 text-zinc-400">
            <Flag size={12} /> Report
          </button>
          {(isAuthor || isAdmin) && (
            <button onClick={handleDeleteDoubt} className="btn-ghost text-xs gap-1 text-red-400 hover:text-red-600 ml-auto">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* AI Assist */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Sparkles size={15} className="text-indigo-500" /> AI Assistant
          </div>
          {!showAI && (
            <button onClick={handleAI} className="btn-secondary text-xs gap-1.5">
              <Sparkles size={12} /> Ask AI
            </button>
          )}
        </div>
        <AnimatePresence>
          {showAI && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 size={14} className="animate-spin" /> Thinking…
                </div>
              ) : (
                <div className="prose-doubthub bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Answers */}
      <section>
        <h2 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
          <MessageSquare size={15} /> {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>

        {loadingAnswers ? <PageLoader /> : answers.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-zinc-400">No answers yet. Looks like this one is still waiting for a solution.</p>
            {profile && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Be the first to answer! ↓</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                doubtAuthorId={doubt.author_id}
                profile={profile}
                isAdmin={isAdmin}
                onVote={handleVote}
                onAccept={handleAccept}
                onDelete={handleDeleteAnswer}
                onReport={(id) => setReportOpen({ target: id, type: 'answer' })}
                userVote={userVotes[answer.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* Post answer */}
      {profile && doubt.status !== 'closed' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Your Answer</h3>
          <textarea
            className="textarea mb-3"
            rows={5}
            placeholder="Write a clear, detailed answer…"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">{answerText.length}/5000</span>
            <button
              onClick={() => postAnswerMutation.mutate()}
              disabled={answerText.trim().length < 10 || postAnswerMutation.isPending}
              className="btn-primary text-sm"
            >
              {postAnswerMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Posting…</> : 'Post Answer'}
            </button>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card p-5 w-full max-w-sm animate-scale-in">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Report Content</h3>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input type="radio" name="reason" value={r.value} onChange={(e) => setReportReason(e.target.value)} />
                  {r.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setReportOpen(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleReport} disabled={!reportReason} className="btn-destructive text-xs">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Answer Card ----
function AnswerCard({
  answer, doubtAuthorId, profile, isAdmin, onVote, onAccept, onDelete, onReport, userVote
}: {
  answer: Answer;
  doubtAuthorId: string;
  profile: Profile | null;
  isAdmin: boolean;
  onVote: (id: string, type: 'answer', v: 1 | -1) => void;
  onAccept: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  userVote: number;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', answer.id],
    queryFn: () => getComments(answer.id),
    enabled: showComments,
  });

  const postComment = async () => {
    if (!profile || !commentText.trim()) return;
    await createComment({ answer_id: answer.id, author_id: profile.id, content: commentText.trim() });
    setCommentText('');
    queryClient.invalidateQueries({ queryKey: ['comments', answer.id] });
  };

  const author = answer.author;
  const canAccept = profile?.id === doubtAuthorId && !answer.is_accepted;
  const canDelete = profile?.id === answer.author_id || isAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-5 ${answer.is_accepted ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10' : ''}`}
    >
      {answer.is_accepted && (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium mb-3">
          <CheckCircle2 size={14} /> Accepted Answer
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {author && (
          <>
            <Avatar src={author.avatar_url} name={author.full_name || author.username} size="sm" />
            <div>
              <Link to={`/profile/${author.id}`} className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:text-indigo-600">
                {author.username}
              </Link>
              <p className="text-[10px] text-zinc-400">{author.reputation} rep · {timeAgo(answer.created_at)}</p>
            </div>
          </>
        )}
      </div>

      <div className="prose-doubthub whitespace-pre-wrap mb-4">{answer.content}</div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => onVote(answer.id, 'answer', 1)} className={`btn-ghost text-xs gap-1 ${userVote === 1 ? 'text-indigo-600' : ''}`}>
          <ThumbsUp size={12} /> {(answer.vote_count ?? 0) + (userVote === 1 ? 1 : 0)}
        </button>
        <button onClick={() => onVote(answer.id, 'answer', -1)} className={`btn-ghost text-xs gap-1 ${userVote === -1 ? 'text-red-500' : ''}`}>
          <ThumbsDown size={12} />
        </button>
        {canAccept && (
          <button onClick={() => onAccept(answer.id)} className="btn-ghost text-xs gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 size={12} /> Accept
          </button>
        )}
        <button onClick={() => setShowComments(!showComments)} className="btn-ghost text-xs gap-1">
          <MessageSquare size={12} /> {answer.comment_count ?? 0} comments
          {showComments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        <button onClick={() => onReport(answer.id)} className="btn-ghost text-xs gap-1 text-zinc-400">
          <Flag size={11} />
        </button>
        {canDelete && (
          <button onClick={() => onDelete(answer.id)} className="btn-ghost text-xs gap-1 text-red-400 ml-auto">
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="space-y-3 mb-3">
              {comments.map((c: Comment) => (
                <div key={c.id} className="flex gap-2 text-xs">
                  {c.author && <Avatar src={c.author.avatar_url} name={c.author.full_name || c.author.username} size="xs" className="mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.author?.username}: </span>
                    <span className="text-zinc-600 dark:text-zinc-400">{c.content}</span>
                    <span className="text-zinc-300 dark:text-zinc-600 ml-2">{timeAgo(c.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            {profile && (
              <div className="flex gap-2">
                <input className="input text-xs flex-1" placeholder="Add a comment…" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') postComment(); }} />
                <button onClick={postComment} disabled={!commentText.trim()} className="btn-secondary text-xs px-3">Post</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

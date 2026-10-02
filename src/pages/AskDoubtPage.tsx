import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Plus, X, Upload, FileText, Image, Loader2, Search, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createDoubt, getSimilarDoubts } from '../services/doubtService';
import { uploadAttachment, saveAttachment } from '../services/userService';
import { getSubjects } from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';
import { BRANCHES, SEMESTERS, formatFileSize, ALLOWED_ATTACHMENT_TYPES, MAX_FILE_SIZE_MB } from '../lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingFile { file: File; preview?: string; uploading?: boolean; error?: string; }

export function AskDoubtPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    subject_id: '',
    branch: profile?.branch || '',
    semester: profile?.semester?.toString() || '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });

  // Similar doubts search
  const { data: similarDoubts } = useQuery({
    queryKey: ['similar-doubts', form.title],
    queryFn: () => getSimilarDoubts(form.title),
    enabled: form.title.length > 10,
  });

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted.map((f) => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFiles: 5,
    onDropRejected: (rejected) => {
      rejected.forEach((r) => toast.error(r.errors[0]?.message || 'File rejected'));
    },
  });

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
      updated.splice(index, 1);
      return updated;
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!form.title.trim() || form.title.length < 10) { toast.error('Title must be at least 10 characters.'); return; }
    if (!form.description.trim() || form.description.length < 20) { toast.error('Description must be at least 20 characters.'); return; }
    if (!form.subject) { toast.error('Please select a subject.'); return; }

    setSubmitting(true);

    try {
      const doubt = await createDoubt({
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        subject_id: form.subject_id || undefined,
        branch: form.branch || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
        tags: form.tags,
        author_id: profile.id,
      });

      // Upload attachments
      if (pendingFiles.length > 0) {
        for (const pf of pendingFiles) {
          try {
            const uploaded = await uploadAttachment(pf.file, profile.id);
            await saveAttachment({ ...uploaded, doubt_id: doubt.id, uploaded_by: profile.id });
          } catch (err) {
            toast.error(`Failed to upload ${pf.file.name}`);
          }
        }
      }

      toast.success('Doubt posted! 🎉');
      navigate(`/doubt/${doubt.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post doubt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Ask a Doubt</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Be specific and clear — better questions get better answers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input
            className="input"
            placeholder="e.g. How do I solve a quadratic equation using the quadratic formula?"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={200}
          />
          <p className="text-[11px] text-zinc-400 mt-1 text-right">{form.title.length}/200</p>
        </div>

        {/* Similar doubts */}
        <AnimatePresence>
          {similarDoubts && similarDoubts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-4 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 mb-3">
                <Search size={12} /> Similar doubts already asked:
              </div>
              <div className="space-y-2">
                {similarDoubts.slice(0, 3).map((d) => (
                  <a key={d.id} href={`/doubt/${d.id}`} target="_blank" rel="noopener noreferrer" className="block text-xs text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    → {d.title}
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 mt-2">Check if your question is already answered before posting.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        <div>
          <label className="label">Description <span className="text-red-400">*</span></label>
          <textarea
            className="textarea"
            rows={6}
            placeholder="Describe your doubt in detail. Include what you've tried, where you're stuck, and any relevant context."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={5000}
          />
          <p className="text-[11px] text-zinc-400 mt-1 text-right">{form.description.length}/5000</p>
        </div>

        {/* Subject + Branch + Semester */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Subject <span className="text-red-400">*</span></label>
            <select
              className="input"
              value={form.subject_id || form.subject}
              onChange={(e) => {
                const val = e.target.value;
                const found = subjects.find((s) => s.id === val || s.name === val);
                setForm((f) => ({
                  ...f,
                  subject: found ? found.name : val,
                  subject_id: found ? found.id : '',
                }));
              }}
              disabled={subjectsLoading && subjects.length === 0}
            >
              <option value="">{subjectsLoading ? 'Loading subjects...' : 'Select subject'}</option>
              {subjects.map((s) => (
                <option key={s.id || s.name} value={s.id || s.name}>
                  {s.icon ? `${s.icon} ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Branch</label>
            <select className="input" value={form.branch} onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}>
              <option value="">Any</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
              <option value="">Any</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="label">Tags <span className="text-zinc-400 font-normal">(up to 5)</span></label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag) => (
              <span key={tag} className="badge badge-indigo gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Type a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              disabled={form.tags.length >= 5}
            />
            <button type="button" onClick={addTag} className="btn-secondary text-xs px-3" disabled={form.tags.length >= 5}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="label">Attachments <span className="text-zinc-400 font-normal">(images or PDFs, max {MAX_FILE_SIZE_MB}MB each)</span></label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={20} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs text-zinc-400">Drag & drop files here or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span></p>
            <p className="text-[10px] text-zinc-400 mt-1">JPG, PNG, GIF, WebP, PDF — up to 5 files</p>
          </div>

          {pendingFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {pendingFiles.map((pf, i) => (
                <div key={i} className="flex items-center gap-3 card p-2">
                  {pf.preview ? (
                    <img src={pf.preview} alt={pf.file.name} className="h-10 w-10 object-cover rounded-lg" />
                  ) : (
                    <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <FileText size={16} className="text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{pf.file.name}</p>
                    <p className="text-[10px] text-zinc-400">{formatFileSize(pf.file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="btn-ghost p-1 text-zinc-400 hover:text-red-500">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center text-sm py-2.5">
          {submitting ? (
            <><Loader2 size={15} className="animate-spin" /> Posting…</>
          ) : (
            <><Sparkles size={15} /> Post Doubt</>
          )}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../api/axios";

const avatarColors = [
  "bg-[rgb(var(--accent))] text-[rgb(var(--accent-contrast))]",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
];

function SingleComment({ comment, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyForm, setReplyForm] = useState({ name: "", email: "", text: "" });
  const [replies, setReplies] = useState(comment.replies || []);
  const [replyError, setReplyError] = useState("");

  const colorClass = avatarColors[comment._id ? comment._id.charCodeAt(0) % avatarColors.length : 0];

  const submitReply = async () => {
    setReplyError("");
    if (!replyForm.name.trim() || !replyForm.text.trim()) {
      setReplyError("Name aur reply text zaroori hain.");
      return;
    }

    try {
      const { data } = await api.post("/comments", {
        post: comment.post,
        name: replyForm.name,
        email: replyForm.email,
        text: replyForm.text,
        parent: comment._id,
      });
      setReplies([...replies, { ...data.comment, replies: [] }]);
      setReplyForm({ name: "", email: "", text: "" });
      setShowReplyForm(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to post reply.";
      setReplyError(msg);
      console.error("[REPLY ERROR]", msg);
    }
  };

  return (
    <div className={depth > 0 ? "ml-4 mt-3 border-l border-[rgb(var(--border))] pl-4 sm:ml-8" : "mb-4 pb-4 last:mb-0 last:pb-0"}>
      <div className="flex gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}>
          {comment.name?.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[rgb(var(--text))]">{comment.name}</span>
            {!comment.approved && (
              <span className="app-chip bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                Pending
              </span>
            )}
            <span className="text-xs app-muted">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "Just now"}
            </span>
          </div>

          <p className="text-sm leading-7 app-muted">{comment.text}</p>

          {depth < 2 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-500 hover:underline dark:text-sky-400"
            >
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
          )}

          {replyError && <p className="mt-2 text-xs text-rose-600">{replyError}</p>}

          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={replyForm.name}
                  onChange={(e) => setReplyForm({ ...replyForm, name: e.target.value })}
                  placeholder="Your name *"
                  className="app-field"
                />
                <input
                  value={replyForm.email}
                  onChange={(e) => setReplyForm({ ...replyForm, email: e.target.value })}
                  placeholder="Email for reply alerts"
                  className="app-field"
                />
              </div>
              <textarea
                value={replyForm.text}
                onChange={(e) => setReplyForm({ ...replyForm, text: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && e.metaKey && submitReply()}
                placeholder="Write a reply..."
                rows={3}
                className="app-field resize-none"
              />
              <div className="flex items-center gap-2">
                <button onClick={submitReply} className="app-btn-primary px-4 py-2.5 text-sm">
                  Post
                </button>
                <button onClick={() => setShowReplyForm(false)} className="app-btn-secondary px-4 py-2.5 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {replies.map((reply) => (
            <SingleComment key={reply._id || reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommentBox({ postId }) {
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", text: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    api
      .get(`/comments/${postId}`)
      .then(({ data }) => setComments(data.comments))
      .catch((err) => console.error("[COMMENTS FETCH ERROR]", err.message));
  }, [postId]);

  const submitComment = async () => {
    setError("");
    if (!form.name.trim() || !form.text.trim()) {
      setError("Name aur comment dono zaroori hain.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/comments", {
        post: postId,
        name: form.name,
        email: form.email,
        text: form.text,
      });
      setComments([{ ...data.comment, replies: [] }, ...comments]);
      setForm({ name: "", email: "", text: "" });
      setSuccess(data.message || "Comment posted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to post comment.";
      setError(msg);
      console.error("[COMMENT ERROR]", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase app-muted">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="app-card mb-5 p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase app-muted">
          Leave a comment
        </p>

        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name *"
            className="app-field"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email (optional)"
            className="app-field"
          />
        </div>
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          placeholder="Share your thoughts..."
          rows={4}
          className="app-field mt-2 resize-none"
        />
        <button
          onClick={submitComment}
          disabled={loading}
          className={`mt-3 rounded-md px-4 py-2.5 text-sm font-bold transition-colors ${
            loading ? "cursor-not-allowed bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]" : "app-btn-primary"
          }`}
        >
          {loading ? "Posting..." : "Post comment"}
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm app-muted">No comments yet. Be the first!</p>
      ) : (
        comments.map((c) => <SingleComment key={c._id} comment={c} />)
      )}
    </div>
  );
}

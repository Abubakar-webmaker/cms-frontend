import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import RichTextEditor from "../components/RichTextEditor";
import MediaLibrary from "../components/MediaLibrary";
import ImageCropper from "../components/ImageCropper";
import PostPreview from "../components/PostPreview";
import PostVersionsModal from "../components/PostVersionsModal";

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-500",
  scheduled: "bg-amber-50 text-amber-700",
};

const emptyPostForm = (category = "") => ({
  title: "",
  body: "<p></p>",
  category,
  status: "draft",
  tags: "",
  coverImage: "",
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  scheduledAt: "",
});

function readingTime(html = "") {
  const words = html.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [trashPosts, setTrashPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [trashLoading, setTrashLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [commentFilter, setCommentFilter] = useState("all");

  const [showPostForm, setShowPostForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [versionItems, setVersionItems] = useState([]);
  const [formError, setFormError] = useState("");
  const [cropFile, setCropFile] = useState(null);
  const [mediaTarget, setMediaTarget] = useState("cover");
  const [editorInstance, setEditorInstance] = useState(null);

  const [postForm, setPostForm] = useState(emptyPostForm(""));
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
  }, [user, navigate]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/posts", { params: { limit: 100 } });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("[ADMIN POSTS ERROR]", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories || []);
    } catch (err) {
      console.error("[ADMIN CATEGORIES ERROR]", err.message);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const { data } = await api.get("/comments/admin/all");
      setComments(data.comments || []);
    } catch (err) {
      console.error("[ADMIN COMMENTS ERROR]", err.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchTrash = async () => {
    setTrashLoading(true);
    try {
      const { data } = await api.get("/posts/trash");
      setTrashPosts(data.posts || []);
    } catch (err) {
      console.error("[TRASH ERROR]", err.message);
    } finally {
      setTrashLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPosts();
      void fetchCategories();
      void fetchComments();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "trash") {
      const timer = setTimeout(() => {
        void fetchTrash();
      }, 0);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeTab]);

  const openNewPost = () => {
    setEditingPost(null);
    setPostForm(emptyPostForm(categories[0]?._id || ""));
    setFormError("");
    setShowPostForm(true);
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title || "",
      body: post.body || "<p></p>",
      category: post.category?._id || post.category || "",
      status: post.status || "draft",
      tags: post.tags?.join(", ") || "",
      coverImage: post.coverImage || "",
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      ogImage: post.ogImage || "",
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setFormError("");
    setShowPostForm(true);
  };

  const openPreview = () => setShowPreview(true);

  const openVersions = async (post) => {
    try {
      const { data } = await api.get(`/posts/${post._id}/versions`);
      setVersionItems(data.versions || []);
      setShowVersions(true);
    } catch (err) {
      console.error("[VERSIONS ERROR]", err.message);
    }
  };

  const applyVersion = (version) => {
    setPostForm((prev) => ({ ...prev, title: version.title || prev.title, body: version.body || prev.body }));
    setShowVersions(false);
    setShowPreview(true);
  };

  const handleEditorUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file, file.name || "featured-image.jpg");
    const { data } = await api.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPostForm((prev) => ({ ...prev, coverImage: data.url }));
  };

  const handleCropSave = async (blob) => {
    try {
      const file = new File([blob], "featured-image.jpg", { type: blob.type || "image/jpeg" });
      await handleEditorUpload(file);
      setCropFile(null);
      setShowCropper(false);
    } catch (err) {
      console.error("[CROP UPLOAD ERROR]", err.message);
    }
  };

  const handleMediaSelect = (url) => {
    if (mediaTarget === "body" && editorInstance) {
      editorInstance.chain().focus().setImage({ src: url, alt: "Inserted from media library" }).run();
      setPostForm((prev) => ({ ...prev, body: editorInstance.getHTML() }));
    } else {
      setPostForm((prev) => ({ ...prev, coverImage: url }));
    }
    setShowMediaManager(false);
  };

  const savePost = async () => {
    setFormError("");
    if (!postForm.title.trim() || !postForm.body.trim() || !postForm.category) {
      setFormError("Title, body, and category are required.");
      return;
    }
    if (postForm.status === "scheduled" && !postForm.scheduledAt) {
      setFormError("Please choose a schedule date and time.");
      return;
    }

    const payload = {
      title: postForm.title.trim(),
      body: postForm.body,
      category: postForm.category,
      status: postForm.status,
      tags: postForm.tags
        ? postForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      coverImage: postForm.coverImage,
      metaTitle: postForm.metaTitle,
      metaDescription: postForm.metaDescription,
      ogImage: postForm.ogImage || postForm.coverImage,
      scheduledAt: postForm.status === "scheduled" ? new Date(postForm.scheduledAt).toISOString() : null,
    };

    try {
      if (editingPost) {
        const { data } = await api.put(`/posts/${editingPost._id}`, payload);
        setPosts((prev) => prev.map((p) => (p._id === editingPost._id ? data.post : p)));
      } else {
        const { data } = await api.post("/posts", payload);
        setPosts((prev) => [data.post, ...prev]);
      }
      setShowPostForm(false);
      setEditingPost(null);
      await Promise.all([fetchPosts(), fetchCategories()]);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save post.";
      setFormError(msg);
      console.error("[SAVE POST ERROR]", msg);
    }
  };

  const deletePost = async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      setTrashPosts((prev) => prev.filter((p) => p._id !== id));
      setDeleteConfirm(null);
      await Promise.all([fetchCategories(), fetchTrash()]);
    } catch (err) {
      console.error("[DELETE POST ERROR]", err.message);
    }
  };

  const restorePost = async (id) => {
    try {
      await api.patch(`/posts/${id}/restore`);
      await Promise.all([fetchPosts(), fetchTrash(), fetchCategories()]);
    } catch (err) {
      console.error("[RESTORE POST ERROR]", err.message);
    }
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    try {
      const payload = {
        title: post.title,
        body: post.body,
        category: post.category?._id || post.category,
        status: newStatus,
        tags: post.tags || [],
        coverImage: post.coverImage || "",
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        ogImage: post.ogImage || "",
      };
      const { data } = await api.put(`/posts/${post._id}`, payload);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? data.post : p)));
    } catch (err) {
      console.error("[TOGGLE STATUS ERROR]", err.message);
    }
  };

  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: "", description: "" });
    setFormError("");
    setShowCatForm(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || "" });
    setFormError("");
    setShowCatForm(true);
  };

  const saveCat = async () => {
    setFormError("");
    if (!catForm.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    try {
      if (editingCat) {
        const { data } = await api.put(`/categories/${editingCat._id}`, catForm);
        setCategories((prev) => prev.map((c) => (c._id === editingCat._id ? data.category : c)));
      } else {
        const { data } = await api.post("/categories", catForm);
        setCategories((prev) => [...prev, data.category]);
      }
      setShowCatForm(false);
      setEditingCat(null);
      await fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save category.";
      setFormError(msg);
      console.error("[SAVE CAT ERROR]", msg);
    }
  };

  const deleteCat = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("[DELETE CAT ERROR]", err.message);
    }
  };

  const setCommentStatus = async (comment, status) => {
    try {
      const { data } = await api.patch(`/comments/${comment._id}/status`, { status });
      setComments((prev) => prev.map((c) => (c._id === comment._id ? data.comment : c)));
    } catch (err) {
      console.error("[COMMENT STATUS ERROR]", err.message);
    }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("[COMMENT DELETE ERROR]", err.message);
    }
  };

  const filteredPosts = useMemo(
    () => posts.filter((post) => (filterStatus === "All" ? true : post.status === filterStatus.toLowerCase())),
    [posts, filterStatus]
  );

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const commentCounts = {
    all: comments.length,
    pending: comments.filter((comment) => comment.moderationStatus === "pending").length,
    approved: comments.filter((comment) => comment.moderationStatus === "approved").length,
    spam: comments.filter((comment) => comment.moderationStatus === "spam").length,
  };
  const visibleComments = commentFilter === "all"
    ? comments
    : comments.filter((comment) => comment.moderationStatus === commentFilter);
  const trashCount = trashPosts.length;

  const selectedCategoryName = categories.find((c) => c._id === postForm.category)?.name || "General";
  const previewPost = {
    ...postForm,
    categoryName: selectedCategoryName,
    readingTime: readingTime(postForm.body),
    excerpt: postForm.metaDescription || "",
    slug: editingPost?.slug || "",
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="section-shell py-5 sm:py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {["posts", "categories", "comments", "media", "trash"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total posts", value: posts.length },
            { label: "Published", value: published },
            { label: "Drafts", value: drafts },
            { label: "Scheduled", value: scheduled },
            { label: "Views", value: totalViews },
          ].map((s) => (
            <div key={s.label} className="surface rounded-3xl p-4">
              <p className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-400">{s.label}</p>
              <p className="text-3xl font-semibold text-slate-950 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="surface overflow-hidden rounded-[2rem]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {["All", "Published", "Draft", "Scheduled"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterStatus === f
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMediaManager(true)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Media manager
                </button>
                <button
                  onClick={openNewPost}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  + New post
                </button>
              </div>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-slate-400">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Title", "Category", "Status", "Date", "Views", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post._id} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                        <td className="max-w-xs px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white">{post.title}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{post.category?.name || "—"}</td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => toggleStatus(post)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium border-none ${statusStyle[post.status] || statusStyle.draft}`}
                          >
                            {post.status}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">{post.views}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => openEditPost(post)} className="text-xs text-sky-600 hover:underline">
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setPostForm({
                                  title: post.title || "",
                                  body: post.body || "<p></p>",
                                  category: post.category?._id || post.category || "",
                                  status: post.status || "draft",
                                  tags: post.tags?.join(", ") || "",
                                  coverImage: post.coverImage || "",
                                  metaTitle: post.metaTitle || "",
                                  metaDescription: post.metaDescription || "",
                                  ogImage: post.ogImage || "",
                                  scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
                                });
                                openPreview();
                              }}
                              className="text-xs text-emerald-600 hover:underline"
                            >
                              Preview
                            </button>
                            <button onClick={() => openVersions(post)} className="text-xs text-violet-600 hover:underline">
                              Versions
                            </button>
                            <button onClick={() => setDeleteConfirm(post._id)} className="text-xs text-rose-500 hover:underline">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredPosts.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-400">No posts found.</p>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="surface overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-medium text-slate-900 dark:text-white">All categories</p>
              <button onClick={openNewCat} className="rounded-lg bg-slate-950 px-4 py-2 text-sm text-white hover:bg-slate-800">
                + New category
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Name", "Slug", "Posts", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white">{cat.name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{cat.slug}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{cat.postCount ?? 0}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEditCat(cat)} className="text-xs text-sky-600 hover:underline">
                            Edit
                          </button>
                          <button onClick={() => deleteCat(cat._id)} className="text-xs text-rose-500 hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="surface overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Comments moderation</p>
                <p className="text-xs text-slate-400">{commentCounts.pending} pending approval</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "approved", "spam"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setCommentFilter(status)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      commentFilter === status
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {status} ({commentCounts[status]})
                  </button>
                ))}
                <button
                  onClick={fetchComments}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {commentsLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">Loading comments...</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleComments.map((comment) => (
                  <div key={comment._id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{comment.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            comment.moderationStatus === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : comment.moderationStatus === "spam"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {comment.moderationStatus || (comment.approved ? "approved" : "pending")}
                        </span>
                      </div>
                      <p className="mb-1 text-xs text-slate-400">{comment.post?.title || "Unknown post"}</p>
                      {comment.parent && (
                        <p className="mb-1 text-[11px] text-slate-400">
                          Reply to: {comment.parent?.text || "previous comment"}
                        </p>
                      )}
                      {comment.spamReason && (
                        <p className="mb-1 text-[11px] text-rose-600">
                          Flagged: {comment.spamReason}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-300">{comment.text}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => setCommentStatus(comment, "approved")} className="text-xs text-sky-600 hover:underline">
                          Approve
                        </button>
                        <button onClick={() => setCommentStatus(comment, "pending")} className="text-xs text-amber-600 hover:underline">
                          Pending
                        </button>
                        <button onClick={() => setCommentStatus(comment, "spam")} className="text-xs text-rose-500 hover:underline">
                          Spam
                        </button>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => deleteComment(comment._id)} className="text-xs text-rose-500 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {visibleComments.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No comments found.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === "media" && !showMediaManager && (
          <MediaLibrary
            onSelect={(url) => {
              setPostForm((prev) => ({ ...prev, coverImage: url }));
              setShowMediaManager(false);
            }}
            onClose={() => {
              setShowMediaManager(false);
              setActiveTab("posts");
            }}
          />
        )}

        {activeTab === "trash" && (
          <div className="surface overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Trash</p>
                <p className="text-xs text-slate-400">{trashCount} recoverable posts</p>
              </div>
              <button
                onClick={fetchTrash}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
            {trashLoading ? (
              <p className="py-10 text-center text-sm text-slate-400">Loading trash...</p>
            ) : trashPosts.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Trash is empty.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {trashPosts.map((post) => (
                  <div key={post._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{post.title}</p>
                      <p className="text-xs text-slate-400">
                        Deleted {post.deletedAt ? new Date(post.deletedAt).toLocaleString() : "recently"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => restorePost(post._id)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  {editingPost ? "Edit post" : "New post"}
                </h2>
                <p className="text-xs text-slate-500">Rich editor, SEO fields, scheduling, preview, and image workflow</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPreview(true)} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Preview
                </button>
                <button onClick={() => setShowPostForm(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5 p-5 sm:p-6 lg:p-8">
                {formError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {formError}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Title
                    </label>
                    <input
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      placeholder="Post title *"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Category
                    </label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">Select category *</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Body
                  </label>
                  <RichTextEditor
                    content={postForm.body}
                    onChange={(value) => setPostForm({ ...postForm, body: value })}
                    onEditorReady={setEditorInstance}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setMediaTarget("body");
                        setShowMediaManager(true);
                      }}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Insert body image
                    </button>
                    <button
                      onClick={() => {
                        setMediaTarget("cover");
                        setShowMediaManager(true);
                      }}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Select featured image
                    </button>
                    <label className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      Upload & crop featured image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCropFile(file);
                            setShowCropper(true);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Tags
                    </label>
                    <input
                      value={postForm.tags}
                      onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Status
                    </label>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>

                {postForm.status === "scheduled" && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Schedule
                    </label>
                    <input
                      type="datetime-local"
                      value={postForm.scheduledAt}
                      onChange={(e) => setPostForm({ ...postForm, scheduledAt: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Meta title
                    </label>
                    <input
                      value={postForm.metaTitle}
                      onChange={(e) => setPostForm({ ...postForm, metaTitle: e.target.value })}
                      placeholder="SEO title"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      OG image
                    </label>
                    <input
                      value={postForm.ogImage}
                      onChange={(e) => setPostForm({ ...postForm, ogImage: e.target.value })}
                      placeholder="Social preview image URL"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Meta description
                  </label>
                  <textarea
                    value={postForm.metaDescription}
                    onChange={(e) => setPostForm({ ...postForm, metaDescription: e.target.value })}
                    placeholder="Short SEO description"
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={savePost}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {editingPost ? "Save changes" : "Create post"}
                  </button>
                  <button
                    onClick={openPreview}
                    className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open preview
                  </button>
                </div>
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800 lg:border-t-0 lg:border-l lg:p-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Featured image</p>
                    <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                      {postForm.coverImage ? (
                        <img src={postForm.coverImage} alt="" className="h-48 w-full object-cover" />
                      ) : (
                        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                          No featured image selected
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Slug</p>
                    <p className="mt-2 break-all text-sm text-slate-500 dark:text-slate-400">
                      {editingPost?.slug || "Auto-generated from title"}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Read time</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{readingTime(postForm.body)}</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <PostPreview
          post={previewPost}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showVersions && (
        <PostVersionsModal
          versions={versionItems}
          onApply={applyVersion}
          onClose={() => setShowVersions(false)}
        />
      )}

      {showCropper && (
        <ImageCropper
          file={cropFile}
          onCancel={() => {
            setShowCropper(false);
            setCropFile(null);
          }}
          onSave={handleCropSave}
        />
      )}

      {showMediaManager && (
        <MediaLibrary
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaManager(false)}
        />
      )}

      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">
              {editingCat ? "Edit category" : "New category"}
            </h2>
            {formError && (
              <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {formError}
              </div>
            )}
            <div className="space-y-3">
              <input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="Category name *"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <input
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCatForm(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCat}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {editingCat ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="mb-2 text-base font-semibold text-slate-950 dark:text-white">Delete post?</h2>
            <p className="mb-5 text-sm text-slate-500">This will move the post to trash and keep it recoverable.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(deleteConfirm)}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

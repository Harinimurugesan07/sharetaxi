import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  LayoutGrid,
  Sparkles,
  Search,
  RefreshCw,
  Car,
  Pencil,
  Trash2,
  Eye,
  Wand2,
  Loader2,
  X,
  UploadCloud,
} from "lucide-react";

import {
  fetchBlogs,
  fetchCategories,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadCoverImage,
  generateAiDraft,
  generateAndSaveDraft,
} from "../api/blogApi";

import "./BlogManagement.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const EMPTY_FORM = {
  id: null,
  title: "",
  category: "",
  author: "",
  excerpt: "",
  content: "",
  status: "draft",
  coverImage: "",
};

export default function BlogManagement() {
  const [activeTab, setActiveTab] = useState("all"); // all | create | ai

  // --- list state ---
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // --- create/edit form state ---
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingBlog, setSavingBlog] = useState(false);
  const [formError, setFormError] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // --- AI assistant state ---
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("friendly");
  const [aiKeywords, setAiKeywords] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiDraft, setAiDraft] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetchBlogs({
        search,
        category: categoryFilter,
        status: statusFilter,
      });
      setBlogs(res.items || []);
    } catch (err) {
      setListError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // debounce search a bit so we're not firing a request per keystroke
    const t = setTimeout(loadBlogs, 250);
    return () => clearTimeout(t);
  }, [loadBlogs]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openCreateTab = () => {
    resetForm();
    setActiveTab("create");
  };

  const openEditTab = (blog) => {
    setForm({
      id: blog.id,
      title: blog.title,
      category: blog.category,
      author: blog.author,
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      status: blog.status,
      coverImage: blog.coverImage || "",
    });
    setFormError(null);
    setActiveTab("create");
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadCoverImage(file);
      setForm((f) => ({ ...f, coverImage: res.url }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmitBlog = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setFormError("Title and author are required.");
      return;
    }
    setSavingBlog(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title,
        category: form.category || "General",
        author: form.author,
        excerpt: form.excerpt,
        content: form.content,
        status: form.status,
        coverImage: form.coverImage || null,
      };
      if (form.id) {
        await updateBlog(form.id, payload);
      } else {
        await createBlog(payload);
      }
      resetForm();
      setActiveTab("all");
      loadBlogs();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSavingBlog(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this blog post? This can't be undone.")) return;
    try {
      await deleteBlog(id);
      loadBlogs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateDraft = async () => {
    if (!aiTopic.trim()) {
      setAiError("Give the assistant a topic to write about.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const draft = await generateAiDraft({
        topic: aiTopic,
        tone: aiTone,
        keywords: aiKeywords,
        category: aiCategory || undefined,
      });
      setAiDraft(draft);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseDraft = () => {
    if (!aiDraft) return;
    setForm({
      ...EMPTY_FORM,
      title: aiDraft.title,
      category: aiDraft.category,
      excerpt: aiDraft.excerpt,
      content: aiDraft.content,
    });
    setActiveTab("create");
  };

  const emptyStateVisible = !loading && !listError && blogs.length === 0;

  const tabs = useMemo(
    () => [
      { key: "all", label: "All Blogs", icon: LayoutGrid },
      { key: "create", label: form.id ? "Edit Blog" : "Create Blog", icon: Plus },
      { key: "ai", label: "AI Assistant", icon: Sparkles },
    ],
    [form.id]
  );

  return (
    <div className="blogmgmt-page">
      <div className="blogmgmt-header">
        <div>
          {/* <h1>Blog Management</h1> */}
          <p>Create, edit and manage ShareTaxi blog posts.</p>
        </div>
        <button className="blogmgmt-btn blogmgmt-btn-primary" onClick={openCreateTab}>
          <Plus size={18} />
          Create Blog
        </button>
      </div>

      <div className="blogmgmt-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`blogmgmt-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
        <>
          <div className="blogmgmt-filterbar">
            <div className="blogmgmt-search">
              <Search size={18} />
              <input
                placeholder="Search by title, category or author"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button className="blogmgmt-icon-btn" onClick={loadBlogs} title="Refresh">
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>

          <div className="blogmgmt-panel">
            {listError && <div className="blogmgmt-error">{listError}</div>}

            {loading && (
              <div className="blogmgmt-empty">
                <Loader2 className="spin" size={40} />
                <p>Loading blogs…</p>
              </div>
            )}

            {emptyStateVisible && (
              <div className="blogmgmt-empty">
                <Car size={64} strokeWidth={1.2} />
                <h3>No blogs found</h3>
                <p>Try adjusting your filters, or create a new post to get started.</p>
              </div>
            )}

            {!loading && blogs.length > 0 && (
              <div className="blogmgmt-grid">
                {blogs.map((blog) => (
                  <div className="blogmgmt-card" key={blog.id}>
                    <div className="blogmgmt-card-cover">
                      {blog.coverImage ? (
                        <img src={blog.coverImage} alt={blog.title} />
                      ) : (
                        <Car size={32} strokeWidth={1.2} />
                      )}
                      <span className={`blogmgmt-status blogmgmt-status-${blog.status}`}>
                        {blog.status}
                      </span>
                      {blog.aiGenerated && (
                        <span className="blogmgmt-ai-badge">
                          <Sparkles size={12} /> AI
                        </span>
                      )}
                    </div>

                    <div className="blogmgmt-card-body">
                      <span className="blogmgmt-card-category">{blog.category}</span>
                      <h3>{blog.title}</h3>
                      {blog.excerpt && <p>{blog.excerpt}</p>}

                      <div className="blogmgmt-card-meta">
                        <span>{blog.author}</span>
                        <span>
                          <Eye size={13} /> {blog.views}
                        </span>
                      </div>
                    </div>

                    <div className="blogmgmt-card-actions">
                      <button onClick={() => openEditTab(blog)}>
                        <Pencil size={15} /> Edit
                      </button>
                      <button className="danger" onClick={() => handleDelete(blog.id)}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "create" && (
        <div className="blogmgmt-panel blogmgmt-form-panel">
          <form onSubmit={handleSubmitBlog}>
            {formError && <div className="blogmgmt-error">{formError}</div>}

            <div className="blogmgmt-form-row">
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 5 Ways to Save on Your Daily Commute"
                />
              </label>
            </div>

            <div className="blogmgmt-form-row two-col">
              <label>
                Category
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Travel Tips"
                />
              </label>
              <label>
                Author
                <input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="e.g. ShareTaxi Team"
                />
              </label>
            </div>

            <div className="blogmgmt-form-row">
              <label>
                Excerpt
                <textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="A short 1-2 sentence teaser shown in the blog list"
                />
              </label>
            </div>

            <div className="blogmgmt-form-row">
              <label>
                Content
                <textarea
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Full post content…"
                />
              </label>
            </div>

            <div className="blogmgmt-form-row two-col">
              <label>
                Cover image
                <div className="blogmgmt-upload">
                  <label className="blogmgmt-upload-btn">
                    <UploadCloud size={16} />
                    {uploadingCover ? "Uploading…" : "Upload image"}
                    <input type="file" accept="image/*" hidden onChange={handleCoverUpload} />
                  </label>
                  {form.coverImage && (
                    <img className="blogmgmt-upload-preview" src={form.coverImage} alt="cover preview" />
                  )}
                </div>
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>

            <div className="blogmgmt-form-actions">
              <button
                type="button"
                className="blogmgmt-btn blogmgmt-btn-ghost"
                onClick={() => {
                  resetForm();
                  setActiveTab("all");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="blogmgmt-btn blogmgmt-btn-primary" disabled={savingBlog}>
                {savingBlog ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                {form.id ? "Save changes" : "Create Blog"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="blogmgmt-panel blogmgmt-ai-panel">
          <div className="blogmgmt-ai-input">
            <h3>
              <Sparkles size={18} /> Describe the post you want
            </h3>

            <label>
              Topic
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. How ride-sharing cuts your commute cost in half"
              />
            </label>

            <div className="blogmgmt-form-row two-col">
              <label>
                Tone
                <select value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                  <option value="friendly">Friendly</option>
                  <option value="playful">Playful</option>
                  <option value="informative">Informative</option>
                  <option value="warm">Warm & storytelling</option>
                </select>
              </label>
              <label>
                Category (optional)
                <input
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  placeholder="e.g. Rider Stories"
                />
              </label>
            </div>

            <label>
              Keywords / angles (optional)
              <input
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder="e.g. carpooling, fare splitting, safety, live tracking"
              />
            </label>

            {aiError && <div className="blogmgmt-error">{aiError}</div>}

            <button
              className="blogmgmt-btn blogmgmt-btn-primary"
              onClick={handleGenerateDraft}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
              {aiLoading ? "Writing…" : "Generate Draft"}
            </button>
          </div>

          <div className="blogmgmt-ai-preview">
            {!aiDraft && !aiLoading && (
              <div className="blogmgmt-empty">
                <Sparkles size={48} strokeWidth={1.2} />
                <p>Your generated draft will appear here.</p>
              </div>
            )}

            {aiDraft && (
              <div className="blogmgmt-ai-draft">
                <button className="blogmgmt-icon-btn blogmgmt-ai-close" onClick={() => setAiDraft(null)}>
                  <X size={16} />
                </button>
                <span className="blogmgmt-card-category">{aiDraft.category}</span>
                <h3>{aiDraft.title}</h3>
                <p className="blogmgmt-ai-excerpt">{aiDraft.excerpt}</p>
                <div className="blogmgmt-ai-content">
                  {aiDraft.content.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {aiDraft.suggestedTags?.length > 0 && (
                  <div className="blogmgmt-ai-tags">
                    {aiDraft.suggestedTags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}
                <button className="blogmgmt-btn blogmgmt-btn-primary" onClick={handleUseDraft}>
                  Use this draft
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
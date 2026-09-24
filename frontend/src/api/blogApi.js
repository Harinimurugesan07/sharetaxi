const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function fetchBlogs({ search = "", category = "all", status = "all", page = 1 } = {}) {
  const params = new URLSearchParams({ search, category, status, page });
  return fetch(`${API_BASE}/blogs?${params}`).then(handle);
}

export function fetchCategories() {
  return fetch(`${API_BASE}/blogs/categories`).then(handle);
}

export function fetchBlog(id) {
  return fetch(`${API_BASE}/blogs/${id}`).then(handle);
}

export function createBlog(payload) {
  return fetch(`${API_BASE}/blogs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function updateBlog(id, payload) {
  return fetch(`${API_BASE}/blogs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function deleteBlog(id) {
  return fetch(`${API_BASE}/blogs/${id}`, { method: "DELETE" }).then(handle);
}

export function uploadCoverImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`${API_BASE}/blogs/upload-cover`, {
    method: "POST",
    body: formData,
  }).then(handle);
}

export function generateAiDraft({ topic, tone, keywords, category }) {
  return fetch(`${API_BASE}/blogs/ai-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, tone, keywords, category }),
  }).then(handle);
}

export function generateAndSaveDraft({ topic, tone, keywords, category, author, authorId }) {
  return fetch(`${API_BASE}/blogs/ai-generate/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, tone, keywords, category, author, authorId }),
  }).then(handle);
}

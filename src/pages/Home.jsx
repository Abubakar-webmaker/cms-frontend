import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { useDebounce } from "../hooks/useDebounce";

const quickLinks = ["Feed", "Groups", "Pages", "Chats", "Events"];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const activeCategory = searchParams.get("category") || "";
  const activeTag = searchParams.get("tag") || "";
  const debouncedSearch = useDebounce(search, 400);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchPosts = useCallback(
    async (cursor = null) => {
      setLoading(true);
      setError("");

      const params = { status: "published", limit: 10 };
      if (activeCategory) params.category = activeCategory;
      if (activeTag) params.tag = activeTag;
      if (debouncedSearch) params.q = debouncedSearch;
      if (cursor) params.cursor = cursor;

      try {
        const { data } = await api.get("/posts", { params });
        setPosts((prev) => (cursor ? [...prev, ...data.posts] : data.posts));
        setNextCursor(data.nextCursor || null);
        setHasMore(!!data.nextCursor);

        if (!cursor) {
          const allTags = data.posts.flatMap((p) => p.tags || []);
          setTags([...new Set(allTags)]);
        }
      } catch (err) {
        console.error("[HOME POSTS ERROR]", err.message);
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, activeTag, debouncedSearch]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchPosts(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchPosts]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, nextCursor, fetchPosts]);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  const setFilter = (key, value) => {
    setSearch("");
    if (value) setSearchParams({ [key]: value });
    else setSearchParams({});
  };

  const clearFilters = () => {
    setSearch("");
    setSearchParams({});
  };

  const featuredPost = posts[0];
  const initialLoad = loading && posts.length === 0;
  const activeLabel = activeCategory || activeTag || debouncedSearch ? "Filtered feed" : "Home feed";

  return (
    <div className="app-page">
      <Navbar />

      <main className="section-shell py-4 sm:py-6">
        <section className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)_300px]">
          <aside className="hidden space-y-3 lg:sticky lg:top-20 lg:block lg:self-start">
            <div className="app-card p-3">
              {quickLinks.map((item, index) => (
                <button
                  key={item}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold transition-colors ${
                    index === 0 ? "bg-[rgb(var(--accent))] text-white" : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15">{item.slice(0, 1)}</span>
                  {item}
                </button>
              ))}
            </div>

            <div className="app-card p-4">
              <p className="mb-3 text-sm font-extrabold text-[rgb(var(--text))]">Shortcuts</p>
              <div className="space-y-2">
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setFilter("category", cat.slug)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                      activeCategory === cat.slug
                        ? "bg-[rgb(var(--accent))] text-white"
                        : "bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs">{cat.postCount ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="app-card mb-4 p-4">
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search posts, topics, authors..."
                  className="app-field"
                />
                {(search || activeCategory || activeTag) && (
                  <button type="button" onClick={clearFilters} className="app-btn-secondary shrink-0">
                    Clear
                  </button>
                )}
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={clearFilters} className={`app-chip ${!activeCategory && !activeTag ? "border-[rgb(var(--accent))] text-[rgb(var(--accent))]" : ""}`}>
                  All
                </button>
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setFilter("category", cat.slug)}
                    className={`app-chip transition-colors ${activeCategory === cat.slug ? "border-[rgb(var(--accent))] text-[rgb(var(--accent))]" : "hover:text-[rgb(var(--text))]"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-[rgb(var(--text))]">{activeLabel}</p>
                <p className="text-sm app-muted">{posts.length} posts loaded</p>
              </div>
              {(activeCategory || activeTag || search) && (
                <button onClick={clearFilters} className="app-btn-secondary px-3 py-2 text-sm">
                  Clear filters
                </button>
              )}
            </div>

            {initialLoad && (
              <div className="app-card p-8 text-center text-sm app-muted">Loading posts...</div>
            )}
            {error && <div className="app-card p-8 text-center text-sm text-rose-600">{error}</div>}
            {!initialLoad && !error && posts.length === 0 && (
              <div className="app-card p-8 text-center text-sm app-muted">No posts found.</div>
            )}

            {posts.length > 0 && (
              <div className="grid gap-4">
                {featuredPost && <PostCard post={featuredPost} featured index={0} />}
                {posts.slice(1).map((post, i) => (
                  <PostCard key={post._id} post={post} index={i + 1} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} className="py-4 text-center">
              {loading && !initialLoad && <p className="text-sm app-muted">Loading more...</p>}
              {!hasMore && posts.length > 0 && <p className="text-sm app-muted">You have reached the end.</p>}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="app-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-extrabold text-[rgb(var(--text))]">Browse categories</p>
                <span className="text-xs app-muted">{categories.length}</span>
              </div>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setFilter("category", cat.slug)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm transition-colors ${
                      activeCategory === cat.slug
                        ? "bg-[rgb(var(--accent))] text-white"
                        : "bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={activeCategory === cat.slug ? "text-xs text-white/80" : "text-xs app-muted"}>
                      {cat.postCount ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="app-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[rgb(var(--text))]">Popular tags</p>
                  <span className="text-xs app-muted">{tags.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFilter("tag", tag)}
                      className={`app-chip transition-colors ${
                        activeTag === tag ? "border-[rgb(var(--accent))] text-[rgb(var(--accent))]" : "hover:text-[rgb(var(--text))]"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

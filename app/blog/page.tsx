"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { posts, formatDate, type Post } from "@/lib/blog";
import { ArrowUpRight } from "lucide-react";

function FeaturedPostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block border border-[#f0f0f0] rounded-2xl p-8 mb-4 hover:border-[#e0e0e0] hover:bg-[#fafafa] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa]">
          {post.tag}
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#ccc]">
          {formatDate(post.date)}
        </span>
      </div>
      <h2 className="text-[1.4rem] font-normal tracking-tight leading-[1.25] text-[#111] mb-3">
        {post.title}
      </h2>
      <p className="text-sm text-[#999] leading-relaxed mb-6">
        {post.description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#111] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        Read post
        <ArrowUpRight
          size={12}
          className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150"
        />
      </span>
    </Link>
  );
}

function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex items-start justify-between gap-6 py-6"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#ccc]">
            {post.tag}
          </span>
        </div>
        <h2 className="text-[15px] font-normal text-[#111] tracking-tight leading-snug mb-1 group-hover:font-medium transition-all duration-150">
          {post.title}
        </h2>
        <p className="text-[13px] text-[#bbb] leading-relaxed line-clamp-1">
          {post.description}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
        <span className="font-mono text-[10px] tracking-wider text-[#ccc] whitespace-nowrap">
          {formatDate(post.date)}
        </span>
        <span className="text-[11px] text-[#ccc] whitespace-nowrap">
          {post.readingTime} min read
        </span>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [activeTag, setActiveTag] = useState<string>("All");

  const tags = useMemo(() => {
    const set = new Set(posts.map((p) => p.tag));
    return ["All", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const base =
      activeTag === "All"
        ? [...posts]
        : posts.filter((p) => p.tag === activeTag);
    return base.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [activeTag]);

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased selection:bg-[#f5f5f5]">
      <Header />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-40">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-6">
          Blog
        </p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-normal tracking-tight leading-[1.1] mb-10">
          Writing
        </h1>

        {/* Index line */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-16 font-mono text-[10px] tracking-[0.15em] uppercase">
          {tags.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={[
                  "py-1.5 px-0.5 transition-colors duration-150",
                  isActive
                    ? "text-[#111] border-b border-[#111]"
                    : "text-[#ccc] hover:text-[#999]",
                ].join(" ")}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-[#bbb]">No posts in this category yet.</p>
        ) : (
          <div className="divide-y divide-[#f5f5f5]">
            {filtered.map((post, i) =>
              i === 0 ? (
                <FeaturedPostCard key={post.slug} post={post} />
              ) : (
                <PostRow key={post.slug} post={post} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

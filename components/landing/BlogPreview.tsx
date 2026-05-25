import Link from "next/link";
import { posts, formatDate } from "@/lib/blog";
import { ArrowUpRight } from "lucide-react";

export function BlogPreview() {
  const recent = [...posts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <section className="border-t border-[#f0f0f0]">
      <div className="max-w-6xl mx-auto px-6 py-40">
        <div className="flex items-end justify-between mb-20">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#D63558] mb-6">
              Writing
            </p>
            <h2 className="text-3xl md:text-4xl font-normal tracking-tight leading-[1.15]">
              From the blog
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wide text-[#bbb] hover:text-[#111] transition-colors duration-150"
          >
            All posts
            <ArrowUpRight size={11} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-x-8 gap-y-12 divide-y md:divide-y-0 divide-[#f5f5f5]">
          {recent.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block pt-8 md:pt-0 first:pt-0"
            >
              <div className="hidden md:block h-px bg-[#f0f0f0] mb-8" />

              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#ccc]">
                  {post.tag}
                </span>
                <span className="font-mono text-[10px] tracking-wider text-[#ddd]">
                  {post.readingTime} min
                </span>
              </div>

              <h3 className="text-[15px] font-normal text-[#111] tracking-tight leading-snug mb-3 group-hover:font-medium transition-all duration-150">
                {post.title}
              </h3>

              <p className="text-[13px] text-[#bbb] leading-relaxed line-clamp-2 mb-6">
                {post.description}
              </p>

              <span className="font-mono text-[10px] tracking-wider text-[#ccc]">
                {formatDate(post.date)}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 md:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wide text-[#bbb] hover:text-[#111] transition-colors duration-150"
          >
            All posts
            <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </section>
  );
}

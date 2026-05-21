import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getPost, posts, formatDate } from "@/lib/blog";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = posts.filter((p) => p.slug !== post.slug);
  const suggested = others[0] ?? null;

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased selection:bg-[#f5f5f5]">
      <Header />

      {post.faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.faqSchema) }}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 pt-20 pb-40">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase text-[#ccc] hover:text-[#111] transition-colors duration-150 mb-14"
        >
          <ArrowLeft size={10} />
          Blog
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa]">
            {post.tag}
          </span>
          <span className="text-[#e0e0e0] select-none">·</span>
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#ccc]">
            {formatDate(post.date)}
          </span>
          <span className="text-[#e0e0e0] select-none">·</span>
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#ccc]">
            {post.readingTime} min read
          </span>
        </div>

        <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-normal tracking-tight leading-[1.15] text-[#111] mb-6">
          {post.title}
        </h1>
        <p className="text-[15px] text-[#999] leading-relaxed mb-14 border-l-2 border-[#f0f0f0] pl-4">
          {post.description}
        </p>

        <div
          className="prose-plai text-sm text-[#555] leading-[1.85] space-y-6"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <div className="mt-20 pt-10 border-t border-[#f5f5f5]">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#ccc] mb-8">
            Continue reading
          </p>

          {suggested && (
            <Link
              href={`/blog/${suggested.slug}`}
              className="group flex items-start justify-between gap-4"
            >
              <div>
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#ccc] block mb-1.5">
                  {suggested.tag}
                </span>
                <h3 className="text-[15px] font-normal text-[#111] tracking-tight leading-snug group-hover:font-medium transition-all duration-150">
                  {suggested.title}
                </h3>
              </div>
              <ArrowUpRight
                size={14}
                className="shrink-0 mt-1 text-[#ccc] group-hover:text-[#111] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
              />
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .prose-plai h2 {
          font-size: 1.05rem;
          font-weight: 500;
          color: #111;
          letter-spacing: -0.01em;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.35;
        }
        .prose-plai p { color: #666; }
        .prose-plai ul {
          padding-left: 1.25rem;
          list-style-type: disc;
          space-y: 0.5rem;
        }
        .prose-plai ul li { margin-bottom: 0.5rem; color: #666; }
        .prose-plai strong { color: #444; font-weight: 500; }
        .prose-plai em { color: #555; font-style: italic; }
        .prose-plai a {
          color: #111;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: #ddd;
          transition: text-decoration-color 150ms ease;
        }
        .prose-plai a:hover { text-decoration-color: #111; }
      `}</style>
    </div>
  );
}

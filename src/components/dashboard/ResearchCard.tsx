import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResearchArticle } from "@/types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ResearchCardProps {
  article: ResearchArticle;
}

export default function ResearchCard({ article }: ResearchCardProps) {
  return (
    <article className="flex flex-col gap-3 border-b border-slate-200 py-5 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" className="border-slate-200 text-slate-500">
          {article.category}
        </Badge>
        <span className="text-xs text-slate-400">{formatDate(article.publishedDate)}</span>
      </div>
      <h4 className="text-[15px] font-semibold leading-snug text-slate-900">
        {article.title}
      </h4>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
      >
        Read more
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

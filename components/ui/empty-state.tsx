import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="glass-panel rounded-[28px] p-5 text-sm text-white/65">
      <p className="font-display text-xl text-white">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-4 inline-flex">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}

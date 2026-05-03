export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="accent-text text-xs uppercase tracking-[0.35em]">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-none text-white">{title}</h1>
      <p className="max-w-xl text-sm leading-6 text-white/64">{description}</p>
    </div>
  );
}

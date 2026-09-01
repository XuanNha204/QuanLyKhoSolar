import type { LucideIcon } from "lucide-react";
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white text-emerald-600">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}

import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold leading-tight text-foreground sm:truncate sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:w-auto sm:shrink-0 sm:overflow-visible sm:px-0 sm:pb-0">
          {actions}
        </div>
      )}
    </header>
  );
}

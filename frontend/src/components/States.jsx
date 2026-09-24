import { Loader2, Inbox, AlertTriangle } from "lucide-react";

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy-400">
      <Loader2 className="h-6 w-6 animate-spin text-navy-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-navy-100 bg-navy-50/40 py-16 px-6 text-center">
      <div className="rounded-full bg-white p-3 shadow-card">
        <Inbox className="h-5 w-5 text-navy-400" />
      </div>
      <p className="text-sm font-semibold text-navy-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-navy-400">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong. Please try again.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger-50 bg-danger-50/50 py-16 px-6 text-center">
      <div className="rounded-full bg-white p-3 shadow-card">
        <AlertTriangle className="h-5 w-5 text-danger-500" />
      </div>
      <p className="text-sm font-semibold text-navy-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-navy-600 underline underline-offset-2 hover:text-navy-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}

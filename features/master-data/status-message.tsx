import { AlertCircle, CheckCircle2 } from "lucide-react";

export type StatusMessageValue = {
  type: "success" | "error";
  text: string;
};

export function StatusMessage({
  message
}: {
  message: StatusMessageValue | null;
}) {
  if (!message) {
    return null;
  }

  const isSuccess = message.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={[
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
      ].join(" ")}
      role="status"
    >
      <Icon className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
      <span>{message.text}</span>
    </div>
  );
}

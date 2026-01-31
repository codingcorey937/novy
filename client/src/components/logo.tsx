import { Building2 } from "lucide-react";

export function Logo({ className = "h-7 w-7 text-[#3b82f6]" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Building2 className={className} />
    </div>
  );
}

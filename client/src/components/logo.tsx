import logoImg from "../attached_assets/logo.jpeg";

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logoImg} alt="Novy Logo" className={`${className} object-contain`} />
    </div>
  );
}

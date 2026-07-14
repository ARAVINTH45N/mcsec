import logoAsset from "@/assets/mcsec-logo.jpeg.asset.json";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function Logo({ size = 40, showText = true, className = "", textClassName = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoAsset.url}
        alt="Microsoft Club SEC logo"
        width={size}
        height={size}
        className="rounded-lg object-cover shadow-fluent-sm"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className={`flex flex-col leading-tight ${textClassName}`}>
          <span className="text-sm font-semibold tracking-tight">Microsoft Club</span>
          <span className="text-[10px] uppercase tracking-widest opacity-70">Saveetha Engg. College</span>
        </div>
      )}
    </div>
  );
}

export function MsSquares({ className = "" }: { className?: string }) {
  return (
    <span className={`ms-squares ${className}`} aria-hidden>
      <span style={{ backgroundColor: "var(--color-ms-red)" }} className="rounded-[1px]" />
      <span style={{ backgroundColor: "var(--color-ms-green)" }} className="rounded-[1px]" />
      <span style={{ backgroundColor: "var(--color-ms-blue)" }} className="rounded-[1px]" />
      <span style={{ backgroundColor: "var(--color-ms-yellow)" }} className="rounded-[1px]" />
    </span>
  );
}

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useStorageUrl } from "@/lib/storage";

interface PageBackgroundProps {
  imageUrl?: string | null;
  /** 0..1 opacity of image layer */
  imageOpacity?: number;
  /** overlay tint variant */
  variant?: "default" | "hero" | "light";
}

export function PageBackground({ imageUrl, imageOpacity = 0.13, variant = "default" }: PageBackgroundProps) {
  const { data: settings } = useSiteSettings();
  const { data: globalBg } = useStorageUrl("site-assets", settings?.global_bg_url);
  const bg = imageUrl ?? globalBg ?? null;

  const overlay =
    variant === "hero"
      ? "linear-gradient(135deg, oklch(0.15 0.05 260 / 0.85), oklch(0.22 0.09 250 / 0.9))"
      : variant === "light"
      ? "linear-gradient(180deg, oklch(1 0 0 / 0.5), oklch(0.985 0.005 250 / 0.85))"
      : "linear-gradient(180deg, oklch(0.985 0.005 250 / 0.7), oklch(0.955 0.01 250 / 0.85))";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      {bg && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${bg})`, opacity: imageOpacity }}
        />
      )}
      <div className="absolute inset-0" style={{ background: overlay }} />
    </div>
  );
}

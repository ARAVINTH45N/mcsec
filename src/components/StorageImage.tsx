import { useStorageUrl, type Bucket } from "@/lib/storage";

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  bucket: Bucket;
  value?: string | null;
  fallback?: React.ReactNode;
}

export function StorageImage({ bucket, value, fallback = null, alt = "", className, ...rest }: StorageImageProps) {
  const { data: url, isLoading } = useStorageUrl(bucket, value);
  if (isLoading) return <div className={`animate-pulse bg-muted ${className ?? ""}`} />;
  if (!url) return <>{fallback}</>;
  return <img src={url} alt={alt} loading="lazy" className={className} {...rest} />;
}

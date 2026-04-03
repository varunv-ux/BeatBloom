import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shareSong(url: string, title: string) {
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isMobile && navigator.share) {
    navigator.share({ title, text: `Check out "${title}" - made with BeatBloom!`, url });
  } else {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  }
}

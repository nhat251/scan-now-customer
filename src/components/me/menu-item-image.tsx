"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { FALLBACK_MENU_IMAGE } from "@/components/me/helpers";
import { cn } from "@/lib/utils";

type MenuItemImageProps = {
  src?: string | null;
  alt: string;
  isAvailable: boolean;
};

export const MenuItemImage = ({ src, alt, isAvailable }: MenuItemImageProps) => {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_MENU_IMAGE);

  useEffect(() => {
    setImageSrc(src || FALLBACK_MENU_IMAGE);
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized
      sizes="96px"
      className={cn("object-cover", !isAvailable && "opacity-60 grayscale")}
      onError={() => setImageSrc(FALLBACK_MENU_IMAGE)}
    />
  );
};

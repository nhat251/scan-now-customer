"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { FALLBACK_MENU_IMAGE } from "@/components/me/helpers";

type MenuItemDetailImageProps = {
  src?: string | null;
  alt: string;
};

export const MenuItemDetailImage = ({ src, alt }: MenuItemDetailImageProps) => {
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
      sizes="(max-width: 1280px) 100vw, 480px"
      className="object-cover"
      onError={() => setImageSrc(FALLBACK_MENU_IMAGE)}
    />
  );
};

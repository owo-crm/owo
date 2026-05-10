"use client";

/**
 * @author: @dorianbaffier
 * @description: Particle Button
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { MousePointerClick } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PARTICLE_OFFSETS = [
  { x: -24, y: -28 },
  { x: 32, y: -36 },
  { x: -42, y: -44 },
  { x: 48, y: -30 },
  { x: -30, y: -52 },
  { x: 38, y: -60 },
] as const;

type BaseButtonProps = React.ComponentProps<typeof Button>;

interface ParticleButtonProps extends BaseButtonProps {
  onSuccess?: () => void;
  successDuration?: number;
}

function SuccessParticles({
  center,
}: {
  center: { x: number; y: number } | null;
}) {
  if (!center) return null;

  return (
    <AnimatePresence>
      {PARTICLE_OFFSETS.map((offset, i) => (
        <motion.div
          animate={{
            scale: [0, 1, 0],
            x: [0, offset.x],
            y: [0, offset.y],
          }}
          className="fixed h-1 w-1 rounded-full bg-black dark:bg-white"
          initial={{
            scale: 0,
            x: 0,
            y: 0,
          }}
          key={i}
          style={{ left: center.x, top: center.y }}
          transition={{
            duration: 0.6,
            delay: i * 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>
  );
}

export default function ParticleButton({
  children,
  onClick,
  onSuccess,
  successDuration = 1000,
  className,
  ...props
}: ParticleButtonProps) {
  const [showParticles, setShowParticles] = useState(false);
  const [particleCenter, setParticleCenter] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setParticleCenter({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setShowParticles(true);
    onClick?.(e);

    setTimeout(() => {
      setShowParticles(false);
      setParticleCenter(null);
      onSuccess?.();
    }, successDuration);
  };

  return (
    <>
      {showParticles && (
        <SuccessParticles center={particleCenter} />
      )}
      <Button
        className={cn(
          "relative",
          showParticles && "scale-95",
          "transition-transform duration-100",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
        <MousePointerClick className="h-4 w-4" />
      </Button>
    </>
  );
}

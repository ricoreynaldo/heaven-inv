import { WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tombol menuju wa.me. URL selalu dibangun di server dari Settings
 * (lib/whatsapp.ts). Bila nomor belum diatur, tombol tampil nonaktif
 * dengan keterangan, bukan link rusak.
 */
export function WhatsAppButton({
  href,
  children,
  variant = "primary",
  size = "lg",
  className,
  showIcon = true,
  magnetic = false,
}: {
  href: string | null;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  /** Tombol mengikuti kursor sedikit (lihat motion/magnetic.tsx). */
  magnetic?: boolean;
}) {
  if (!href) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title="Nomor WhatsApp admin belum diatur"
        className={cn(buttonClasses({ variant, size }), "cursor-not-allowed opacity-50", className)}
      >
        {showIcon ? <WhatsappLogoIcon size={18} aria-hidden="true" /> : null}
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-magnetic={magnetic ? "" : undefined}
      className={buttonClasses({ variant, size, className })}
    >
      {showIcon ? <WhatsappLogoIcon size={18} aria-hidden="true" /> : null}
      {children}
    </a>
  );
}

/** Tombol bulat mengambang untuk konsultasi cepat. */
export function FloatingWhatsApp({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Konsultasi via WhatsApp"
      data-magnetic=""
      className="fixed bottom-5 right-5 z-30 grid size-13 place-items-center rounded-full bg-ink text-surface shadow-pop transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-ink/88 active:scale-95 md:bottom-8 md:right-8"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <WhatsappLogoIcon size={24} aria-hidden="true" />
    </a>
  );
}

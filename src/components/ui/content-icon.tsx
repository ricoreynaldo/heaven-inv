import {
  CalendarHeartIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  ClockIcon,
  CrownIcon,
  CursorClickIcon,
  DeviceMobileIcon,
  EnvelopeOpenIcon,
  EyeIcon,
  FlowerLotusIcon,
  GiftIcon,
  HeartIcon,
  ImagesIcon,
  LightningIcon,
  MapPinIcon,
  MusicNotesIcon,
  PaletteIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StarIcon,
  WalletIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon, IconWeight } from "@phosphor-icons/react";
import type { IconKey } from "@/lib/icon-keys";

const REGISTRY: Record<IconKey, Icon> = {
  sparkle: SparkleIcon,
  crown: CrownIcon,
  "device-mobile": DeviceMobileIcon,
  "share-network": ShareNetworkIcon,
  lightning: LightningIcon,
  wallet: WalletIcon,
  heart: HeartIcon,
  "flower-lotus": FlowerLotusIcon,
  palette: PaletteIcon,
  "cursor-click": CursorClickIcon,
  eye: EyeIcon,
  "chat-circle-dots": ChatCircleDotsIcon,
  "whatsapp-logo": WhatsappLogoIcon,
  "envelope-open": EnvelopeOpenIcon,
  "check-circle": CheckCircleIcon,
  gift: GiftIcon,
  "calendar-heart": CalendarHeartIcon,
  "map-pin": MapPinIcon,
  "music-notes": MusicNotesIcon,
  images: ImagesIcon,
  clock: ClockIcon,
  "shield-check": ShieldCheckIcon,
  star: StarIcon,
};

export function ContentIcon({
  name,
  size = 24,
  weight = "light",
  className,
}: {
  name: string;
  size?: number;
  weight?: IconWeight;
  className?: string;
}) {
  const Component = REGISTRY[name as IconKey] ?? SparkleIcon;
  return <Component size={size} weight={weight} className={className} aria-hidden="true" />;
}

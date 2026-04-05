import type { IconType } from "react-icons";
import { HiOutlineChartBar, HiOutlineCog6Tooth, HiOutlineUserGroup } from "react-icons/hi2";
import { PiChartLineUp, PiCheckSquareOffset, PiCurrencyDollarSimple, PiTarget } from "react-icons/pi";
import { TbBriefcase2, TbCircleDot, TbUserSquareRounded, TbWaveSine } from "react-icons/tb";
import type { IconKey } from "@/components/ui/types";

const ICONS: Record<IconKey, IconType> = {
  leads: PiTarget,
  tasks: PiCheckSquareOffset,
  stats: HiOutlineChartBar,
  settings: HiOutlineCog6Tooth,
  business: TbBriefcase2,
  status: TbCircleDot,
  owner: TbUserSquareRounded,
  source: HiOutlineUserGroup,
  nextTask: TbWaveSine,
  sale: PiCurrencyDollarSimple,
};

export function getIcon(key: IconKey) {
  return ICONS[key];
}

export function Icon({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) {
  const Component = ICONS[name] ?? PiChartLineUp;
  return <Component className={className} />;
}


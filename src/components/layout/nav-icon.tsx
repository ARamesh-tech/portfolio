import { Briefcase, Cpu, FolderKanban, Home, Mail, PenLine, User, type LucideProps } from "lucide-react";
import type { NavIcon as NavIconName } from "@/lib/site";

const icons = {
  home: Home,
  briefcase: Briefcase,
  folder: FolderKanban,
  cpu: Cpu,
  user: User,
  mail: Mail,
  pen: PenLine,
} satisfies Record<NavIconName, React.ComponentType<LucideProps>>;

export function NavIcon({ name, ...props }: { name: NavIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon {...props} />;
}

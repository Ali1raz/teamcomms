import { UserImage } from "@/components/general/user-avatar";
import type { User } from "@/lib/auth";
import { formatLocalDateTime } from "@/lib/utils";

interface iAppProps {
  user: User;
  details?: {
    label: string;
    value: string | number;
  }[];
}

export function UserDetailsSection({ user, details }: iAppProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:items-start gap-4 sm:flex-row w-full overflow-hidden text-ellipsis">
        <div className="size-32">
          <UserImage
            className="rounded-full object-cover w-full h-full size-30"
            name={user.name}
            image={user.image}
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <h2>{user.email}</h2>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-y p-2 my-6">
        {[
          { label: "Joined", value: formatLocalDateTime(user.createdAt) },
          ...(details || []),
        ].map((item) => (
          <div key={item.label}>
            <span className="text-muted-foreground/80 ">{item.label}: </span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckIcon, MessageCircle, XIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const useTestUsers = () => {
  const user = useQuery(api.functions.user.get);
  if (!user) {
    return [];
  } else {
    return [user, user, user];
  }
};

export function PendingFriendsList() {
  const users = useTestUsers();
  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-medium text-muted-foreground p-2.5">
        Pending friends
      </h2>
      {users.length == 0 && (
        <FriendListEmpty>No Pending friends requests </FriendListEmpty>
      )}
      {users.map((user, index) => (
        <FriendItem key={index} username={user.username} image={user.image}>
          <IconButton
            title="Accept"
            icon={<CheckIcon />}
            className="bg-green-500"
          />
          <IconButton
            title="Reject"
            icon={<CheckIcon />}
            className="bg-red-500"
          />
        </FriendItem>
      ))}
    </div>
  );
}

export function AcceptedFriendsList() {
  const users = useTestUsers();
  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-medium text-muted-foreground p-2.5">
        Accepted friends
      </h2>
      {users.length == 0 && (
        <FriendListEmpty>No friends yet 😔</FriendListEmpty>
      )}
      {users.map((user, index) => (
        <FriendItem key={index} username={user.username} image={user.image}>
          <IconButton title="Start DM" icon={<MessageCircle />} className="" />
          <IconButton title="Remove" icon={<XIcon />} className="bg-red-500" />
        </FriendItem>
      ))}
    </div>
  );
}
function FriendListEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted/50 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
function IconButton({
  title,
  className,
  icon,
}: {
  title: string;
  className?: string;
  icon: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn("rounded-full", className)}
          size="icon"
          variant="outline"
        >
          {icon}
          <span className="sr-only">{title}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
function FriendItem({
  username,
  image,
  children,
}: {
  username: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center p-2.5 gap-2.5">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 border">
          <AvatarImage src={image}></AvatarImage>
          <AvatarFallback />
        </Avatar>
        <p className="text-sm font-medium">{username}</p>
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

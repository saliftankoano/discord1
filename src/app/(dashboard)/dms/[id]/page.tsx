"use client";
import { useMutation, useQuery } from "convex/react";
import { use, useRef, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LoaderIcon,
  MoreVerticalIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../../convex/_generated/dataModel";
import { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import Image from "next/image";
export default function MessagePage({
  params,
}: {
  params: Promise<{ id: Id<"directMessages"> }>;
}) {
  const { id } = use(params);
  const directMessage = useQuery(api.functions.dm.get, {
    id,
  });
  const messages = useQuery(api.functions.message.list, {
    directMessage: id,
  });
  if (!directMessage) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col divide-y max-h-screen">
      <header className="flex items-center gap-2 p-4">
        <Avatar className="size-8 border">
          <AvatarImage src={directMessage.user.image} />
          <AvatarFallback />
        </Avatar>
        <h1 className="font-semibold">{directMessage.user.username}</h1>
      </header>
      <ScrollArea className="h-full py-4">
        {messages?.map((message) => (
          <MessageItem key={message._id} message={message} />
        ))}
      </ScrollArea>
      <TypingIndicators directMessage={id} />
      <MessageInput directMessage={id} />
    </div>
  );
}
function TypingIndicators({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const usernames = useQuery(api.functions.typing.list, { directMessage });
  if (!usernames || usernames.length === 0) {
    return null;
  }
  return (
    <div className="text-sm text-muted-foreground px-4 py-2">
      {usernames.join(", ")} is typing...
    </div>
  );
}
type Message = FunctionReturnType<typeof api.functions.message.list>[number];

function MessageItem({ message }: { message: Message }) {
  return (
    <div className="flex items-center px-4 gap-2 py-2">
      <Avatar className="size-8 border">
        {message.sender && <AvatarImage src={message.sender?.image} />}
        <AvatarFallback />
      </Avatar>
      <div className="flex flex-col mr-auto">
        <p className="text-xs text-muted-foreground">
          {message.sender?.username ?? "Deleted user"}
        </p>
        {message.deleted ? (
          <>
            <p className="text-sm text-destructive">
              Message was deleted!{" "}
              <span>It contains: {message.deletedReason} </span>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{message.content}</p>
            {message.attachment && (
              <Image
                className="rounded border overflow-hidden"
                src={message.attachment}
                width={300}
                height={300}
                alt="image attachment"
              />
            )}
          </>
        )}
      </div>
      <MessageActions message={message} />
    </div>
  );
}

function MessageActions({ message }: { message: Message }) {
  const user = useQuery(api.functions.user.get);
  const removeMutation = useMutation(api.functions.message.remove);
  if (!user || message.sender?._id !== user?._id) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVerticalIcon className="size-4 text-muted-foreground" />
        <span className="sr-only"> Messsage Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => removeMutation({ id: message._id })}
        >
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessageInput({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const [content, setContent] = useState("");
  const sendMessage = useMutation(api.functions.message.create);
  const sendTypingIndicator = useMutation(api.functions.typing.upsert);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(
    api.functions.message.generateUploadUrl
  );
  const removeAttachment = useMutation(api.functions.storage.remove);
  const [attachment, setAttachment] = useState<Id<"_storage">>();
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setFile(file);
    setIsUploading(true);
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      body: file,
    });
    const result = await res.json();

    const { storageId } = result as { storageId: Id<"_storage"> };
    setAttachment(storageId);
    setIsUploading(false);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendMessage({ directMessage, attachment, content });
      setContent("");
      setAttachment(undefined);
      setFile(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to send message.", {
        description:
          error instanceof Error ? error.message : "An unknown error occcured",
      });
    }
  };
  return (
    <>
      <form className="flex items-end p-4 gap-2" onSubmit={handleSubmit}>
        <Button
          type="button"
          size="icon"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <PlusIcon />
          <span className="sr-only">Attach</span>
        </Button>
        <div className="flex flex-col flex-1 gap-2">
          {file && (
            <ImagePreview
              file={file}
              isUploading={isUploading}
              onDelete={() => {
                if (attachment) {
                  removeAttachment({ storageId: attachment });
                }
                setAttachment(undefined);
                setFile(undefined);
              }}
            />
          )}
          <Input
            placeholder="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.currentTarget.value.length > 0) {
                sendTypingIndicator({ directMessage });
              }
            }}
          />
        </div>

        <Button size="icon">
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
    </>
  );
}

function ImagePreview({
  file,
  isUploading,
  onDelete,
}: {
  file: File;
  isUploading: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="relative size-40 overflow-hidden rounded border">
      <Image
        src={URL.createObjectURL(file)}
        width={300}
        height={300}
        alt="image attachment"
      />
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <LoaderIcon className="animate-spin size-8" />
        </div>
      )}
      <Button
        type="button"
        className="absolute top-2 right-2"
        variant="destructive"
        size="icon"
        onClick={onDelete}
      >
        <TrashIcon />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
}

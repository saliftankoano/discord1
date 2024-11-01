"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import React, { useState } from "react";
import { toast } from "sonner";

export function AddFriend() {
  const [open, setOpen] = useState(false);
  const createFriendRequest = useMutation(
    api.functions.friends.createFriendRequest
  );
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createFriendRequest({ username: e.currentTarget.username.value });
      toast.success("Friend request sent");
    } catch (error) {
      toast.error("Failed to send your friend request", {
        description: "An error occured",
      });
      console.log(error);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add friend</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add friend</DialogTitle>
          <DialogDescription>
            You can add a friend using their username
          </DialogDescription>
        </DialogHeader>
        <form className="contents" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" />
          </div>
          <DialogFooter>
            <Button>Send friend request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

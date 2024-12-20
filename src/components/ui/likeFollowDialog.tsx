import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "./label";
import { Input } from "./input";
import { useState } from "react";
import { Button } from "./button";
import { Session } from "@/types/types";
import { follow, isValidPostUrl, isValidProfileUrl, like } from "@/utls/utls";
import { addStatusToSessionInDb } from "@/utls/utls";
export function LikeFollowDialog({
  onSubmit,
  setSessions,
  session,
  isMultiple,
  type,
  database,
}: {
  onSubmit: (post: string, type: "like" | "follow") => void;
  setSessions: any;
  session: any;
  isMultiple: boolean;
  type: "like" | "follow";
  database: any;
}) {
  const [post, setPost] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isError, setIsError] = useState<string>("");

  async function handleSubmit() {
    if (!post.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    setError("");

    if (isMultiple) {
      await onSubmit(post, type);
    } else {
      console.log(session);
      console.log(typeof session.cookies);

      if (type === "like") {
        const { isValid, postId } = isValidPostUrl(post);
        if (!isValid) {
          setIsError("Please enter a valid post URL");
          return;
        }

        setSessions((prev: Session[]) =>
          prev.map((sess: Session) =>
            sess.email === session.email
              ? {
                  ...sess,
                  status: { success: false, loading: true, message: "" },
                }
              : sess
          )
        );

        await addStatusToSessionInDb(session.email, { success: false, loading: true, message: "" }, database);

        let data = await like(session.cookies, `p/${postId}`)
        
        setSessions((prev: Session[]) =>
          prev.map((sess: Session) =>
            sess.email === session.email
              ? {
                  ...sess,
                  status: {
                    success: data?.status?.success,
                    loading: false,
                    message: data?.status?.message,
                  },
                }
              : sess
          )
        );
        await addStatusToSessionInDb(session.email, { success: data?.status?.success, loading: false, message: "" }, database);

      } else if (type === "follow") {
        const { isValid, username } = isValidProfileUrl(post);
        if (!isValid) {
          setIsError("Please enter a valid profile URL");
          return;
        }
        setSessions((prev: Session[]) =>
          prev.map((sess: Session) =>
            sess.email === session.email
              ? {
                  ...sess,
                  status: { success: false, loading: true, message: "" },
                }
              : sess
          )
        );
        await addStatusToSessionInDb(session.email, { success: false, loading: true, message: "" }, database);

        let data = await follow(session.cookies, username)

        setSessions((prev: Session[]) =>
          prev.map((sess: Session) =>
            sess.email === session.email
              ? {
                  ...sess,
                  status: {
                    success: data?.status?.success,
                    loading: false,
                    message: data?.status?.message,
                  },
                }
              : sess
          )
        );
        await addStatusToSessionInDb(session.email, { success: data?.status?.success, loading: false, message: data?.status?.message }, database);

      }
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{type === "like" ? "Like" : "Follow"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "like" ? "Like a post" : "Follow a user"}
          </DialogTitle>
        </DialogHeader>

        <Label htmlFor="post">Post</Label>
        <Input
          id="post"
          onChange={(e) => setPost(e.target.value)}
          onFocus={() => setError("")}
        />

        <DialogFooter>
          <div className="w-full flex justify-between items-center">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {isError && <p className="text-sm text-red-500">{isError}</p>}
            <Button type="submit" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

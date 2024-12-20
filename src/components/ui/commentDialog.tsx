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
import { Session } from "@/types/types";
import { addStatusToSessionInDb, comment, getFollowers, updateSessionInDatabase } from "@/utls/utls";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { isValidPostUrl, isValidProfileUrl } from "@/utls/utls";

export function CommentDialog({
  onSubmit,
  session,
  isMultiple,
  setSessions,
  database,
}: {
  onSubmit: any;
  session: any;
  isMultiple: boolean;
  setSessions: any;
  database: any;
}) {
  const [comments, setComments] = useState<string[]>([]);
  const [post, setPost] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState<string>("");
  const [isFollowerListSelected, setIsFollowerListSelected] = useState(false);
  const [profile, setProfile] = useState<string>("");
  function preparePostIdFromLink(link: string) {
    const match = link.match(/\/p\/([^/?]+)/);
    // Return the captured group if found, otherwise return empty string
    return match ? match[1] : "";
  }

  async function handleSubmit() {
    if (isMultiple) {
      const { isValid: isValidPost, postId } = isValidPostUrl(post);
      if (!isValidPost) {
        setIsError("Please enter a valid post URL");
        return;
      }

      if (isFollowerListSelected) {
        const { isValid, username } = isValidProfileUrl(profile);

        if (!isValid) {
          setIsError("Please enter a valid profile URL");
          return;
        }
        if (!comments.length) {
          setIsError("Please enter comment");
          return;
        }

        if (!comments[0].includes("?")) {
          setIsError("Please enter comment with '?'");
          return;
        }

        await onSubmit(comments, postId, username);
      } else {
        await onSubmit(comments, postId, null);
      }
    } else {
      if (isFollowerListSelected) {
        const { isValid, username } = isValidProfileUrl(profile);
        if (!isValid) {
          setIsError("Please enter a valid profile URL");
          return;
        }

        const { isValid: isValidPost, postId } = isValidPostUrl(post);
        if (!isValidPost) {
          setIsError("Please enter a valid post URL");
          return;
        }

        if (!comments.length) {
          setIsError("Please enter comment");
          return;
        }

        if (!comments[0].includes("?")) {
          setIsError("Please enter comment with '?'");
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
        const followersData = await getFollowers(session.cookies, username);

        if (!followersData.status.success) {
          setSessions((prev: Session[]) =>
            prev.map((sess: Session) =>
              sess.email === session.email
                ? {
                    ...sess,
                    status: {
                      success: followersData?.status?.success,
                      loading: false,
                      message: followersData?.status?.message,
                    },
                  }
                : sess
            )
          );
        await addStatusToSessionInDb(session.email, { success: followersData?.status?.success, loading: false, message: followersData?.status?.message }, database);

        }

        // setSessions((prev: Session[]) =>
        //   prev.map((sess: Session) =>
        //     sess.email === session.email
        //       ? {
        //           ...sess,
        //           status: {
        //             success: followersData?.status?.success,
        //             loading: false,
        //             message: followersData?.status?.message,
        //           },
        //         }
        //       : sess
        //   )
        // );

        const commentsFromUsernames = followersData.followers.map(
          (follower: any) => {
            return follower.id;
          }
        );

        const commenting = await comment(
          session.cookies,
          commentsFromUsernames.slice(3),
          `p/${postId}/`
        );

        setSessions((prev: Session[]) =>
          prev.map((sess: Session) =>
            sess.email === session.email
              ? {
                  ...sess,
                  status: {
                    success: commenting?.status?.success,
                    loading: false,
                    message: commenting?.status?.message,
                  },
                }
              : sess
          )
        );
        await addStatusToSessionInDb(session.email, { success: commenting?.status?.success, loading: false, message: commenting?.status?.message }, database);
      } else {
        const { isValid: isValidPost, postId } = isValidPostUrl(post);
        if (!isValidPost) {
          setIsError("Please enter a valid post URL");
          return;
        }

        if (!comments.length) {
          setIsError("Please enter comment");
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
        const commenting = await comment(
          session.cookies,
          comments,
          `p/${postId}/`
        );

        setSessions((prev: Session[]) =>
          prev.map((sess: Session) =>
            sess.email === session.email
              ? {
                  ...sess,
                  status: {
                    success: commenting?.status?.success,
                    loading: false,
                    message: commenting?.status?.message,
                  },
                }
              : sess
          )
        );
        await addStatusToSessionInDb(session.email, { success: commenting?.status?.success, loading: false, message: commenting?.status?.message }, database);
    }

    setComments([]);
  }
}

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Comment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comment on a post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Post
            </Label>
            <Input
              id="post"
              className="col-span-3"
              onChange={(e) => setPost(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isFollowerListSelected"
              checked={isFollowerListSelected}
              onCheckedChange={(e) => setIsFollowerListSelected(e as boolean)}
            />
            <Label htmlFor="isFollowerListSelected">Use follower list</Label>
          </div>

          {isFollowerListSelected && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Profile
                </Label>
                <Input
                  id="profile"
                  className="col-span-3"
                  onChange={(e) => setProfile(e.target.value)}
                />
              </div>

              <span>
                Adjust the "?" to where you want the username to be in the
                comment
              </span>
              <span>Ex : 'Hi, ?' = 'Hi, username'</span>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Comment
            </Label>
            <Input
              id="comment"
              value={comments[0]}
              onChange={(e) => setComments([e.target.value])}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          {isError && <p className="text-sm text-red-500">{isError}</p>}
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

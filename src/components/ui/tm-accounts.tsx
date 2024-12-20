"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CommentDialog } from "@/components/ui/commentDialog";
import { Session } from "@/types/types";
import {
  scrape,
  deleteSessionFromDatabase,
  getAllSessionsFromDatabase,
  isValidPostUrl,
  isValidProfileUrl,
  addStatusToSessionInDb,
  getFollowers,
  comment,
} from "@/utls/utls";
import { useEffect } from "react";
import { LikeFollowDialog } from "./likeFollowDialog";
import { Label } from "./label";

export function TMAccounts({ database }: { database: any }) {
  const [data, setData] = React.useState<Session[]>([]);
  const [url, setUrl] = React.useState("https://www.ticketmaster.com/");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [selectedSessions, setSelectedSessions] = React.useState<Session[]>([]);

  const handleScrape = async (session: Session) => {
    await scrape(url, session.user_agent, session.proxy || "", session.cookies);
  };

  const handleBulkScrape = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    for (const row of selectedRows) {
      await handleScrape(row.original);
    }
  };

  async function handleBulkComment(comments: string[], postId: string, username: string | null) {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if(username){
      const firstSession = selectedRows[0].original

      const followersData = await getFollowers(firstSession.cookies, username);

        if (!followersData.status.success) {
          setData((prev: Session[]) =>
            prev.map((sess: Session) =>
              sess.email === firstSession.email
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
        await addStatusToSessionInDb(firstSession.email, { success: followersData?.status?.success, loading: false, message: followersData?.status?.message }, database);

        }


        const commentsFromUsernames = followersData.followers.map(
          (follower: any) => {
            return follower.id;
          }
        );

        for (const row of selectedRows) {
          const session = row.original;
          const commenting = await comment(
            session.cookies,
            commentsFromUsernames.slice(3),
            `p/${postId}/`
          );
  
          setData((prev: Session[]) =>
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


      // const commenting = await fetch(`http://localhost:3005/api/comment`, {
      //   method: "POST",
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     cookies: session.cookies,
      //     comments: commentsFromUsernames.slice(3),
      //     url: `p/${postId}/`
      //   })
      // })
    }
  }

  async function handleBulkLikeFollow(post: string, type: "like" | "follow") {
    console.log(post, type);
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    for (const row of selectedRows) {
      const session = row.original;

      if (type === "like") {
        const { isValid, postId } = isValidPostUrl(post);

        setData((prev: Session[]) =>
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

        let res = await fetch(`http://localhost:3005/api/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cookies: session.cookies,
            url: `p/${postId}`,
          }),
        });

        const data = await res.json();
        setData((prev: Session[]) =>
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
      } else if (type === "follow") {
        const { isValid, username } = isValidProfileUrl(post);

        setData((prev: Session[]) =>
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
          
        let res = await fetch(`http://localhost:3005/api/follow`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cookies: session.cookies,
            userName: username,
          }),
        });

        const data = await res.json();
        setData((prev: Session[]) =>
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

  useEffect(() => {
    getAllSessionsFromDatabase(database).then((sessions) => {
      setData(sessions);
    });
  }, [database]);

  const columns: ColumnDef<Session>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "password",
      header: "Password",
    },

    {
      accessorKey: "cookies",
      header: "Cookies",
      cell: ({ row }) => {
        const cookies = row.getValue("cookies");
        return <div>{cookies ? Object.keys(cookies).length : "-"}</div>;
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex gap-2">
            <CommentDialog
              onSubmit={handleBulkComment}
              session={session}
              isMultiple={false}
              setSessions={setData}
              database={database}
            />
            <LikeFollowDialog
              session={session}
              isMultiple={false}
              onSubmit={handleBulkLikeFollow}
              setSessions={setData}
              type="like"
              database={database}
            />
            <LikeFollowDialog
              session={session}
              isMultiple={false}
              onSubmit={handleBulkLikeFollow}
              setSessions={setData}
              type="follow"
              database={database}
            />

            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await deleteSessionFromDatabase(session.email, database);
                setData(data.filter((item) => item.email !== session.email));
              }}
            >
              Remove
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        if (row.original.status?.loading)
          return <Loader2 className="h-4 w-4 animate-spin" />;
        if (row.original.status?.success)
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        return (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-red-500">{row.original.status?.message}</p>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {table.getFilteredSelectedRowModel().rows.length > 1 && (
        <div>
          <Label className="text-lg font-bold">Bulk actions</Label>
          <div className="flex gap-2">
            <CommentDialog
              onSubmit={handleBulkComment}
              session={null}
              isMultiple={true}
              setSessions={setData}
              database={database}

            />
            <LikeFollowDialog
              session={null}
              isMultiple={true}
              onSubmit={handleBulkLikeFollow}
              setSessions={setData}
              type="like"
              database={database}
            />
            <LikeFollowDialog
              session={null}
              isMultiple={true}
              onSubmit={handleBulkLikeFollow}
              setSessions={setData}
              type="follow"
              database={database}
            />
          </div>
        </div>
      )}
      <div className="flex items-center py-4">
        {/* <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        /> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

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
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { useEffect, useState } from "react";
import { Session } from "@/types/types";

import { getAllSessionsFromDatabase, scrape } from "@/utls/utls";

export type ScrapeUrl = {
  url: string;
  pages: number;
  sessions: Session[];
};

export function ScrapeTable({
  urls,
  setUrls,
  database,
}: {
  urls: ScrapeUrl[];
  setUrls: (urls: ScrapeUrl[]) => void;
  database: any;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  // const [accounts, setAccounts] = useState<ImportedAccount[]>([]);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);

  // Form state
  const [newUrl, setNewUrl] = useState("");
  const [newPages, setNewPages] = useState("");

  function scrapeWithSession(sessions: Session[], url: string) {
    sessions.forEach((session) => {
      scrape(url, session.user_agent, session.proxy || "", session.cookies);
      console.log(session)
    });
  }

  useEffect(() => {
    getAllSessionsFromDatabase(database).then((sessions) => {
      setAllSessions(sessions);
      setSessions(sessions);
    });
  }, [database]);

  const columns: ColumnDef<ScrapeUrl>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: "url",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          URL
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "pages",
      header: "Number of Pages",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="felx gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Handle opening URL
                // window.open(row.original.url, '_blank');
                console.log(row.original);
                scrapeWithSession(row.original.sessions, row.original.url);
              }}
            >
              Open
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Handle opening URL
                // window.open(row.original.url, '_blank');
                console.log(row.original);
                setUrls(urls.filter((url) => url.url !== row.original.url));
                // scrapeWithSession(row.original.sessions, row.original.url);
              }}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: urls,
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

  const handleAddUrl = () => {
    if (newUrl && newPages) {
      const sessionsToUse = sessions.slice(0, parseInt(newPages));
      const remainingSessions = sessions.slice(parseInt(newPages));

      setSessions(remainingSessions);

      setUrls([
        ...urls,
        { url: newUrl, pages: parseInt(newPages), sessions: sessionsToUse },
      ]);
      setNewUrl("");
      setNewPages("");
    }
  };

  const handleOpenSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    selectedRows.forEach((row) => {
      scrapeWithSession(row.original.sessions, row.original.url);
    });
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-10">
        <Input
          placeholder="Enter URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1"
        />
        <div className="relative">
          <Input
            type="number"
            placeholder="Pages"
            value={newPages}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!value || (value > 0 && value <= sessions.length)) {
                setNewPages(e.target.value);
              }
            }}
            max={sessions.length}
            min={1}
            className="w-24"
          />
          <span className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
            Available: {sessions.length}
          </span>
        </div>
        <Button onClick={handleAddUrl} disabled={!newUrl || !newPages}>
          Add
        </Button>
      </div>

      {urls.length > 0 && (
        <div className="space-y-4">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button onClick={handleOpenSelected}>
              Open {table.getFilteredSelectedRowModel().rows.length} URLs
            </Button>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
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
                      No URLs added.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

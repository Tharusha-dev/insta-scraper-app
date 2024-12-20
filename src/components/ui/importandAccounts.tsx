// src/components/ui/imported-accounts-table.tsx
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
import { ArrowUpDown, CheckCircle, ChevronDown, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { getSessionFromDatabase, makeLoggedInBrowser } from "@/utls/utls";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Label } from "@radix-ui/react-label";

export type ImportedAccount = {
  email: string;
  password: string;
  isAlreadyAdded: boolean;
  status:  {
    success: boolean;
    loading: boolean;
    message: string;
  } | null;
};

export function ImportedAccountsTable({ database, importedAccounts, setImportedAccounts }: { database: any, importedAccounts: ImportedAccount[], setImportedAccounts: (accounts: ImportedAccount[]) => void }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [importedAccounts, setImportedAccounts] = useState<
  //   Array<ImportedAccount>
  // >([]);
  const [importStatus, setImportStatus] = useState<{
    success: number;
    total: number;
  } | null>(null);

  const handleLogin = async (account: ImportedAccount) => {

    //@ts-ignore
    setImportedAccounts((prev: ImportedAccount[]) =>
      prev.map((acc: ImportedAccount) =>
        acc.email === account.email
          ? { ...acc, status: { success: false, loading: true, message: "" } }
          : acc
      )
    );

    const res = await makeLoggedInBrowser(
      account.email,
      account.password,
      null,
      null,
      database
    );

    if(!res){
      //@ts-ignore
      setImportedAccounts((prev: ImportedAccount[]) =>
        prev.map((acc: ImportedAccount) =>
          acc.email === account.email
            ? { ...acc, status: { success: false, loading: false, message: "Internal error" } }
            : acc
        )
      );
    }else {
    //@ts-ignore

      setImportedAccounts((prev: ImportedAccount[]) =>
        prev.map((acc: ImportedAccount) =>
          acc.email === account.email
            ? { ...acc, status: { success: res?.status?.success, loading: false, message: res?.status?.message } }
            : acc
        )
      );
    }
  };

  const handleBulkLogin = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    for (const row of selectedRows) {
      await handleLogin(row.original);
    }
  };

  const columns: ColumnDef<ImportedAccount>[] = [
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "password",
      header: "Password",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLogin(account)}
            >
              {account.isAlreadyAdded ? "Update" : "Login"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              //   onClick={() => removeAccount(row.index)}
            >
              Open
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeAccount(row.index)}
            >
              Remove
            </Button>
          </div>
        );
      },
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        if(row.original.status?.loading) return <Loader2 className="h-4 w-4 animate-spin" />;
        if(row.original.status?.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
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
    data: importedAccounts,
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setImportStatus(null);
  };

  const handleImport = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const accounts = await Promise.all(
        lines.map(async (line) => {
          const [email, password] = line
            .split(",")
            .map((item) => item.trim());

          const res = await getSessionFromDatabase(email, database);
          console.log(res);

          const isAlreadyAdded = await getSessionFromDatabase(email, database);

          return { email, password, isAlreadyAdded, status: null };
        })
      );

      // Now filter the resolved values
      const filteredAccounts = accounts.filter(
        (account) => account.email && account.password
      );

      setImportedAccounts(filteredAccounts);
      setImportStatus({
        success: filteredAccounts.length,
        total: lines.length,
      });
    };
    reader.readAsText(selectedFile);
  };

  const clearImportedAccounts = () => {
    setImportedAccounts([]);
    setSelectedFile(null);
    setImportStatus(null);
  };

  const removeAccount = (index: number) => {
    //@ts-ignore

    setImportedAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New</CardTitle>
        <CardDescription>Make new browser sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csvFile">Import accounts from CSV</Label>
          <div className="flex gap-2">
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button onClick={handleImport} disabled={!selectedFile}>
              Import
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-gray-500">
              Selected file: {selectedFile.name}
            </p>
          )}
          {importStatus && (
            <p className="text-sm text-gray-500">
              Successfully imported {importStatus.success} out of{" "}
              {importStatus.total} accounts
            </p>
          )}
        </div>

        {importedAccounts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Imported Accounts</h3>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearImportedAccounts}
              >
                Clear All
              </Button>
            </div>

            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button className="my-2" onClick={handleBulkLogin}>
                Bulk Login ({table.getFilteredSelectedRowModel().rows.length}{" "}
                accounts)
              </Button>
            )}
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter emails..."
                value={
                  (table.getColumn("email")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("email")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
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
        )}
      </CardContent>
    </Card>
  );
}

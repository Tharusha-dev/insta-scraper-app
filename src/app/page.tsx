"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccountManager } from "@/components/ui/account-manager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Database from "tauri-plugin-sql-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrapeTable } from "@/components/ui/scrape";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import SessionCard from "@/components/ui/session-card";
import { ImportedAccountsTable } from "@/components/ui/importandAccounts";
import {
  getSessionFromDatabase,
  makeLoggedInBrowser,
  getAllSessionsFromDatabase,
} from "@/utls/utls";

import {TMAccounts} from "@/components/ui/tm-accounts"

export default function Home() {
  const [database, setDatabase] = useState<any>(null);
  const [sessions, setSessions] = useState<any>([]);

  const [accounts, setAccounts] = useState<any>([]);
  const [urls, setUrls] = useState<any>([]);

  useEffect(() => {
    async function initDatabase() {
      const db = await Database.load("sqlite:test.db");
      // Create sessions table if it doesn't exist
      await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        email TEXT PRIMARY KEY,
        password TEXT,
        user_agent TEXT,
        proxy TEXT,
        cookies TEXT,
        status TEXT
      )
    `);
      setDatabase(db);
    }
    initDatabase();
  }, []);

  return (
    <div className="w-screen h-screen p-5">
      <Tabs defaultValue="start" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
        
          <TabsTrigger value="start">Start</TabsTrigger>
          <TabsTrigger value="import">Add accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="start">
         <TMAccounts database={database} />
        </TabsContent>
       
        <TabsContent value="import">
          <ImportedAccountsTable
            database={database}
            importedAccounts={accounts}
            setImportedAccounts={setAccounts}
          />
        </TabsContent>
      </Tabs>
     
    </div>
  );
}

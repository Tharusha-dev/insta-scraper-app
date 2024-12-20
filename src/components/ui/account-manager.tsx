import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TMAccounts } from "./tm-accounts";
import { Input } from "./input";

export function AccountManager({ database }: { database: any }) {
  return (
    <div className="w-full">

      <Tabs defaultValue="tm" className="w-full" >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tm">Instagram Accounts</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Accounts</TabsTrigger>
         
        </TabsList>
        <TabsContent value="tm">


        
          <TMAccounts database={database} />
        </TabsContent>
        <TabsContent value="recovery">
          {/* <AccountManager data={sessions} database={database} /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

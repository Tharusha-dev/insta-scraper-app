import { UserIcon, GlobeIcon, MailIcon, LockOpenIcon as LockClosedIcon, CookieIcon, TrashIcon } from 'lucide-react'
import { Button } from './button'

type Session = {
  user_agent: string
  proxy: string | null
  email: string
  password: string
  cookies: any
}


export default function SessionCard({ session }: { session: Session }) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center">
            <div className="flex items-center text-sm col-span-2 sm:col-span-3 md:col-span-1">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate" title={session.user_agent}>{session.user_agent}</span>
            </div>
            <div className="flex items-center text-sm">
              <GlobeIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <span>{session.proxy || "-"}</span>
            </div>
            <div className="flex items-center text-sm">
              <MailIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">{session.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <LockClosedIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <span>{session.password}</span>
            </div>
            <div className="flex items-center text-sm">
              <CookieIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <span>{session.cookies.length} cookies</span>
            </div>

            <Button onClick={async () => {
              //cookies, userAgent, proxy, url
              console.log(session)
              await fetch("http://localhost:3001/goto-page-with-session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  cookies: session.cookies,
                  userAgent: session.user_agent,
                  proxy: session.proxy,
                  url: "https://www.ticketmaster.com/"
                }),
              })
            }}>
              <span>Open</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }
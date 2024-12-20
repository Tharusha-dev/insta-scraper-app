import { Session } from "@/types/types";

const API_URL = "http://localhost:3005";

export async function scrape(
  url: string,
  userAgent: string,
  proxy: string,
  cookies: any
) {
  try {
    const res = await fetch(`${API_URL}/goto-page-with-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, userAgent, proxy, cookies }),
    });
  } catch (error) {
    console.error("Failed to scrape:", error);
  }
}

export async function makeLoggedInBrowser(
  email: string,
  password: string | null,
  proxy: string | null,
  userAgent: string | null,
  database: any
) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: email, password: password}),
    });

    const data = await res?.json();

    if (res?.status !== 200) return data;

    await database.execute(
      `INSERT OR REPLACE INTO sessions (email, password, user_agent, proxy, cookies, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, password, null, null, JSON.stringify(data?.cookies), null]
    );
    console.log("Session saved to database");
    return data;
  } catch (error) {
    console.error("Failed to save session to database:", error);

    return null;
  }
}

export async function addStatusToSessionInDb(email: string, status: any, database: any) {
  const statusString = JSON.stringify(status);
  await database.execute(`UPDATE sessions SET status = $1 WHERE email = $2`, [statusString, email]);
}

export async function deleteSessionFromDatabase(email: string, database: any) {
  await database.execute(`DELETE FROM sessions WHERE email = $1`, [email]);
}

export async function getSessionFromDatabase(email: string, database: any) {
  const res = await database.select(`SELECT * FROM sessions WHERE email = $1`, [
    email,
  ]);
  return res?.[0];
}

export async function updateSessionInDatabase(email: string, userAgent: string, proxy: string, database: any) {
  const res = await database.execute(`UPDATE sessions SET user_agent = $1, proxy = $2 WHERE email = $3`, [userAgent, proxy, email]);
  console.log(res);
  return res;
}


export async function getAllSessionsFromDatabase(database: any) {
  const sessions = await database.select("SELECT * FROM sessions");



  
  const sessionsWithStatus = sessions.map((session: any) => ({
    ...session,
    status: session.status ? (() => {
      try {
        return JSON.parse(session.status);
      } catch (error) {
        return null;
      }
    })() : null
  }));
  console.log(sessionsWithStatus);
  return sessionsWithStatus;
}


export function isValidPostUrl(url: string) {
  try {
    const urlObj = new URL(url);
    
    // Check if it's an Instagram domain
    if (!urlObj.hostname.includes('instagram.com')) {
      return {isValid: false, postId: ""};
    }

    // Check if it follows the /p/{post-id} pattern
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2 || pathParts[0] !== 'p') {
      return {isValid: false, postId: ""};
    }

    // Validate that there's a post ID
    const postId = pathParts[1];
    if (!postId) {
      return {isValid: false, postId: ""};
    }

    return {isValid: true, postId: postId};
  } catch (error) {
    // If URL parsing fails, it's invalid
    return {isValid: false, postId: ""};
  }
}

export function isValidProfileUrl(url: string) {
  try {
    const urlObj = new URL(url);
    
    // Check if it's an Instagram domain
    if (!urlObj.hostname.includes('instagram.com')) {
      return { isValid: false, username: "" };
    }

    // Get path parts and filter out empty strings
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Profile URLs should have exactly one part (the username)
    // or can have additional parts that we'll ignore
    if (pathParts.length < 1) {
      return { isValid: false, username: "" };
    }

    // The first path part should be the username
    const username = pathParts[0];
    
    // Usernames shouldn't be special Instagram routes like 'p', 'explore', 'reels', etc.
    const reservedRoutes = ['p', 'explore', 'reels', 'stories'];
    if (reservedRoutes.includes(username)) {
      return { isValid: false, username: "" };
    }

    return { isValid: true, username: username };
  } catch (error) {
    // If URL parsing fails, it's invalid
    return { isValid: false, username: "" };
  }
}


export async function getFollowers(cookies: any, username: string) {
  const followers = await fetch(`http://localhost:3005/api/followers`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cookies: cookies,
      userName: username
    })
  })

  const commentsJson = await followers.json()


  return commentsJson

  // const commentsFromUsernames = commentsJson.followers.map((follower: any) => {
  //   return follower.id
  // })

  // return commentsFromUsernames

}

export async function comment(cookies: any, comments: any, url: string) {
  const commenting = await fetch(`http://localhost:3005/api/comment`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cookies: cookies,
      comments: comments,
      url: url
    })
  })

  let json = await commenting.json()
  return json
}


export async function like(cookies: any, url: string) {
  const liking = await fetch(`http://localhost:3005/api/like`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cookies: cookies,
      url: url
    })
  })

  let json = await liking.json()
  return json
}

export async function follow(cookies: any, username: string) {
  const following = await fetch(`http://localhost:3005/api/follow`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cookies: cookies,
      userName: username
    })
  })

  let json = await following.json()
  return json
}

export async function addStatusColumnToSessions(database: any) {
  try {
    // Check if the column exists first
    const tableInfo = await database.select(`PRAGMA table_info(sessions)`);
    const statusColumnExists = tableInfo.some((column: any) => column.name === 'status');

    // Only add the column if it doesn't exist
    if (!statusColumnExists) {
      await database.execute(`ALTER TABLE sessions ADD COLUMN status TEXT DEFAULT NULL`);
      console.log("Status column added successfully");
    }
  } catch (error) {
    console.error("Failed to add status column:", error);
  }
}
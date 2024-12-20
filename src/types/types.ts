export type Session = {
    user_agent: string;
    proxy: string | null;
    email: string;
    password: string;
    cookies: any;

    status:  {
      success: boolean;
      loading: boolean;
      message: string;
    } | null;
  };
  
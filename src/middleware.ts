import { NextResponse } from "next/server";
import { auth } from "./lib/auth";

export default auth((req) => {
  console.log("Middleware - User role:", req.auth?.user);
  //   if (req.nextUrl.pathname.startsWith("/")) {
  //     console.log("middleware");
  //   }
  if (req.nextUrl.pathname.startsWith("/mail")) {
    // it checks the role of users that tries to navigate to /admin route
    // if the user is not "admin", it will redirect the user to home page
    if (!req.auth) {
      const redirectUrl = new URL("/login", req.url);
      // Add a message param for the frontend to display
      //   redirectUrl.searchParams.set("message", "You must be logged in to access this page.");
      console.log("Unauthorized access to admin route");
      return NextResponse.redirect(redirectUrl);
    } else {
      // else we allow them to access the page
      // console.log for debugging purposes
      console.log("Authorized access to this route");
    }
  }
});

// will match the logic to routes specified below:
export const config = { matcher: ["/mail/:path*", "/mail"] };

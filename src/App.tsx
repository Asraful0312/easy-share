import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { CreatePin } from "./CreatePin";
import { AccessPin } from "./AccessPin";
import UserPins from "./UserPins";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primary">EasyShare</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 space-y-8">
        <Unauthenticated>
          <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Welcome to PinDrop!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Sign in to create and access your pins securely.
            </p>
            <SignInForm />
          </div>
        </Unauthenticated>
        <Authenticated>
          <Content />
        </Authenticated>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No need to check for loggedInUser === null here as Authenticated wraps this component

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">
          Hello,{" "}
          {loggedInUser?.name?.split(" ")[0] ??
            loggedInUser?.email?.split("@")[0] ??
            "User"}
          !
        </h1>
        <p className="text-md sm:text-lg text-gray-600">
          Create a new pin or access an existing one below.
        </p>
      </div>
      <CreatePin />
      <AccessPin />
      <UserPins />
    </div>
  );
}

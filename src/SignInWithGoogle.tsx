import { useAuthActions } from "@convex-dev/auth/react";

const SignInWithGoogle = () => {
  const { signIn } = useAuthActions();
  return (
    <button
      className="bg-gray-100 w-full px-4 py-3 rounded font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      onClick={() => void signIn("google")}
    >
      <img src="/google.png" alt="google icon" className="size-5 shrink-0" />
      Sign in with Google
    </button>
  );
};

export default SignInWithGoogle;

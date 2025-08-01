import { SignInForm } from "@/SignInForm";

const SigninPage = () => {
  return (
    <>
      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl text-center my-8">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Welcome to EasyShare!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sign in to create and access your pins securely.
        </p>
        <SignInForm />
      </div>
    </>
  );
};

export default SigninPage;

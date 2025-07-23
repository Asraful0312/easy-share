import { SignOutButton } from "@/SignOutButton";
import { Authenticated, Unauthenticated } from "convex/react";

import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8">
      <Link to="/" className="text-2xl font-bold text-primary">
        EasyShare
      </Link>

      <ul className="flex items-center gap-5">
        <li>
          <Link
            className="hover:text-blue-600 transition-all duration-300"
            to="/pricing"
          >
            Pricing
          </Link>
        </li>
        <li>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
          <Unauthenticated>
            <Link
              className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
              to="/signin"
            >
              Signin
            </Link>
          </Unauthenticated>
        </li>
      </ul>
    </header>
  );
};

export default Header;

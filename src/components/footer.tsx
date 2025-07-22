import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-7  border-t">
      <div className="flex flex-col md:flex-row gap-4 px-3 items-center justify-between w-full max-w-6xl mx-auto">
        <p>© {new Date().getFullYear()} Easy Share. All rights reserved.</p>
        <ul className="flex items-center gap-4">
          <li className="hover:text-blue-500">
            <Link to="/about">About us</Link>
          </li>
          <li className="hover:text-blue-500">
            <Link to="/terms">Terms & Conditions</Link>
          </li>
          <li className="hover:text-blue-500">
            <Link to="/about">Privacy Policy</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;

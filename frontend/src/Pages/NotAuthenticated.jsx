import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

const NotAuthenticated = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <Lock className="w-16 h-16 mb-4 text-red-500" />
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-gray-500 mb-6">
        You must be logged in to view this page.
      </p>
      <Link
        to="/login"
        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
      >
        Go to Login
      </Link>
    </div>
  );
};

export default NotAuthenticated;

import { useAuth } from "../context/AuthContext";
import { Link } from 'react-router-dom';  
export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {" "}
      <div className="flex justify-between items-center mb-6">
        {" "}
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>{" "}
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          {" "}
          Log Out{" "}
        </button>{" "}
      </div>{" "}
      <p className="text-gray-600">Role: {user?.role}</p>{" "}
      <p className="text-gray-400 mt-4">
        <Link to="/tasks" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded"> View Tasks </Link>
      </p>{" "}
    </div>
  );
}

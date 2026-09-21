import { useAuth } from "../context/AuthContext";
export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="max-w-3xl mx-auto p-10">
      {" "}
      <h1 className="text-2xl font-bold text-ink">
        Welcome back, {user?.name}
      </h1>{" "}
      <p className="text-ink/60 mt-1 capitalize">{user?.role}</p>{" "}
    </div>
  );
}

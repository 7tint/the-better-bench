import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NOT_SO_SECURE_PASSWORD } from "../../services/password";

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === NOT_SO_SECURE_PASSWORD) {
      sessionStorage.setItem("isAdminAuthenticated", "true");
      navigate("/admin");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-cream border border-old-ink">
      <h2 className="newspaper-headline text-xl mb-6">Editor's Login</h2>

      {error && (
        <p className="mb-4 p-2 text-film-red bg-cream border border-film-red text-center font-mono text-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-serif text-sm uppercase tracking-wider text-old-ink mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 font-mono bg-white border border-old-ink focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-old-ink text-cream font-serif uppercase tracking-wider text-sm shadow-newspaper"
        >
          Enter Editor's Desk
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;

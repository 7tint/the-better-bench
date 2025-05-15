import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import BenchForm from "../admin/BenchForm";
import type { BenchEntry } from "../../types";

const AdminDashboard: React.FC = () => {
  const [benches, setBenches] = useState<BenchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentBench, setCurrentBench] = useState<
    Partial<BenchEntry> | undefined
  >(undefined);

  useEffect(() => {
    fetchBenches();
  }, []);

  const fetchBenches = async () => {
    setLoading(true);
    try {
      const benchesRef = collection(db, "benches");
      const snapshot = await getDocs(benchesRef);
      const benchesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateVisited: doc.data().dateVisited?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as BenchEntry[];

      setBenches(benchesData);
    } catch (error) {
      console.error("Error fetching benches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (bench?: BenchEntry) => {
    setCurrentBench(bench);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentBench(undefined);
  };

  const handleSubmit = async (benchData: Partial<BenchEntry>) => {
    try {
      const now = new Date();

      if (benchData.id) {
        // Update existing bench
        const benchRef = doc(db, "benches", benchData.id);
        await updateDoc(benchRef, {
          ...benchData,
          updatedAt: now,
        });
      } else {
        // Add new bench
        await addDoc(collection(db, "benches"), {
          ...benchData,
          createdAt: now,
          updatedAt: now,
        });
      }

      fetchBenches();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving bench:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bench?")) {
      try {
        await deleteDoc(doc(db, "benches", id));
        fetchBenches();
      } catch (error) {
        console.error("Error deleting bench:", error);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminAuthenticated");
    window.location.href = "/admin/login";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="newspaper-headline text-2xl">Editor's Desk</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-newsprint text-oldInk font-mono text-sm border border-oldInk"
        >
          Sign Out
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => handleOpenForm()}
          className="px-6 py-3 bg-oldInk text-cream font-serif uppercase tracking-wider text-sm shadow-newspaper"
        >
          Add New Bench
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="font-serif text-oldInk">Loading benches...</p>
        </div>
      ) : (
        <div className="bg-cream border border-oldInk">
          <table className="w-full">
            <thead>
              <tr className="border-b border-oldInk">
                <th className="p-3 text-left font-serif">Name</th>
                <th className="p-3 text-left font-serif">Date Visited</th>
                <th className="p-3 text-left font-serif">Rating</th>
                <th className="p-3 text-left font-serif">Actions</th>
              </tr>
            </thead>
            <tbody>
              {benches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center font-mono text-sm">
                    No benches found. Add your first bench!
                  </td>
                </tr>
              ) : (
                benches.map((bench) => (
                  <tr key={bench.id} className="border-b border-oldInk">
                    <td className="p-3 font-mono text-sm">{bench.name}</td>
                    <td className="p-3 font-mono text-sm">
                      {bench.dateVisited.toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-sm">
                      {bench.ratings.overall}/10
                    </td>
                    <td className="p-3 font-mono text-sm">
                      <button
                        onClick={() => handleOpenForm(bench)}
                        className="mr-2 underline text-accent1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bench.id)}
                        className="underline text-filmRed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <BenchForm
        bench={currentBench}
        onSubmit={handleSubmit}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from "react";
import {
  isOnline,
  getPendingEntryCount,
  syncOfflineEntries,
} from "../../services/offlineStorage";

interface NetworkStatusProps {
  showSyncButton?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showSyncButton = false,
}) => {
  const [networkStatus, setNetworkStatus] = useState<boolean>(isOnline());
  const [pendingCount, setPendingCount] = useState<number>(
    getPendingEntryCount()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const updateStatus = () => {
      setNetworkStatus(isOnline());
      setPendingCount(getPendingEntryCount());
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    const intervalId = setInterval(updateStatus, 10000);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      clearInterval(intervalId);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline()) {
      return; // Can't sync while offline
    }

    setIsSyncing(true);
    try {
      await syncOfflineEntries();
      setPendingCount(getPendingEntryCount());
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (networkStatus && pendingCount === 0 && !showSyncButton) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-cream border border-old-ink p-2 mb-4">
      <div className="flex items-center">
        <div
          className={`w-3 h-3 rounded-full mr-2 ${
            networkStatus ? "bg-green-600" : "bg-film-red"
          }`}
        />
        <span className="font-mono text-xs text-old-ink">
          {networkStatus ? "Online" : "Offline"}
        </span>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center ml-4">
          <span className="font-mono text-xs text-old-ink">
            {pendingCount} pending {pendingCount === 1 ? "entry" : "entries"}
          </span>

          {showSyncButton && networkStatus && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`ml-2 px-3 py-1 font-mono text-xs ${
                !isSyncing
                  ? "bg-accent1 text-white"
                  : "bg-newsprint text-old-ink opacity-50"
              }`}
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;

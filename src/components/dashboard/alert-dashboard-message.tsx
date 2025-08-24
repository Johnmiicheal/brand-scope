"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

interface AlertDashboardMessageProps {
  message: string;
  type: "info" | "warning" | "error";
}

export const AlertDashboardMessage = ({
  message,
  type,
}: AlertDashboardMessageProps) => {
  return (
    <div
      className={cn(
        "w-full h-10 bg-blue-500 flex items-center justify-center gap-2",
        type === "info" && "bg-gradient-to-r from-blue-600/60 via-blue-600/20 to-blue-600/60",
        type === "warning" && "bg-gradient-to-r from-yellow-600/60 via-yellow-600/20 to-yellow-600/60",
        type === "error" && "bg-gradient-to-r from-red-600/60 via-red-600/20 to-red-600/60"
      )}
    >
        <div className="flex items-center gap-2">
      {type === "info" && <Info className="w-4 h-4 text-white" />}
      {type === "warning" && <AlertTriangle className="w-4 h-4 text-white" />}
      {type === "error" && <ShieldAlert className="w-4 h-4 text-white" />}
      </div>
      <p className="text-white/70">{message}</p>
      {message.toLowerCase().includes("subscription") && (
        <Button variant="outline" size="sm" onClick={() => {window.open("/dashboard/usage")}}>
          Upgrade
        </Button>
      )}
    </div>
  );
};

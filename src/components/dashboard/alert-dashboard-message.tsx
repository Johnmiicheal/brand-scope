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
        "w-full min-h-10 bg-blue-500 flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3",
        "flex-wrap sm:flex-nowrap",
        type === "info" && "bg-gradient-to-r from-blue-600/60 via-blue-600/20 to-blue-600/60",
        type === "warning" && "bg-gradient-to-r from-yellow-600/60 via-yellow-600/20 to-yellow-600/60",
        type === "error" && "bg-gradient-to-r from-red-600/60 via-red-600/20 to-red-600/60"
      )}
    >
        <div className="flex items-center gap-1 sm:gap-2">
      {type === "info" && <Info className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" />}
      {type === "warning" && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" />}
      {type === "error" && <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" />}
      </div>
      <p className="text-white/70 text-xs sm:text-sm text-center sm:text-left flex-1 min-w-0">{message}</p>
      {message.toLowerCase().includes("subscription") && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {window.open("/dashboard/usage")}}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0"
        >
          Upgrade
        </Button>
      )}
    </div>
  );
};

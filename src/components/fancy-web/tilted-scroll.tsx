import { cn } from "@/lib/utils"

interface TiltedScrollItem {
  id: string;
  companyName: string;
  category: string;
  status?: "Analyzed" | "In Progress" | "Pending" | "Completed";
  priority?: "High" | "Medium" | "Low";
}

interface TiltedScrollProps {
  items?: TiltedScrollItem[];
  className?: string;
}

export function TiltedScroll({ 
  items = defaultItems,
  className 
}: TiltedScrollProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative overflow-hidden [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_5rem),linear-gradient(to_left,transparent,black_5rem),linear-gradient(to_bottom,transparent,black_5rem),linear-gradient(to_top,transparent,black_5rem)]">
        <div className="grid h-[400px] w-[450px] gap-5 skew-scroll grid-cols-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col gap-1 cursor-pointer rounded-md border border-border/40 bg-gradient-to-b from-background/80 to-muted/80 p-4 shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-xl dark:border-border"
            >
              <div className="flex items-center">
                <CompanyIcon className="h-6 w-6 mr-2 stroke-foreground/40 transition-colors group-hover:stroke-foreground" />
                <p className="text-foreground/90 font-medium transition-colors group-hover:text-foreground">
                  {item.companyName}
                </p>
                {item.status && (
                  <span className={cn(
                    "ml-auto text-xs px-2 py-1 rounded-full",
                    item.status === "Analyzed" && "bg-green-500/10 text-green-500",
                    item.status === "In Progress" && "bg-blue-500/10 text-blue-500",
                    item.status === "Pending" && "bg-amber-500/10 text-amber-500",
                    item.status === "Completed" && "bg-purple-500/10 text-purple-500"
                  )}>
                    {item.status}
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-foreground/60 transition-colors group-hover:text-foreground/80">
                  {item.category}
                </span>
                {item.priority && (
                  <span className={cn(
                    "ml-auto text-xs",
                    item.priority === "High" && "text-red-400",
                    item.priority === "Medium" && "text-amber-400",
                    item.priority === "Low" && "text-blue-400"
                  )}>
                    {item.priority} Priority
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CompanyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M9 17h1" />
      <path d="M14 17h1" />
      <path d="M14 13h1" />
    </svg>
  )
}

const defaultItems: TiltedScrollItem[] = [
  { 
    id: "1", 
    companyName: "Tesla Inc.", 
    category: "Electric Vehicles & Clean Energy",
    status: "Analyzed",
    priority: "High"
  },
  { 
    id: "2", 
    companyName: "Apple Inc.", 
    category: "Consumer Electronics & Tech",
    status: "Completed",
    priority: "Medium"
  },
  { 
    id: "3", 
    companyName: "Microsoft", 
    category: "Software & Cloud Services",
    status: "In Progress",
    priority: "High"
  },
  { 
    id: "4", 
    companyName: "Amazon", 
    category: "E-commerce & Cloud Computing",
    status: "Pending",
    priority: "Medium"
  },
  { 
    id: "5", 
    companyName: "Meta Platforms", 
    category: "Social Media & Metaverse",
    status: "Analyzed",
    priority: "Low"
  },
  { 
    id: "6", 
    companyName: "Google (Alphabet)", 
    category: "Search & Digital Advertising",
    status: "In Progress",
    priority: "High"
  },
  { 
    id: "7", 
    companyName: "Nvidia", 
    category: "AI & Graphics Processing",
    status: "Pending",
    priority: "Medium"
  },
  { 
    id: "8", 
    companyName: "Salesforce", 
    category: "CRM & Cloud Solutions",
    status: "Analyzed",
    priority: "Low"
  },
]
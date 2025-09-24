import { Button } from "@/components/ui/button";
import { Play, ScanSearch, ScanText, Shapes } from "lucide-react";
import Image from "next/image";

export default function SearchPrompts() {
    const scope = [
        {
            label: "Visibility",
            description: "Get insights on how visible your brand is across AI search engines."
        },
        {
            label: "Citations",
            description: "Discover the sources and sites shaping AI answers."
        },
        {
            label: "Ranking",
            description: "Benchmark your AI visibility against top competitors."
        },
        {
            label: "Mentions",
            description: "Track how often your brand appears in AI responses."
        }
    ]

    const more = [
        {
            label: "Keyword Analysis",
            icon: <ScanText className="w-4 h-4" />,
            description: "Identify the search terms and prompts that surface your brand across AI platforms.",
            image: "/assets/rankia02.webp"
        },
        {
            label: "Brand Perceptions",
            icon: <Shapes className="w-4 h-4" />,
            description: "BrandScope helps you understand how AI search engines describe, position and talk about your brand.",
            image: "/assets/rankia03.webp"
        }
    ]
  return (
    <div className="flex flex-col items-start justify-center mx-auto max-w-5xl w-full px-4">
      <span className="text-sm md:text-md text-white flex gap-1 items-center">
        <ScanSearch className="w-4 h-4" />
        <p>Search and Monitor Prompts</p>
      </span>
      <div className="relative h-full mt-2 mx-auto overflow-hidden group w-full">
        <Image
          src="/assets/rankia01.webp"
          alt="Search Prompts"
          width={1000}
          height={1000}
          className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[580px] max-w-[1080px] object-cover group-hover:scale-105 transition-all duration-400"
        />
        <Button className="absolute bottom-4 right-4 md:bottom-10 md:right-10 text-black bg-blue-600 rounded-lg text-xs md:text-sm">
            <Play className="w-3 h-3 md:w-4 md:h-4" fill="black" />
            <span className="hidden sm:inline">Play Demo</span>
            <span className="sm:hidden">Demo</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
        {scope.map((item) => (
          <div key={item.label} className="flex flex-col items-start justify-center gap-2">
            <h3 className="text-base md:text-lg font-bold">{item.label}</h3>
            <p className="text-xs md:text-sm text-neutral-400">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between w-full mt-8 md:mt-14 gap-8 lg:gap-4">
        {more.map((item) => (
            <div key={item.label} className="flex flex-col items-start justify-between gap-4 group w-full lg:w-1/2">
                <div className="flex items-center gap-2">
                    {item.icon}
                    <h3 className="text-base md:text-lg font-bold">{item.label}</h3>
                </div>
                <div className="w-full aspect-[5/3] relative overflow-hidden">
                <Image 
                    src={item.image} 
                    alt={item.label} 
                    width={1000} 
                    height={1000} 
                    draggable={false} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-400" 
                />
                </div>
                <p className="text-sm md:text-lg lg:text-[21px] text-neutral-200">{item.description}</p>
            </div>
        ))}
    </div>

    </div>
  );
}

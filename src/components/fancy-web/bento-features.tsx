import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSpring } from "react-spring";
import { TiltedScroll } from "./tilted-scroll";

export function BentoFeatures() {
  const features = [
    {
      title: "Brand Analysis and Monitoring",
      description:
        "Dive deep with our comprehensive analysis tools to understand how AI perceives your brand, and uncover actionable insights to enhance your presence.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 md:col-span-4 lg:col-span-4 border-b md:border-r border-[#1D1D1D]",
    },
    {
      title: "Keyword & Sentiment Insights",
      description:
        "Boost visibility with keyword recommendations and track sentiment across platforms.",
      skeleton: <SkeletonTwo />,
      className:
        "col-span-1 md:col-span-2 lg:col-span-2 border-b border-[#1D1D1D]",
    },
    {
      title: "Company Research Agent",
      description:
        "Our AI-powered research agent quickly gathers and analyzes competitor data, providing strategic insights to help you stay ahead in your market.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 md:col-span-3 lg:col-span-3  md:border-r border-[#1D1D1D]",
    },
    {
      title: "Expand Your AI-Powered Discovery",
      description:
        "Reach millions of potential customers by optimizing your brand for AI discovery. Our tools help you adapt your content to be more visible on AI Search.",
      skeleton: <SkeletonFour />,
      className:
        "col-span-1 md:col-span-3 lg:col-span-3 border-t md:border-none",
    },
  ];
  return (
    <div className="relative z-20 py-10 lg:py-40 max-w-7xl mx-auto">
      <div className="px-8">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
          Powerful Features to Grow Your Brand
        </h4>

        <p className="text-sm lg:text-base max-w-2xl my-4 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
          From AI-driven insights to social media optimization, our platform has
          you covered.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 mt-12 border border-[#1D1D1D]">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-100 w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="max-w-5xl mx-auto text-left tracking-tight text-black dark:text-white text-xl md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p
      className={cn(
        "text-sm md:text-base max-w-4xl text-left mx-auto",
        "text-neutral-500 text-center font-normal dark:text-neutral-300",
        "text-left max-w-xl mx-0 md:text-sm my-2"
      )}
    >
      {children}
    </p>
  );
};

export const SkeletonOne = () => {
  return (
    <div className="relative flex py-8 px-2 gap-10 h-full">
      <div className="absolute -left-15 -top-20 -z-1">
        <Image
          src="/sharpee.svg"
          width={1400}
          height={1200}
          alt="warp"
          className="blur-xl filter opacity-50"
          draggable={false}
        />
      </div>
      <div className="absolute -right-15 -top-20 -z-1">
        <Image
          src="/sharpee.svg"
          width={1400}
          height={1200}
          alt="warp"
          className="blur-xl filter opacity-50 rotate-180"
          draggable={false}
        />
      </div>
      <div className="w-full p-5 mx-auto bg-white dark:bg-neutral-900 shadow-2xl group h-full"></div>
    </div>
  );
};

export const SkeletonThree = () => {
  const fakeCompanys = [
    {
      id: "1",
      companyName: "Tesla Inc.",
      category: "Electric Vehicles & Clean Energy",
      status: "Analyzed",
      priority: "High",
    },
    {
      id: "2",
      companyName: "Apple Inc.",
      category: "Consumer Electronics & Tech",
      status: "Completed",
      priority: "Medium",
    },
    {
      id: "3",
      companyName: "Microsoft",
      category: "Software & Cloud Services",
      status: "In Progress",
      priority: "High",
    },
    {
      id: "4",
      companyName: "Amazon",
      category: "E-commerce & Cloud Computing",
      status: "Pending",
      priority: "Medium",
    },
    {
      id: "5",
      companyName: "Meta Platforms",
      category: "Social Media & Metaverse",
      status: "Analyzed",
      priority: "Low",
    },
    {
      id: "6",
      companyName: "Google (Alphabet)",
      category: "Search & Digital Advertising",
      status: "In Progress",
      priority: "High",
    },
    {
      id: "7",
      companyName: "Nvidia",
      category: "AI & Graphics Processing",
      status: "Pending",
      priority: "Medium",
    },
    {
      id: "8",
      companyName: "Salesforce",
      category: "CRM & Cloud Solutions",
      status: "Analyzed",
      priority: "Low",
    },
  ];
  return (
    <div className="w-full relative flex mx-auto bg-transparent items-center justify-center h-full">
      <div className="absolute -left-15 -bottom-32 -z-1">
        <Image
          src="/edge.svg"
          width={400}
          height={500}
          alt="warp"
          className="blur-xl filter opacity-50 -rotate-90"
          draggable={false}
        />
      </div>
      <div className="absolute -right-15 -bottom-32 -z-1">
        <Image
          src="/edge.svg"
          width={400}
          height={500}
          alt="warp"
          className="blur-xl filter opacity-50 -rotate-180"
          draggable={false}
        />
      </div>
      <div className="space-y-8 ">
        <TiltedScroll items={fakeCompanys} className="mt-8" />
      </div>
    </div>
  );
};

export const SkeletonTwo = () => {
  const imageVariants = {
    whileHover: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
    whileTap: {
      scale: 1.1,
      rotate: 0,
      zIndex: 100,
    },
  };
  return (
    <div className="relative flex flex-col items-start p-8 gap-10 h-full overflow-hidden">
      <div className="flex flex-row">
        <motion.div
          variants={imageVariants}
          whileHover="whileHover"
          whileTap="whileTap"
          className="w-full flex-shrink-0 overflow-hidden scale-135 absolute bottom-0 left-0"
        >
          <Image
            src={"/words-blue.svg"}
            alt="words"
            width="3000"
            height="1350"
            draggable={false}
            className="h-full w-full object-cover flex-shrink-0 opacity-80"
          />
        </motion.div>
      </div>

      <div className="absolute left-0 z-[100] inset-y-0 w-10 bg-gradient-to-r from-background to-transparent h-full pointer-events-none" />
      <div className="absolute right-0 z-[100] inset-y-0 w-10 bg-gradient-to-l from-background  to-transparent h-full pointer-events-none" />
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="h-80 flex flex-col items-center relative bg-transparent mt-10">
      <div className="absolute -left-40 -right-35 -bottom-100 -z-1">
        <Image
          src="/globe.svg"
          width={1400}
          height={1200}
          alt="warp"
          className="blur-xl filter opacity-50"
          draggable={false}
        />
      </div>
      <Globe className="absolute -right-30 -bottom-90 md:-bottom-90 " />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<null | number>(null);
  const [{ r }, api] = useSpring(() => ({
    r: 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 40,
      precision: 0.001,
    },
  }));

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const onResize = () =>
      canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    // Major cities/countries coordinates
    const majorLocations = [
      { location: [37.7595, -122.4367], size: 0.03 }, // San Francisco
      { location: [40.7128, -74.006], size: 0.05 }, // New York
      { location: [51.5074, -0.1278], size: 0.04 }, // London
      { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
      { location: [28.6139, 77.209], size: 0.04 }, // New Delhi
      { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
      { location: [-23.5505, -46.6333], size: 0.04 }, // São Paulo
      { location: [55.7558, 37.6173], size: 0.04 }, // Moscow
      { location: [30.0444, 31.2357], size: 0.03 }, // Cairo
      { location: [6.5244, 3.3792], size: 0.04 }, // Lagos
      { location: [9.0765, 7.3986], size: 0.03 }, // Abuja
      { location: [5.6037, -0.187], size: 0.03 }, // Accra
      { location: [48.8566, 2.3522], size: 0.05 }, // Paris
      { location: [52.52, 13.405], size: 0.04 }, // Berlin
      { location: [41.9028, 12.4964], size: 0.04 }, // Rome
      { location: [40.4168, -3.7038], size: 0.04 }, // Madrid
      { location: [59.3293, 18.0686], size: 0.03 }, // Stockholm
      { location: [-34.6037, -58.3816], size: 0.04 }, // Buenos Aires
      { location: [-33.4489, -70.6693], size: 0.03 }, // Santiago
      { location: [-0.1807, -78.4678], size: 0.03 }, // Quito
      { location: [4.711, -74.0721], size: 0.04 }, // Bogotá
    ];

    // Animation state for markers
    let markerIndex = 0;
    const markerCount = 4; // Number of active markers at any time

    // Create initial active markers
    let activeMarkers = majorLocations.slice(0, markerCount);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.2, 0.3], // More blue-ish base color
      markerColor: [0.3, 0.8, 1], // Bright blue markers
      glowColor: [0.2, 0.5, 1], // Blue glow
      markers: activeMarkers,
      onRender: (state) => {
        // This prevents rotation while dragging
        if (!pointerInteracting.current) {
          // Called on every animation frame.
          // `state` will be an empty object, return updated params.
          phi += 0.005;

          // Every ~5 seconds, update one marker
          if (Math.random() < 0.005) {
            markerIndex = (markerIndex + 1) % majorLocations.length;
            activeMarkers = [
              ...activeMarkers.slice(1),
              majorLocations[markerIndex],
            ];
            state.markers = activeMarkers;
          }
        }
        state.phi = phi + r.get();
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    pointerInteracting.current = e.clientX;
    canvasRef.current?.style.setProperty("cursor", "grabbing");
  };

  const onPointerUp = () => {
    pointerInteracting.current = null;
    canvasRef.current?.style.setProperty("cursor", "grab");
  };

  const onPointerOut = () => {
    pointerInteracting.current = null;
    canvasRef.current?.style.setProperty("cursor", "grab");
  };

  const onMouseMove = (e: React.PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteracting.current = e.clientX;
      api.start({
        r: r.get() + delta / 100,
      });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 600,
        height: 600,
        maxWidth: "100%",
        aspectRatio: 1,
        cursor: "grab",
        filter: "drop-shadow(0 0 10px rgba(0, 150, 255, 0.3))", // Blue glow effect
      }}
      className={className}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerOut}
      onPointerMove={onMouseMove}
    />
  );
};

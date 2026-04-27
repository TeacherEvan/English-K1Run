import type { ResourceMetadata } from "@/lib/resource-preloader";

export const STARTUP_PACK_VERSION = "startup-boot-v2";

export const buildStartupBootResources = (
  limitedBandwidth: boolean,
): ResourceMetadata[] => {
  const highPriority: ResourceMetadata[] = [
    { url: "/welcome-sangsom.png", type: "image", priority: "high" },
    { url: "/New_welcome_video.mp4", type: "video", priority: "high" },
  ];

  if (limitedBandwidth) {
    return highPriority;
  }

  return [
    ...highPriority,
    {
      url: "/sounds/welcome_sangsom_association.mp3",
      type: "audio",
      priority: "medium",
    },
    {
      url: "/sounds/welcome_sangsom_association_thai.mp3",
      type: "audio",
      priority: "medium",
    },
  ];
};

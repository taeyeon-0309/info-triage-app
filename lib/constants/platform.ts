export const sourcePlatforms = [
  "AI_NEWS",
  "X",
  "XIAOHONGSHU",
  "WECHAT",
  "WEBSITE",
  "NEWSLETTER",
  "RSS",
  "MANUAL",
  "OTHER",
] as const;

export type SourcePlatform = (typeof sourcePlatforms)[number];

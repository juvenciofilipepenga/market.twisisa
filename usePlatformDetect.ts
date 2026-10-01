import { useMemo } from "react";

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isChromeWeb: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isChrome: boolean;
  userAgent: string;
  osName: "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Unknown";
  browserName: "Chrome" | "Safari" | "Firefox" | "Edge" | "Other";
}

export function usePlatformDetect(): PlatformInfo {
  return useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();

    // Detectar SO
    const isIOS = /iphone|ipad|ipod/.test(ua) || 
                  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isWindows = /windows|win32/.test(ua);
    const isMacOS = /macintosh|mac os x/.test(ua);
    const isLinux = /linux/.test(ua);

    // Detectar browser
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
    const isChrome = /chrome|chromium|crios/.test(ua);
    const isFirefox = /firefox/.test(ua);
    const isEdge = /edg/.test(ua);

    // Detectar tipo de dispositivo
    const isMobile = /mobile|android|iphone|ipod/.test(ua);
    const isTablet = /ipad|android/.test(ua) && !/mobile/.test(ua);
    const isDesktop = !isMobile && !isTablet;

    // Verificações específicas
    const isWeb = !isIOS && !isAndroid;
    const isChromeWeb = isChrome && isWeb;

    // OS Name
    let osName: "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Unknown" = "Unknown";
    if (isIOS) osName = "iOS";
    else if (isAndroid) osName = "Android";
    else if (isWindows) osName = "Windows";
    else if (isMacOS) osName = "macOS";
    else if (isLinux) osName = "Linux";

    // Browser Name
    let browserName: "Chrome" | "Safari" | "Firefox" | "Edge" | "Other" = "Other";
    if (isChrome) browserName = "Chrome";
    else if (isSafari) browserName = "Safari";
    else if (isFirefox) browserName = "Firefox";
    else if (isEdge) browserName = "Edge";

    return {
      isIOS,
      isAndroid,
      isWeb,
      isMobile,
      isTablet,
      isDesktop,
      isChromeWeb,
      isSafari,
      isFirefox,
      isChrome,
      userAgent: ua,
      osName,
      browserName,
    };
  }, []);
}

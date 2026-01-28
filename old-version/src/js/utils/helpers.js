export const extractTitleFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");
    const pathname = urlObj.pathname;

    // Try to extract meaningful title from pathname
    if (pathname && pathname !== "/") {
      const pathParts = pathname.split("/").filter((part) => part);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Convert URL-friendly format to readable title
        return lastPart
          .replace(/[-_]/g, " ")
          .replace(/\.(html|php|aspx?)$/i, "")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    // Fallback to hostname
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return "Artigo";
  }
};
export const extractFaviconFromURL = (url) => {
  const favIcon = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;
  return favIcon;
};

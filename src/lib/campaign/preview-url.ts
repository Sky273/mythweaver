export function buildPreviewUrl(
  campaignId: string,
  filePath: string,
  options: { title?: string; back?: string; backLabel?: string } = {},
) {
  const relativePath = filePath.split("/")[1];
  const params = new URLSearchParams();
  if (options.title) params.set("title", options.title);
  if (options.back) params.set("back", options.back);
  if (options.backLabel) params.set("backLabel", options.backLabel);

  const query = params.toString();
  return `/campaigns/${campaignId}/preview/${relativePath}${query ? `?${query}` : ""}`;
}

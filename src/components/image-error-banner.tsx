// Shown on generation pages when an image generation failed. The message is
// passed back via the ?imageError query param by the server action (server
// action throws have their messages stripped in production, so we surface the
// friendly message through a redirect instead).
export function ImageErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {message}
    </div>
  );
}

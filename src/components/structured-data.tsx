interface StructuredDataProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

function serializeStructuredData(
  data: Record<string, unknown> | Array<Record<string, unknown>>
) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
    />
  );
}

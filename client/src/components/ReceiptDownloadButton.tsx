import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export function ReceiptDownloadButton({ orderId }: { orderId: number }) {
  const { data, isLoading } = trpc.receipts.generate.useQuery(
    { orderId },
    { enabled: orderId > 0 }
  );

  const handleDownload = () => {
    if (!data?.html) return;

    // Create a blob from the HTML
    const blob = new Blob([data.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${data.receipt.orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading || !data}
      variant="outline"
      className="w-full text-sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Receipt
        </>
      )}
    </Button>
  );
}

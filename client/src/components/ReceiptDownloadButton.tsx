import { useState, useEffect } from "react";
import { Download, Loader2, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ReceiptDownloadButton({ orderId }: { orderId: number }) {
  const [downloadFormat, setDownloadFormat] = useState<"html" | "pdf" | null>(null);

  const { data: htmlData, isLoading: htmlLoading, error: htmlError } = trpc.receipts.generate.useQuery(
    { orderId },
    { enabled: orderId > 0 && downloadFormat === "html" }
  );

  const { data: pdfData, isLoading: pdfLoading, error: pdfError } = trpc.receipts.generatePDF.useQuery(
    { orderId },
    { enabled: orderId > 0 && downloadFormat === "pdf" }
  );

  const isLoading = htmlLoading || pdfLoading;

  // Handle HTML download
  useEffect(() => {
    if (downloadFormat === "html" && htmlData && !htmlLoading) {
      try {
        const blob = new Blob([htmlData.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `receipt-${htmlData.receipt.orderNumber}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Receipt downloaded as HTML");
      } catch (error) {
        toast.error("Failed to download receipt");
        console.error(error);
      } finally {
        setDownloadFormat(null);
      }
    }
  }, [downloadFormat, htmlData, htmlLoading]);

  // Handle PDF download
  useEffect(() => {
    if (downloadFormat === "pdf" && pdfData && !pdfLoading) {
      try {
        const binaryString = atob(pdfData.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `receipt-${pdfData.receipt.orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Receipt downloaded as PDF");
      } catch (error) {
        toast.error("Failed to download receipt");
        console.error(error);
      } finally {
        setDownloadFormat(null);
      }
    }
  }, [downloadFormat, pdfData, pdfLoading]);

  // Handle errors
  useEffect(() => {
    if (htmlError) {
      toast.error("Failed to generate HTML receipt");
      setDownloadFormat(null);
    }
  }, [htmlError]);

  useEffect(() => {
    if (pdfError) {
      toast.error("Failed to generate PDF receipt");
      setDownloadFormat(null);
    }
  }, [pdfError]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isLoading}
          variant="outline"
          className="w-full text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => setDownloadFormat("pdf")}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <File className="w-4 h-4 mr-2" />
          <span>Download as PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDownloadFormat("html")}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          <span>Download as HTML</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

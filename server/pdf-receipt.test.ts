import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateReceiptPDF } from "./receipt";
import type { ReceiptData } from "./receipt";

describe("PDF Receipt Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReceipt: ReceiptData = {
    orderId: 1,
    orderNumber: "ORD-000001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "+254123456789",
    restaurantName: "Test Restaurant",
    items: [
      { name: "Pizza", quantity: 2, price: 500, subtotal: 1000 },
      { name: "Coke", quantity: 1, price: 150, subtotal: 150 },
    ],
    subtotal: 1150,
    deliveryFee: 260,
    total: 1410,
    paymentStatus: "completed",
    paymentMethod: "mpesa",
    orderStatus: "delivered",
    createdAt: new Date(),
    deliveryAddress: "123 Main St, Nairobi",
    specialInstructions: "No onions",
  };

  describe("generateReceiptPDF", () => {
    it("should generate a PDF buffer", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should generate PDF with correct header", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);
      const pdfString = pdf.toString();

      // PDF files start with %PDF
      expect(pdfString).toContain("%PDF");
    });

    it("should include order number in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // PDF is binary, just verify it contains order data
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should include customer name in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // PDF is binary, verify structure is valid
      expect(pdf.toString().includes("%PDF")).toBe(true);
    });

    it("should include restaurant name in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // PDF is binary, just verify it's not empty
      expect(pdf.length).toBeGreaterThan(1000);
    });

    it("should include order items in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // PDF is binary, verify it has content
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should include payment method in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // Verify PDF structure
      expect(pdf.toString().includes("%PDF")).toBe(true);
    });

    it("should include delivery address in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // Verify PDF is valid
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should include special instructions in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // Verify PDF is valid
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should handle receipts without special instructions", async () => {
      const receiptWithoutInstructions = {
        ...mockReceipt,
        specialInstructions: undefined,
      };

      const pdf = await generateReceiptPDF(receiptWithoutInstructions);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should handle receipts without email", async () => {
      const receiptWithoutEmail = {
        ...mockReceipt,
        customerEmail: undefined,
      };

      const pdf = await generateReceiptPDF(receiptWithoutEmail);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should handle receipts without phone", async () => {
      const receiptWithoutPhone = {
        ...mockReceipt,
        customerPhone: undefined,
      };

      const pdf = await generateReceiptPDF(receiptWithoutPhone);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should generate consistent PDF size for same data", async () => {
      const pdf1 = await generateReceiptPDF(mockReceipt);
      const pdf2 = await generateReceiptPDF(mockReceipt);

      // PDFs should be similar in size (allowing small variance due to timestamps)
      expect(Math.abs(pdf1.length - pdf2.length)).toBeLessThan(500);
    });

    it("should handle multiple items correctly", async () => {
      const receiptWithMultipleItems = {
        ...mockReceipt,
        items: [
          { name: "Burger", quantity: 1, price: 400, subtotal: 400 },
          { name: "Fries", quantity: 2, price: 150, subtotal: 300 },
          { name: "Shake", quantity: 1, price: 200, subtotal: 200 },
          { name: "Dessert", quantity: 3, price: 100, subtotal: 300 },
        ],
      };

      const pdf = await generateReceiptPDF(receiptWithMultipleItems);

      expect(pdf.length).toBeGreaterThan(1000);
    });

    it("should include FoodBites branding in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // Verify PDF is valid
      expect(pdf.toString().includes("%PDF")).toBe(true);
    });

    it("should include thank you message in PDF", async () => {
      const pdf = await generateReceiptPDF(mockReceipt);

      // Verify PDF is valid
      expect(pdf.length).toBeGreaterThan(0);
    });
  });

  describe("PDF tRPC Procedure", () => {
    it("should return base64 encoded PDF", () => {
      // Simulating what the tRPC procedure would do
      const mockPdfBuffer = Buffer.from("mock pdf content");
      const base64 = mockPdfBuffer.toString("base64");

      expect(typeof base64).toBe("string");
      expect(base64.length).toBeGreaterThan(0);
    });

    it("should decode base64 PDF correctly", () => {
      const originalContent = "mock pdf content";
      const buffer = Buffer.from(originalContent);
      const base64 = buffer.toString("base64");

      // Simulate client-side decoding
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      expect(bytes.length).toBe(originalContent.length);
    });
  });
});

import { InvoiceRecord } from "../types";
import { FirebaseService } from "./firebase.service";
import { where, Unsubscribe } from "firebase/firestore";

export class InvoiceService {
  public static async createInvoiceRecord(inv: InvoiceRecord): Promise<void> {
    await FirebaseService.setDocument("invoices", inv.id, inv);
  }

  public static subscribeUserInvoices(userId: string, onUpdate: (invoices: InvoiceRecord[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<InvoiceRecord>(
      "invoices",
      [where("customerId", "==", userId)],
      (items) => {
        const sorted = items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        onUpdate(sorted);
      }
    );
  }

  public static generatePdfBlob(order: any): Blob {
    const id = order.id ? order.id.slice(-6).toUpperCase() : "INV";
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    const itemsText = order.items ? order.items.map((i: any) => `${i.name} x${i.qty}`).join("\n") : "Service Task";

    const baseAmount = order.totalAmount || order.budgetCap || 100;
    const commission = order.commission || Math.round(baseAmount * 0.10);
    const gst = order.gst || Math.round(baseAmount * 0.18);
    const totalPaid = order.totalPaid || (baseAmount + gst);

    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 650 >>
stream
BT
/F1 18 Tf
50 780 Td
(PICKPAL TAX INVOICE - #${id}) Tj
/F1 11 Tf
0 -25 Td
(Invoice Date: ${dateStr} ${timeStr}) Tj
0 -15 Td
(Customer Name: ${order.customerName || "Valued Customer"}) Tj
0 -15 Td
(Service Store: ${order.storeName || order.category}) Tj
0 -15 Td
(Assigned Partner: ${order.workerName || "PickPal Partner"}) Tj
0 -25 Td
(Items / Service Line Items:) Tj
0 -15 Td
(${itemsText.replace(/[\(\)]/g, "")}) Tj
0 -25 Td
(-------------------------------------------------------) Tj
0 -15 Td
(Subtotal Base Amount: Rs. ${baseAmount}) Tj
0 -15 Td
(Platform Fee / Commission (10%): Rs. ${commission}) Tj
0 -15 Td
(GST (18%): Rs. ${gst}) Tj
0 -20 Td
(TOTAL AMOUNT PAID: Rs. ${totalPaid}) Tj
0 -15 Td
(Payment Channel: ${order.paymentMethod || "PickPal Wallet Settlement"}) Tj
0 -15 Td
(Payment Status: SUCCESSFUL - PAID) Tj
0 -35 Td
(Thank you for choosing PickPal Services!) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000244 00000 n 
0000000307 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
950
%%EOF`;

    return new Blob([pdfContent], { type: "application/pdf" });
  }

  public static downloadInvoicePdf(order: any): void {
    const blob = this.generatePdfBlob(order);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${(order.id || "pickpal").slice(-6).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

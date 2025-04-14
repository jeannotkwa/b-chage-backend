// This file is kept as a placeholder but not used for PDF generation
// PDF generation has been disabled to avoid font-related errors

export async function generateReceiptPDF(transaction) {
  // Return a placeholder URL without actually generating a PDF
  return Promise.resolve(`/api/receipts/${transaction.id}`)
}

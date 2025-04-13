import PDFDocument from "pdfkit"
import { Readable } from "stream"

// Generate PDF receipt for transaction
export async function generateReceiptPDF(transaction) {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      })

      // Create a buffer to store the PDF
      const chunks = []
      const stream = new Readable()

      // Handle document data events
      doc.on("data", (chunk) => {
        chunks.push(chunk)
      })

      // Handle document end event
      doc.on("end", () => {
        const result = Buffer.concat(chunks)
        // In a real application, you would save this to a file or cloud storage
        // For this example, we'll just return a placeholder URL
        resolve(`/api/receipts/${transaction.id}`)
      })

      // Add content to the PDF

      // Header
      doc.fontSize(20).text("BUREAU DE CHANGE", { align: "center" })
      doc.fontSize(14).text("Bordereau d'opération", { align: "center" })
      doc.moveDown()

      // Receipt info
      doc.fontSize(12).text(`N° Reçu: ${transaction.receiptNumber}`)
      doc.text(`Date: ${formatDate(transaction.timestamp)}`)
      doc.text(`Caissier: ${transaction.cashierName}`)
      doc.moveDown()

      // Transaction details
      doc.fontSize(14).text("Détails de la transaction", { underline: true })
      doc.fontSize(12).text(`Type: ${transaction.type === "buy" ? "Achat de devise" : "Vente de devise"}`)
      doc.text(`Devise: ${transaction.currencyName} (${transaction.currencyCode})`)
      doc.text(`Montant en devise: ${formatAmount(transaction.amount)} ${transaction.currencyCode}`)
      doc.text(`Taux appliqué: ${transaction.rate}`)
      doc.text(`Montant en monnaie locale: ${formatAmount(transaction.localAmount)} XOF`)

      // Client info if available
      if (transaction.clientInfo) {
        doc.moveDown()
        doc.fontSize(14).text("Informations client", { underline: true })

        let clientInfo
        if (typeof transaction.clientInfo === "string") {
          clientInfo = JSON.parse(transaction.clientInfo)
        } else {
          clientInfo = transaction.clientInfo
        }

        doc.fontSize(12).text(`Nom: ${clientInfo.name || "N/A"}`)
        doc.text(`ID: ${clientInfo.idNumber || "N/A"}`)
        doc.text(`Téléphone: ${clientInfo.phone || "N/A"}`)
      }

      // Notes if available
      if (transaction.notes) {
        doc.moveDown()
        doc.fontSize(14).text("Notes", { underline: true })
        doc.fontSize(12).text(transaction.notes)
      }

      // Footer
      doc.moveDown()
      doc.fontSize(10).text("Ce reçu est un document officiel. Merci de le conserver.", { align: "center" })

      // Finalize the PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper function to format date
function formatDate(date) {
  return new Date(date).toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Helper function to format amount
function formatAmount(amount) {
  return Number.parseFloat(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

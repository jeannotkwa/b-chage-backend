import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyToken, isAdminOrSupervisor } from "@/lib/auth"

// Generate reports
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const currencyCode = searchParams.get("currencyCode")
    const cashierId = searchParams.get("cashierId")

    // Validate input
    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Le type de rapport, la date de début et la date de fin sont requis" },
        { status: 400 },
      )
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Parse dates
      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999) // End of day

      // Format dates for MySQL
      const formattedStartDate = startDateTime.toISOString().slice(0, 19).replace("T", " ")
      const formattedEndDate = endDateTime.toISOString().slice(0, 19).replace("T", " ")

      // Build base query conditions
      let baseConditions = " WHERE timestamp BETWEEN ? AND ?"
      const baseParams = [formattedStartDate, formattedEndDate]

      if (currencyCode) {
        baseConditions += " AND currency_code = ?"
        baseParams.push(currencyCode)
      }

      if (cashierId) {
        baseConditions += " AND cashier_id = ?"
        baseParams.push(cashierId)
      }

      let reportData

      switch (reportType) {
        case "transactions":
          // Transactions report
          const transactionQuery = "SELECT * FROM transactions" + baseConditions + " ORDER BY timestamp ASC"
          const [transactions] = await connection.query(transactionQuery, baseParams)

          // Calculate totals
          const transactionTotals = {}

          for (const transaction of transactions) {
            const key = transaction.currency_code

            if (!transactionTotals[key]) {
              transactionTotals[key] = {
                buys: { count: 0, amount: 0 },
                sells: { count: 0, amount: 0 },
              }
            }

            if (transaction.type === "buy") {
              transactionTotals[key].buys.count++
              transactionTotals[key].buys.amount += Number.parseFloat(transaction.amount)
            } else {
              transactionTotals[key].sells.count++
              transactionTotals[key].sells.amount += Number.parseFloat(transaction.amount)
            }
          }

          return NextResponse.json({
            reportType: "transactions",
            startDate: startDateTime,
            endDate: endDateTime,
            transactions,
            totals: transactionTotals,
          })

        case "supplies":
          // Supplies report
          const supplyQuery = "SELECT * FROM supplies" + baseConditions + " ORDER BY timestamp ASC"
          const [supplies] = await connection.query(supplyQuery, baseParams)

          // Calculate totals
          const supplyTotals = {}

          for (const supply of supplies) {
            const key = supply.currency_code

            if (!supplyTotals[key]) {
              supplyTotals[key] = {
                internal: { count: 0, amount: 0 },
                external: { count: 0, amount: 0 },
              }
            }

            if (supply.source === "internal") {
              supplyTotals[key].internal.count++
              supplyTotals[key].internal.amount += Number.parseFloat(supply.amount)
            } else {
              supplyTotals[key].external.count++
              supplyTotals[key].external.amount += Number.parseFloat(supply.amount)
            }
          }

          return NextResponse.json({
            reportType: "supplies",
            startDate: startDateTime,
            endDate: endDateTime,
            supplies,
            totals: supplyTotals,
          })

        case "cashiers":
          // Cashiers performance report
          // Only admin or supervisor can access this report
          if (!isAdminOrSupervisor(authResult.user)) {
            return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
          }

          // Get all cash registers in the period
          const cashRegisterQuery = `
            SELECT * FROM cash_registers 
            WHERE (opened_at BETWEEN ? AND ?) 
               OR (closed_at BETWEEN ? AND ?) 
               OR (opened_at <= ? AND (closed_at >= ? OR status = 'open'))
          `
          const [cashRegisters] = await connection.query(cashRegisterQuery, [
            formattedStartDate,
            formattedEndDate,
            formattedStartDate,
            formattedEndDate,
            formattedStartDate,
            formattedEndDate,
          ])

          // Get all transactions for these cash registers
          if (cashRegisters.length === 0) {
            return NextResponse.json({
              reportType: "cashiers",
              startDate: startDateTime,
              endDate: endDateTime,
              cashiers: [],
            })
          }

          const cashRegisterIds = cashRegisters.map((cr) => cr.id)
          const placeholders = cashRegisterIds.map(() => "?").join(",")

          const transactionsQuery = `
            SELECT * FROM transactions 
            WHERE cash_register_id IN (${placeholders})
            AND timestamp BETWEEN ? AND ?
          `

          const [cashierTransactions] = await connection.query(transactionsQuery, [
            ...cashRegisterIds,
            formattedStartDate,
            formattedEndDate,
          ])

          // Group by cashier
          const cashierPerformance = {}

          for (const transaction of cashierTransactions) {
            const cashierId = transaction.cashier_id.toString()

            if (!cashierPerformance[cashierId]) {
              cashierPerformance[cashierId] = {
                cashierId: transaction.cashier_id,
                cashierName: transaction.cashier_name,
                transactionCount: 0,
                currencies: {},
              }
            }

            cashierPerformance[cashierId].transactionCount++

            const currencyCode = transaction.currency_code
            if (!cashierPerformance[cashierId].currencies[currencyCode]) {
              cashierPerformance[cashierId].currencies[currencyCode] = {
                buys: { count: 0, amount: 0 },
                sells: { count: 0, amount: 0 },
              }
            }

            if (transaction.type === "buy") {
              cashierPerformance[cashierId].currencies[currencyCode].buys.count++
              cashierPerformance[cashierId].currencies[currencyCode].buys.amount += Number.parseFloat(
                transaction.amount,
              )
            } else {
              cashierPerformance[cashierId].currencies[currencyCode].sells.count++
              cashierPerformance[cashierId].currencies[currencyCode].sells.amount += Number.parseFloat(
                transaction.amount,
              )
            }
          }

          return NextResponse.json({
            reportType: "cashiers",
            startDate: startDateTime,
            endDate: endDateTime,
            cashiers: Object.values(cashierPerformance),
          })

        default:
          return NextResponse.json({ error: "Type de rapport invalide" }, { status: 400 })
      }
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la génération du rapport:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

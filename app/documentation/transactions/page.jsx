import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"

export default function TransactionsDocumentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-8 w-8 mr-2 text-green-600" />
            API Transactions
          </h1>
          <Link href="/documentation">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la documentation
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">Documentation des Transactions</h2>
          <p className="text-xl text-gray-500">
            Endpoints pour la gestion des transactions d'achat et de vente de devises
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">GET /api/transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Récupère la liste des transactions avec possibilité de filtrage.</p>

              <h3 className="font-bold mb-2">Paramètres de requête</h3>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>
                  <span className="font-semibold">cashRegisterId</span> - ID de la caisse
                </li>
                <li>
                  <span className="font-semibold">type</span> - Type de transaction (buy/sell)
                </li>
                <li>
                  <span className="font-semibold">currencyCode</span> - Code de la devise
                </li>
                <li>
                  <span className="font-semibold">startDate</span> - Date de début (format YYYY-MM-DD)
                </li>
                <li>
                  <span className="font-semibold">endDate</span> - Date de fin (format YYYY-MM-DD)
                </li>
                <li>
                  <span className="font-semibold">cashierId</span> - ID du caissier
                </li>
              </ul>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    transactions: [
                      {
                        id: 1,
                        type: "buy",
                        cash_register_id: 1,
                        cashier_id: 1,
                        cashier_name: "John Doe",
                        currency_code: "EUR",
                        currency_name: "Euro",
                        amount: 100,
                        rate: 655.5,
                        local_amount: 65550,
                        timestamp: "2023-04-13T10:30:00",
                        receipt_number: "R230413-0001",
                      },
                    ],
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">POST /api/transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Crée une nouvelle transaction d'achat ou de vente de devise.</p>

              <h3 className="font-bold mb-2">Corps de la requête</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {JSON.stringify(
                  {
                    type: "buy",
                    cashRegisterId: 1,
                    currencyCode: "EUR",
                    amount: 100,
                    rate: 655.5,
                    localAmount: 65550,
                    clientInfo: {
                      name: "Client Name",
                      idNumber: "ID12345",
                      phone: "+123456789",
                    },
                    notes: "Transaction notes",
                  },
                  null,
                  2,
                )}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    message: "Transaction enregistrée avec succès",
                    transaction: {
                      id: 1,
                      type: "buy",
                      cashRegisterId: 1,
                      cashierId: 1,
                      cashierName: "John Doe",
                      currencyCode: "EUR",
                      currencyName: "Euro",
                      amount: 100,
                      rate: 655.5,
                      localAmount: 65550,
                      timestamp: "2023-04-13T10:30:00",
                      receiptNumber: "R230413-0001",
                    },
                    receiptUrl: "/api/receipts/1",
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

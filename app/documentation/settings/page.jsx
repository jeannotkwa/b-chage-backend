import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

export default function SettingsDocumentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 mr-2 text-orange-600" />
            API Paramètres
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
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">Documentation des Paramètres</h2>
          <p className="text-xl text-gray-500">
            Endpoints pour la gestion des devises, taux de change et paramètres système
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">GET /api/currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Récupère la liste des devises disponibles.</p>

              <h3 className="font-bold mb-2">En-têtes requis</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    currencies: [
                      {
                        id: 1,
                        code: "EUR",
                        name: "Euro",
                        symbol: "€",
                        buy_rate: 655.0,
                        sell_rate: 660.0,
                        is_active: true,
                      },
                      {
                        id: 2,
                        code: "USD",
                        name: "Dollar américain",
                        symbol: "$",
                        buy_rate: 590.0,
                        sell_rate: 595.0,
                        is_active: true,
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
              <CardTitle className="flex items-center text-orange-600">POST /api/currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Ajoute une nouvelle devise (admin ou superviseur uniquement).</p>

              <h3 className="font-bold mb-2">En-têtes requis</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>

              <h3 className="font-bold mb-2">Corps de la requête</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {JSON.stringify(
                  {
                    code: "GBP",
                    name: "Livre sterling",
                    symbol: "£",
                    buyRate: 750.0,
                    sellRate: 755.0,
                    isActive: true,
                  },
                  null,
                  2,
                )}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    message: "Devise ajoutée avec succès",
                    currency: {
                      id: 3,
                      code: "GBP",
                      name: "Livre sterling",
                      symbol: "£",
                      buyRate: 750.0,
                      sellRate: 755.0,
                      isActive: true,
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">GET /api/reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Génère des rapports selon différents critères.</p>

              <h3 className="font-bold mb-2">En-têtes requis</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>

              <h3 className="font-bold mb-2">Paramètres de requête</h3>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>
                  <span className="font-semibold">type</span> - Type de rapport (transactions, supplies, cashiers)
                </li>
                <li>
                  <span className="font-semibold">startDate</span> - Date de début (format YYYY-MM-DD)
                </li>
                <li>
                  <span className="font-semibold">endDate</span> - Date de fin (format YYYY-MM-DD)
                </li>
                <li>
                  <span className="font-semibold">currencyCode</span> - Code de la devise (optionnel)
                </li>
                <li>
                  <span className="font-semibold">cashierId</span> - ID du caissier (optionnel)
                </li>
              </ul>

              <h3 className="font-bold mb-2">Exemple de réponse (type=transactions)</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    reportType: "transactions",
                    startDate: "2023-04-01T00:00:00.000Z",
                    endDate: "2023-04-13T23:59:59.999Z",
                    transactions: [
                      {
                        id: 1,
                        type: "buy",
                        cashier_name: "John Doe",
                        currency_code: "EUR",
                        amount: 100,
                        rate: 655.5,
                        local_amount: 65550,
                        timestamp: "2023-04-13T10:30:00",
                      },
                    ],
                    totals: {
                      EUR: {
                        buys: { count: 1, amount: 100 },
                        sells: { count: 0, amount: 0 },
                      },
                    },
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

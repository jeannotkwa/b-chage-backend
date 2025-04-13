import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, History } from "lucide-react"
import Link from "next/link"

export default function CashRegistersDocumentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <History className="h-8 w-8 mr-2 text-blue-600" />
            API Caisses
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
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">Documentation des Caisses</h2>
          <p className="text-xl text-gray-500">
            Endpoints pour la gestion des caisses, ouverture, fermeture et approvisionnement
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">GET /api/cash-registers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Récupère la liste des caisses avec possibilité de filtrage.</p>

              <h3 className="font-bold mb-2">Paramètres de requête</h3>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>
                  <span className="font-semibold">id</span> - ID de la caisse
                </li>
                <li>
                  <span className="font-semibold">status</span> - Statut de la caisse (open/closed)
                </li>
              </ul>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    cashRegisters: [
                      {
                        id: 1,
                        cashier_id: 1,
                        cashier_name: "John Doe",
                        opened_at: "2023-04-13T08:00:00",
                        status: "open",
                        initialBalances: [
                          {
                            currency_code: "XOF",
                            amount: 100000,
                          },
                          {
                            currency_code: "EUR",
                            amount: 500,
                          },
                        ],
                        currentBalances: [
                          {
                            currency_code: "XOF",
                            amount: 95000,
                          },
                          {
                            currency_code: "EUR",
                            amount: 600,
                          },
                        ],
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
              <CardTitle className="flex items-center text-blue-600">POST /api/cash-registers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Ouvre une nouvelle caisse avec les soldes initiaux.</p>

              <h3 className="font-bold mb-2">Corps de la requête</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {JSON.stringify(
                  {
                    initialBalances: [
                      {
                        currencyCode: "XOF",
                        amount: 100000,
                      },
                      {
                        currencyCode: "EUR",
                        amount: 500,
                      },
                    ],
                  },
                  null,
                  2,
                )}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    message: "Caisse ouverte avec succès",
                    cashRegister: {
                      id: 1,
                      cashierId: 1,
                      cashierName: "John Doe",
                      status: "open",
                      initialBalances: [
                        {
                          currencyCode: "XOF",
                          amount: 100000,
                        },
                        {
                          currencyCode: "EUR",
                          amount: 500,
                        },
                      ],
                      currentBalances: [
                        {
                          currencyCode: "XOF",
                          amount: 100000,
                        },
                        {
                          currencyCode: "EUR",
                          amount: 500,
                        },
                      ],
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
              <CardTitle className="flex items-center text-blue-600">POST /api/cash-registers/{"{id}"}/close</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Ferme une caisse existante avec les soldes finaux.</p>

              <h3 className="font-bold mb-2">Corps de la requête</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {JSON.stringify(
                  {
                    finalBalances: [
                      {
                        currencyCode: "XOF",
                        amount: 95000,
                      },
                      {
                        currencyCode: "EUR",
                        amount: 600,
                      },
                    ],
                    notes: "Fermeture normale de la caisse",
                  },
                  null,
                  2,
                )}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    message: "Caisse fermée avec succès",
                    differences: [
                      {
                        currencyCode: "XOF",
                        expected: 95000,
                        actual: 95000,
                        difference: 0,
                      },
                      {
                        currencyCode: "EUR",
                        expected: 600,
                        actual: 600,
                        difference: 0,
                      },
                    ],
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

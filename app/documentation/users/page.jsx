import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default function UsersDocumentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-2 text-purple-600" />
            API Utilisateurs
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
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">Documentation des Utilisateurs</h2>
          <p className="text-xl text-gray-500">
            Endpoints pour la gestion des utilisateurs, authentification et autorisations
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">POST /api/auth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Authentifie un utilisateur et génère un token JWT.</p>

              <h3 className="font-bold mb-2">Corps de la requête</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {JSON.stringify(
                  {
                    username: "admin",
                    password: "admin123",
                  },
                  null,
                  2,
                )}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    message: "Authentification réussie",
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    user: {
                      id: 1,
                      username: "admin",
                      role: "admin",
                      fullName: "Administrateur",
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
              <CardTitle className="flex items-center text-purple-600">GET /api/users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Récupère la liste des utilisateurs (admin uniquement).</p>

              <h3 className="font-bold mb-2">En-têtes requis</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    users: [
                      {
                        id: 1,
                        username: "admin",
                        full_name: "Administrateur",
                        role: "admin",
                        created_at: "2023-04-01T10:00:00",
                      },
                      {
                        id: 2,
                        username: "cashier1",
                        full_name: "John Doe",
                        role: "cashier",
                        created_at: "2023-04-02T11:30:00",
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
              <CardTitle className="flex items-center text-purple-600">POST /api/users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Crée un nouvel utilisateur (admin uniquement).</p>

              <h3 className="font-bold mb-2">En-têtes requis</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>

              <h3 className="font-bold mb-2">Corps de la requête</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">
                {JSON.stringify(
                  {
                    username: "cashier2",
                    password: "password123",
                    fullName: "Jane Smith",
                    role: "cashier",
                  },
                  null,
                  2,
                )}
              </pre>

              <h3 className="font-bold mb-2">Exemple de réponse</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(
                  {
                    message: "Utilisateur créé avec succès",
                    user: {
                      id: 3,
                      username: "cashier2",
                      fullName: "Jane Smith",
                      role: "cashier",
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

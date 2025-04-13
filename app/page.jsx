import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, DollarSign, History, Settings, Users } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-8 w-8 mr-2 text-green-600" />
            Bureau de Change API
          </h1>
          <Link href="/documentation">
            <Button variant="outline">Documentation</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Système de gestion pour bureau de change
          </h2>
          <p className="mt-4 text-xl text-gray-500">
            API complète pour la gestion des opérations courantes d'un bureau de change
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Transactions
              </CardTitle>
              <CardDescription>Gestion des achats et ventes de devises</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                API endpoints pour enregistrer les transactions, calculer les taux, et générer des bordereaux.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/documentation/transactions" className="w-full">
                <Button variant="ghost" className="w-full justify-between">
                  Voir les endpoints <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2 text-blue-600" />
                Caisse
              </CardTitle>
              <CardDescription>Ouverture, clôture et approvisionnement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                API endpoints pour la gestion quotidienne des caisses et l'approvisionnement des fonds.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/documentation/cash-registers" className="w-full">
                <Button variant="ghost" className="w-full justify-between">
                  Voir les endpoints <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Utilisateurs
              </CardTitle>
              <CardDescription>Authentification et autorisation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                API endpoints pour la gestion des utilisateurs, rôles et permissions.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/documentation/users" className="w-full">
                <Button variant="ghost" className="w-full justify-between">
                  Voir les endpoints <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-orange-600" />
                Paramètres
              </CardTitle>
              <CardDescription>Configuration du système</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                API endpoints pour la gestion des devises, taux de change et paramètres système.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/documentation/settings" className="w-full">
                <Button variant="ghost" className="w-full justify-between">
                  Voir les endpoints <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

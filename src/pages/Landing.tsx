import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Mic, Brain, BarChart3 } from 'lucide-react';

export default function Landing() {

  const features = [
    {
      icon: Brain,
      title: "Coach IA en Direct",
      description: "Conseils stratégiques personnalisés basés sur votre niveau et situation de jeu"
    },
    {
      icon: Mic,
      title: "Commandes Vocales",
      description: "Contrôlez votre scorecard à la voix : 'play', 'finish', 'undo'"
    },
    {
      icon: MapPin,
      title: "GPS Précis",
      description: "Distances automatiques entre vos coups avec une précision optimale"
    },
    {
      icon: BarChart3,
      title: "Statistiques Avancées",
      description: "Moyennes par club, progression et insights détaillés sur votre jeu"
    }
  ];

  return (
    <div className="min-h-screen bg-hs-beige">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-hs-green-900">
            HighSwing.ai
          </h1>
          
          <p className="text-xl md:text-2xl text-hs-ink mb-8 max-w-2xl mx-auto">
            Votre caddie IA personnel pour améliorer votre golf avec des conseils en temps réel
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-hs-green-100 hover:bg-hs-green-200 text-white px-8 py-3"
              asChild
            >
              <Link to="/signup">Créer un compte</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-hs-green-100 text-hs-green-100 hover:bg-hs-green-100 hover:text-white px-8 py-3"
              asChild
            >
              <Link to="/signin">Se connecter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-hs-green-900">
              Révolutionnez votre golf
            </h2>
            <p className="text-lg text-hs-ink max-w-2xl mx-auto">
              Une suite complète d'outils alimentés par l'IA pour analyser et améliorer chaque aspect de votre jeu
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white border-hs-sand/20 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="w-12 h-12 bg-hs-green-100/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-hs-green-100" />
                  </div>
                  <CardTitle className="text-lg text-hs-green-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-hs-ink">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-hs-green-900">
            Prêt à améliorer votre handicap ?
          </h2>
          <p className="text-lg text-hs-ink mb-8">
            Rejoignez les golfeurs qui utilisent l'IA pour progresser plus vite
          </p>
          <Button 
            size="lg" 
            className="bg-hs-green-100 hover:bg-hs-green-200 text-white"
            asChild
          >
            <Link to="/signup">Configurer mon profil</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
```
██╗  ██╗██╗ ██████╗ ██╗  ██╗███████╗██╗    ██╗██╗███╗   ██╗ ██████╗     █████╗ ██╗
██║  ██║██║██╔════╝ ██║  ██║██╔════╝██║    ██║██║████╗  ██║██╔════╝    ██╔══██╗██║
███████║██║██║  ███╗███████║███████╗██║ █╗ ██║██║██╔██╗ ██║██║  ███╗   ███████║██║
██╔══██║██║██║   ██║██╔══██║╚════██║██║███╗██║██║██║╚██╗██║██║   ██║   ██╔══██║██║
██║  ██║██║╚██████╔╝██║  ██║███████║╚███╔███╔╝██║██║ ╚████║╚██████╔╝██╗██║  ██║██║
╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝
```                                                                                  


# HighSwing.ai 🏌️‍♂️ - Votre Caddie IA Personnel

Bienvenue sur le dépôt de **HighSwing.ai**, un projet innovant né lors du hackathon **aivancity "AI for Sports"**. Notre mission : rendre le golf plus accessible, stratégique et amusant grâce à un assistant IA personnel qui tient dans votre poche.

https://github.com/user-attachments/assets/078f2db1-29d3-4255-b96d-c2ce5fcb367c

## 🎯 Le Problème

Pour de nombreux golfeurs amateurs, le parcours est un défi constant. Quel club choisir pour cette distance ? Comment aborder ce trou avec un vent de côté ? Que dit la règle si ma balle atterrit dans l'eau ? Obtenir des réponses fiables en temps réel est quasi impossible sans un caddie professionnel, qui représente un coût élevé. Cette incertitude peut gâcher le plaisir du jeu et freiner la progression.

## ✨ La Solution : HighSwing.ai

**HighSwing.ai** est une application web qui agit comme votre caddie et votre arbitre personnel, directement sur votre téléphone. En combinant le suivi GPS, la reconnaissance vocale et la puissance de l'IA, nous offrons aux golfeurs un avantage décisif sur le parcours.

Nous avons développé cette solution en 2 jours pour le hackathon, en nous concentrant sur un flux utilisateur simple et un problème bien défini : l'aide à la décision en temps réel.

### Fonctionnalités Clés

*   🧠 **Coach Stratégique IA** : Recevez des conseils personnalisés sur le choix du club, la stratégie de jeu pour un trou spécifique et la technique, basés sur votre niveau.
*   ⚖️ **Copilot des Règles** : Une question sur une situation de jeu complexe ? Notre IA, entraînée sur les règles officielles, vous donne une réponse claire et la procédure à suivre.
*    scorecard **Compteur de Score Intelligent** : Enregistrez vos coups d'un simple clic ou par la voix. Fini le crayon et le papier, concentrez-vous sur votre jeu !
*   🎤 **Commande Vocale** : Gardez les mains sur vos clubs. Dites simplement "play" pour ajouter un coup ou "finish" pour terminer le trou.
*   📍 **Suivi GPS** : Chaque coup est enregistré avec vos coordonnées GPS pour une analyse future de vos performances.

## ⚙️ Comment ça Marche ? (Architecture)

HighSwing.ai est construit sur une stack technologique moderne et serverless pour garantir rapidité et scalabilité.

*   **Frontend** : Une interface utilisateur réactive et élégante développée avec **React**, **TypeScript** et **Vite**. Les composants sont propulsés par **shadcn-ui** et stylisés avec **Tailwind CSS**.
*   **Backend & Base de Données** : Nous utilisons **Supabase** comme notre backend-as-a-service pour la gestion des utilisateurs (Auth), la base de données (PostgreSQL) et les fonctions serverless.
*   **L'Intelligence Artificielle** : Le cœur du projet réside dans deux fonctions serverless (Edge Functions) sur Supabase :
    1.  **`voice-to-text`** : L'audio capturé depuis le micro du client est envoyé à cette fonction, qui utilise l'API **OpenAI Whisper** pour une transcription ultra-rapide et précise.
    2.  **`ai-coach`** : Le texte de l'utilisateur (transcrit ou tapé) est envoyé à cette fonction. Selon le mode choisi ("Coach" ou "Règles"), un *prompt système* spécifique est envoyé à l'API **OpenAI GPT-4o Mini** pour générer une réponse pertinente et contextuelle.

## 🚀 Démarrage Rapide

Pour lancer le projet en local sur votre machine, suivez ces étapes :

**Prérequis :**
*   Node.js (v18 ou supérieur)
*   npm

**Installation :**

1.  **Clonez le dépôt :**
    ```sh
    git clone <URL_DU_DEPOT_GIT>
    ```

2.  **Naviguez dans le dossier du projet :**
    ```sh
    cd HACKATHON
    ```

3.  **Installez les dépendances :**
    ```sh
    npm install
    ```

4.  **Configurez les variables d'environnement :**
    Créez un fichier `.env.local` à la racine du projet en vous basant sur le modèle ci-dessous. Vous trouverez ces clés dans le dashboard de votre projet Supabase.

    ```env
    VITE_SUPABASE_URL="https://votresuperbeurl.supabase.co"
    VITE_SUPABASE_ANON_KEY="votreclepubliqueanon.eyJ..."
    ```
    > **Note** : Les fonctions Supabase (`ai-coach` et `voice-to-text`) nécessitent une variable d'environnement `OPENAI_API_KEY` configurée directement dans les paramètres de votre projet Supabase.

5.  **Lancez le serveur de développement :**
    ```sh
    npm run dev
    ```

    L'application devrait maintenant être accessible à l'adresse `http://localhost:8080`.

## 🏆 L'équipe

Ce projet a été imaginé et développé avec passion par une équipe d'étudiants d'aivancity.

*   **Antoine LOYAU-TULASNE**
*   **Celian FAUCILLE**
*   **Ethan ORAIN**
*   **Jérémie ONDZAGHE**
*   **Léo MERVILLE**

## 🔮 Futures Améliorations

HighSwing.ai n'est que le début. Voici quelques idées pour la suite :

*   **Analyse Post-Partie** : Un tableau de bord complet avec des statistiques détaillées sur vos parties (fairways touchés, greens en régulation, performance au putting...).
*   **Cartes de Parcours Interactives** : Visualiser les parcours de golf avec des distances GPS en temps réel.
*   **Analyse de Swing par Vidéo** : Permettre aux utilisateurs de télécharger une vidéo de leur swing pour une analyse et des conseils de l'IA.
*   **Personnalisation des Clubs** : Enregistrer les distances moyennes pour chaque club afin d'affiner les recommandations de l'IA.

---

Merci d'avoir pris le temps de découvrir HighSwing.ai ! Nous espérons que vous apprécierez notre vision du futur du golf.

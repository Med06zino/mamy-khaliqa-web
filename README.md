# Mamy Khaliqa : boutique de cosmétiques

Application e-commerce complète : **React + Vite + TypeScript + Tailwind** (frontend) et **Django + Django REST Framework + PostgreSQL** (backend).

Identité : palette rose poudré / prune / or champagne, Playfair Display + Inter, icônes **Lucide React uniquement, aucun emoji** (contrôle automatique : `npm run check:emoji`).

## État du projet (à lire en premier)

| Élément | Statut |
|---|---|
| Catalogue, catégories, fiches produits, filtres, tri, pagination serveur | Implémenté et testé |
| Comptes clients (inscription, connexion, réinitialisation, profil, adresses, favoris, sécurité) | Implémenté et testé |
| Panier (stocké dans le navigateur) et commande sur le site (invité ou connecté) | Implémenté et testé |
| Calcul serveur des prix, stocks et frais ; idempotence ; annulation avec restitution du stock ; historique de statuts | Implémenté et testé |
| Commande via WhatsApp (message prérempli, numéro configurable) | Implémenté (message et URL testés) |
| Administration (tableau de bord, produits, photos, variantes, commandes, clients, avis, messages, zones, catégories, paramètres) | Implémenté ; parcours principal vérifié dans un navigateur |
| Documentation OpenAPI | `/api/docs/` |
| Paiement en ligne | **Non actif (phase 2)** : modèle `Payment` préparé, aucun faux paiement |
| Déploiement Vercel / Render | **Fichiers préparés, non déployés ni testés en conditions réelles** |
| PostgreSQL | Configuré, mais les tests ont été exécutés avec **SQLite** : relancez-les sur PostgreSQL avant la mise en ligne |

Points à connaître :

- Le panier n'est **pas synchronisé** avec le compte client (il reste dans le navigateur).
- Une commande passée **sans compte** n'est pas consultable ensuite par le client (pas de suivi par référence). Elle est visible dans l'administration.
- Ouvrir WhatsApp **n'enregistre aucune commande** et ne prouve pas l'envoi du message. Seule la commande faite sur le site est enregistrée.
- Si la zone de livraison n'est pas dans la liste, le client choisit « Autre zone » : aucun tarif n'est inventé, les frais sont confirmés puis saisis par l'administratrice.
- Les pages légales (CGV, confidentialité, retours) sont des **textes sobres à faire valider** par la propriétaire avant le lancement.
- Aucune composition, certification ou promesse de résultat n'est écrite : ces champs sont à renseigner par la marque.
- Les 3 produits créés par `seed_initial --demo` sont **fictifs** : à supprimer avant le lancement.
- Les e-mails (réinitialisation du mot de passe) s'affichent dans la console tant qu'aucun SMTP n'est configuré.
- Le responsive a été contrôlé sur l'accueil et la boutique (390 px et 1280 px, sans débordement horizontal) ; faites une passe complète sur vos appareils.

## Structure

```
backend/   Django (apps : accounts, catalog, orders, deliveries, reviews, contact, store_settings, common)
frontend/  React (pages, components, store, lib, hooks, test)
render.yaml, docker-compose.yml
```

## Installation en développement

Prérequis : Python 3.12, Node 20+, (optionnel) Docker pour PostgreSQL.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                      # puis éditer (DJANGO_DEBUG=True en développement)
docker compose -f ../docker-compose.yml up -d db          # PostgreSQL local (sinon DATABASE_URL=sqlite:///db.sqlite3)
python manage.py migrate
python manage.py seed_initial                             # crée les 3 catégories + paramètres (n'écrase rien)
python manage.py createsuperuser                          # compte administrateur (e-mail + mot de passe)
python manage.py runserver                                # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                                               # http://localhost:5173 (proxy /api vers :8000)
```

### Premiers pas

1. Connectez-vous sur `/connexion` avec le compte administrateur : vous êtes redirigée vers `/admin`.
2. Paramètres : renseignez le numéro WhatsApp (format `221770000000`), l'e-mail, les réseaux et les **zones de livraison avec leurs frais**.
3. Produits : créez vos produits, ajoutez photos (JPEG/PNG/WEBP, 5 Mo max), variantes et stocks, puis cochez « Publié ».

## Tests et contrôles

```bash
cd backend  && python manage.py test     # 23 tests : auth, permissions, isolation, catalogue, prix, stock, commandes, idempotence, annulation, avis
cd frontend && npm run lint && npm test && npm run check:emoji && npm run build
```

## API

Documentation interactive : `http://localhost:8000/api/docs/` (schéma : `/api/schema/`). Routes principales sous `/api/v1/` :

`categories/`, `products/`, `products/<slug>/`, `products/best-sellers/`, `auth/{register,login,logout,me,password-reset,change-password}/`, `addresses/`, `favorites/`, `orders/`, `orders/<numero>/`, `delivery-zones/`, `reviews/`, `contact/`, `settings/`, et `admin/{dashboard,products,variants,categories,orders,customers,delivery-zones,reviews,messages,settings}/` (réservées au personnel).

Format d'erreur homogène : `{"detail": "...", "errors": {"champ": ["..."]}}`.

## Sécurité

- Session Django en **cookie HttpOnly**, protection **CSRF** (en-tête `X-CSRFToken`), limitation de débit sur connexion, inscription, réinitialisation, contact et commandes.
- Le backend recalcule **prix, stock et frais** ; transactions avec verrous de lignes (`select_for_update`) ; clé d'idempotence `Idempotency-Key`.
- Chaque client n'accède qu'à ses commandes, adresses et favoris ; les routes `admin/*` sont réservées à `is_staff`.
- Images : taille et format réel vérifiés (Pillow). Mots de passe validés et hachés par Django.
- Production : `DEBUG=False`, HTTPS forcé, cookies sécurisés, HSTS ; `ALLOWED_HOSTS`, CORS et CSRF configurables. Secrets uniquement dans `.env` (exclu de Git).
- Limite connue : la limitation de débit utilise le cache local de chaque processus ; avec plusieurs instances, configurez un cache partagé (Redis).

## Déploiement

### Backend (Render ou équivalent)

1. Créez une base PostgreSQL et un service web (voir `render.yaml`). Build : `./build.sh` (collectstatic + migrate, **sans jamais toucher aux données**). Démarrage : `gunicorn config.wsgi:application`.
2. Renseignez les variables ci-dessous et attachez un **disque persistant** monté sur `MEDIA_ROOT` pour les photos.
3. Créez l'administratrice : `python manage.py createsuperuser`, puis `python manage.py seed_initial`.
4. Activez les **sauvegardes** PostgreSQL du prestataire.

### Frontend (Vercel ou équivalent)

1. Répertoire racine : `frontend`, build `npm run build`, sortie `dist`.
2. Dans `frontend/vercel.json`, remplacez `VOTRE-BACKEND.onrender.com` par l'adresse réelle du backend. Les *rewrites* font passer `/api` et `/media` par le même domaine : cookies et CSRF fonctionnent sans configuration cross-site, et le rechargement des pages internes marche.
3. Laissez `VITE_API_URL` vide et renseignez `VITE_SITE_URL` (URL publique du site).
4. Côté backend : `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` = URL du site Vercel.

### Variables d'environnement (backend)

| Variable | Rôle |
|---|---|
| `DJANGO_SECRET_KEY` | Clé secrète (obligatoire en production) |
| `DJANGO_DEBUG` | `False` en production |
| `DJANGO_ALLOWED_HOSTS` | Hôtes autorisés, séparés par des virgules |
| `DATABASE_URL` | URL PostgreSQL (obligatoire en production) |
| `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Origines du site |
| `FRONTEND_URL` | Liens de réinitialisation du mot de passe, sitemap |
| `EMAIL_BACKEND`, `DEFAULT_FROM_EMAIL` | E-mail (SMTP à configurer) |
| `MEDIA_ROOT` | Dossier des photos (disque persistant) |
| `WHATSAPP_NUMBER` | Numéro initial (modifiable dans l'administration) |

Variables frontend : `VITE_API_URL` (laisser vide) et `VITE_SITE_URL`. Ne mettez jamais de secret dans une variable `VITE_*`.

## Connecter un nom de domaine (plus tard)

1. Achetez le domaine, ajoutez-le dans Vercel (Domains) et créez les enregistrements DNS indiqués ; HTTPS est activé automatiquement.
2. Backend : ajoutez le domaine à `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` (avec `https://`), puis mettez à jour `FRONTEND_URL` et `VITE_SITE_URL`.
3. Redéployez, vérifiez connexion, commande et `/sitemap.xml`, puis soumettez le sitemap à Google Search Console.

## Paiements en ligne : phase 2

Le modèle `orders.Payment` (fournisseur, référence, montant, statut, identifiant d'événement) et la séparation `status` / `payment_status` sont prêts. Pour activer Wave, Orange Money ou autre :

1. Choisir le prestataire et obtenir ses clés (côté serveur uniquement, en variables d'environnement).
2. Créer une interface de service par prestataire (`initiate_payment`, `verify_webhook`) dans `apps/orders/payments/`.
3. Ajouter un endpoint de notification **signé**, vérifié côté serveur et **idempotent** (via `raw_event_id` / `provider_reference`) qui passe `payment_status` à `paid`.
4. N'afficher le moyen de paiement dans le checkout que lorsqu'il est configuré, et ajouter les tests (signature invalide, rejeu, montant différent).

Pour l'instant, l'administratrice marque manuellement une commande comme payée ; le chiffre d'affaires ne compte que ces commandes.


Ce que vous voulez	Adresse
Le site (boutique, panier, connexion)	http://localhost:5173
L’administration de la boutique	http://localhost:5173/admin (après connexion)
La documentation de l’API	http://localhost:8000/api/docs/
L’admin technique Django (secours)	http://localhost:8000/django-admin/


 — Déjà présent : superadmin@dev.local
  — Déjà présent : admin@dev.local
  — Déjà présent : client1@dev.local
  — Déjà présent : client2@dev.local
  — Déjà présent : inactive@dev.local

Comptes disponibles pour tester :

  [ADMIN ]  superadmin@dev.local            Dev!SuperAdmin2024#
  [ADMIN ]  admin@dev.local                 Dev!Admin2024#
  [CLIENT]  client1@dev.local               Dev!Client2024#
  [CLIENT]  client2@dev.local               Dev!Client2024#
  [CLIENT]  inactive@dev.local              Dev!Client2024#  [INACTIF]

  Admin Django : http://127.0.0.1:8000/django-admin/
  API Swagger  : http://127.0.0.1:8000/api/docs/
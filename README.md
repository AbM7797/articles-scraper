```markdown
# README - Articles Scraper

Ce document décrit comment lancer l'application "Articles Scraper" en local à l'aide de Docker Compose et comment la déployer sur un cluster Minikube.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [Helm](https://helm.sh/docs/intro/install/)

## Lancer l'application en local

Pour lancer l'application en local, procédez comme suit :

1. **Clonez le dépôt :**

   ```bash
   git clone https://github.com/AbM7797/articles-scraper.git
   cd articles-scraper
   ```

2. **Construisez l'image Docker :**

   Assurez-vous que le Docker daemon est en cours d'exécution. Ensuite, exécutez la commande suivante :

   ```bash
   docker-compose build
   ```

3. **Lancez les services :**

   Après avoir construit l'image, vous pouvez lancer l'application en utilisant :

   ```bash
   docker-compose up
   ```

4. **Accédez à l'application :**

   Ouvrez votre navigateur et allez à `http://localhost:3000` (ou le port configuré dans votre `docker-compose.yml`).

## Consommer l'API

Voici quelques exemples de commandes `curl` pour consommer l'API :

1. **Récupérer des articles :**

   ```bash
   curl --location 'http://localhost:3000/articles?page=1&pageSize=10&days=7&sortBy=publication_date&order=DESC'
   ```

   Cette commande récupère une liste d'articles avec les paramètres spécifiés.

2. **Lancer une opération de scraping :**

   ```bash
   curl --location --request POST 'http://localhost:3000/articles/scrape?day=2024-12-16'
   ```

   Cette commande envoie une requête POST pour lancer le scraping des articles pour la date spécifiée. Si vous ne passez pas de date dans la requête, l'application prendra par défaut la date d'aujourd'hui. De même, si vous passez une date dans le futur, l'application utilisera également la date d'aujourd'hui.

## Script SQL pour la base de données

Pour créer la table `articles` et ajouter un index, utilisez les scripts SQL suivants :

1. **Créer la table `articles` :**

   ```sql
   CREATE TABLE IF NOT EXISTS `articles` (
       `id` INTEGER auto_increment,
       `title` VARCHAR(255) NOT NULL,
       `url` VARCHAR(255) NOT NULL,
       `publication_date` DATETIME,
       `source` VARCHAR(255) NOT NULL,
       `createdAt` DATETIME NOT NULL,
       `updatedAt` DATETIME NOT NULL,
       UNIQUE `url_unique` (`url`),
       PRIMARY KEY (`id`)
   ) ENGINE=InnoDB;
   ```

2. **Ajouter un index :**

   ```sql
   ALTER TABLE `articles` ADD INDEX `idx_source_publication_date` (`source`, `publication_date`);
   ```

## Déployer l'application sur Minikube

Pour déployer l'application sur un cluster Minikube, suivez ces étapes :

1. **Démarrez Minikube :**

   Si Minikube n'est pas encore en cours d'exécution, démarrez-le avec :

   ```bash
   minikube start
   ```

2. **Construisez l'image Docker pour Minikube :**

   Minikube utilise un environnement Docker distinct. Pour construire l'image Docker dans l'environnement de Minikube, exécutez :

   ```bash
   eval $(minikube docker-env)
   docker build -t articles-scraper .
   ```

3. **Charger l'image dans Minikube :**

   Si vous avez utilisé `docker-compose`, vous pouvez également charger l'image à l'aide de la commande suivante :

   ```bash
   minikube image load articles-scraper
   ```

4. **Installer Helm :**

   Si vous ne l'avez pas encore fait, installez Helm dans votre cluster Minikube :

   ```bash
   helm init
   ```

5. **Déployer l'application avec Helm :**

   Exécutez la commande suivante pour déployer l'application :

   ```bash
   helm install articles-scraper ./helm-chart
   ```

6. **Accédez à l'application sur Minikube :**

   Pour accéder à votre application, utilisez la commande suivante pour obtenir l'URL :

   ```bash
   minikube service articles-scraper-service --url
   ```

## Conclusion

Vous avez maintenant lancé l'application "Articles Scraper" en local et l'avez déployée sur Minikube. Pour toute question ou problème, n’hésitez pas à consulter la documentation officielle de Docker, Minikube et Helm.

## Aide

Pour plus d'informations, consultez :

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Minikube](https://minikube.sigs.k8s.io/docs/)
- [Documentation Helm](https://helm.sh/docs/)
```
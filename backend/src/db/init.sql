-- ============================================
-- PROJET UMBRELLA — Initialisation de la base
-- ============================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des contenus de pages
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  page_key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(500),
  body TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Données initiales
-- ============================================

-- Utilisateur administrateur par défaut (mot de passe : admin123)
INSERT INTO users (username, password, email, full_name, role)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin@umbrella.tn',
  'Administrateur',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Contenu de la page d'accueil
INSERT INTO content (page_key, title, body) VALUES (
  'home',
  'Accueil — PROJET UMBRELLA',
  'Bienvenue sur le site du PROJET UMBRELLA, une initiative de l''Observatoire du Sahara et du Sahel (OSS) en Tunisie. Ce projet est financé par le Fonds pour l''Environnement Mondial (GEF) et le Programme des Nations Unies pour l''Environnement (UNEP). L''objectif principal est le suivi de la dégradation des terres dans les zones arides et semi-arides de la Tunisie, en contribuant à la lutte contre la désertification et à la gestion durable des ressources naturelles.'
) ON CONFLICT (page_key) DO NOTHING;

-- Contenu de la page À propos
INSERT INTO content (page_key, title, body) VALUES (
  'about',
  'À propos — PROJET UMBRELLA',
  'Le PROJET UMBRELLA est un programme régional coordonné par l''Observatoire du Sahara et du Sahel (OSS) visant à renforcer les capacités de suivi de la dégradation des terres en Afrique du Nord. En Tunisie, le projet se concentre sur la collecte et l''analyse de données géospatiales, le développement d''indicateurs de dégradation des terres et la sensibilisation des parties prenantes locales. Grâce au soutien du GEF et de l''UNEP, le projet met en œuvre des approches innovantes basées sur la télédétection et les systèmes d''information géographique (SIG) pour cartographier et suivre l''évolution de la désertification.'
) ON CONFLICT (page_key) DO NOTHING;

-- Contenu de la page Partenaires
INSERT INTO content (page_key, title, body) VALUES (
  'partners',
  'Partenaires — PROJET UMBRELLA',
  'Le PROJET UMBRELLA bénéficie du soutien de plusieurs partenaires internationaux et nationaux : l''Observatoire du Sahara et du Sahel (OSS) en tant qu''institution de coordination, le Fonds pour l''Environnement Mondial (GEF) en tant que bailleur de fonds principal, le Programme des Nations Unies pour l''Environnement (UNEP) en tant qu''agence d''exécution, ainsi que les autorités tunisiennes et les organisations de la société civile impliquées dans la gestion durable des terres.'
) ON CONFLICT (page_key) DO NOTHING;

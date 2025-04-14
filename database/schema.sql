-- Base de données pour le système de gestion de bureau de change
-- À exécuter dans phpMyAdmin ou via la ligne de commande MySQL

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS bureau_de_change;
USE bureau_de_change;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'supervisor', 'cashier') NOT NULL,
  created_at DATETIME NOT NULL,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des devises
CREATE TABLE IF NOT EXISTS currencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  buy_rate DECIMAL(15, 6) NOT NULL,
  sell_rate DECIMAL(15, 6) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  created_by INT,
  updated_at DATETIME NOT NULL,
  updated_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des caisses
CREATE TABLE IF NOT EXISTS cash_registers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cashier_id INT NOT NULL,
  cashier_name VARCHAR(100) NOT NULL,
  opened_at DATETIME NOT NULL,
  closed_at DATETIME,
  closed_by INT,
  status ENUM('open', 'closed') NOT NULL,
  notes TEXT,
  FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des soldes de caisse
CREATE TABLE IF NOT EXISTS cash_register_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cash_register_id INT NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_type ENUM('initial', 'current', 'final') NOT NULL,
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('buy', 'sell') NOT NULL,
  cash_register_id INT NOT NULL,
  cashier_id INT NOT NULL,
  cashier_name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  currency_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  rate DECIMAL(15, 6) NOT NULL,
  local_amount DECIMAL(15, 2) NOT NULL,
  client_info JSON,
  notes TEXT,
  timestamp DATETIME NOT NULL,
  receipt_number VARCHAR(20) NOT NULL UNIQUE,
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT,
  FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Table des approvisionnements
CREATE TABLE IF NOT EXISTS supplies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cash_register_id INT NOT NULL,
  cashier_id INT NOT NULL,
  cashier_name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  currency_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  source ENUM('internal', 'external') NOT NULL,
  reference VARCHAR(100),
  notes TEXT,
  attachment_url VARCHAR(255),
  timestamp DATETIME NOT NULL,
  supply_number VARCHAR(20) NOT NULL UNIQUE,
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT,
  FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Table de l'historique des caisses
CREATE TABLE IF NOT EXISTS cash_register_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cash_register_id INT NOT NULL,
  cashier_id INT NOT NULL,
  action ENUM('open', 'close') NOT NULL,
  timestamp DATETIME NOT NULL,
  performed_by INT,
  data JSON,
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table de liaison entre caisses et transactions
CREATE TABLE IF NOT EXISTS cash_register_transactions (
  cash_register_id INT NOT NULL,
  transaction_id INT NOT NULL,
  PRIMARY KEY (cash_register_id, transaction_id),
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Table de liaison entre caisses et approvisionnements
CREATE TABLE IF NOT EXISTS cash_register_supplies (
  cash_register_id INT NOT NULL,
  supply_id INT NOT NULL,
  PRIMARY KEY (cash_register_id, supply_id),
  FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
);

-- Table des compteurs pour les numéros séquentiels
CREATE TABLE IF NOT EXISTS counters (
  counter_name VARCHAR(50) PRIMARY KEY,
  last_value INT NOT NULL
);

-- Insertion d'un utilisateur administrateur par défaut
-- Mot de passe: admin123 (haché avec bcrypt)
INSERT INTO users (username, password, full_name, role, created_at)
VALUES ('admin', '$2b$10$wJXGvOZ3Jc3c6EcLxW0MuOBPu6u2XyfwcCR7I9StkKkZxZuvTAslK', 'Administrateur', 'admin', NOW());

-- Insertion de quelques devises par défaut
INSERT INTO currencies (code, name, symbol, buy_rate, sell_rate, is_active, created_at, created_by, updated_at, updated_by)
VALUES 
('EUR', 'Euro', '€', 655.00, 660.00, TRUE, NOW(), 1, NOW(), 1),
('USD', 'Dollar américain', '$', 590.00, 595.00, TRUE, NOW(), 1, NOW(), 1),
('GBP', 'Livre sterling', '£', 750.00, 755.00, TRUE, NOW(), 1, NOW(), 1);

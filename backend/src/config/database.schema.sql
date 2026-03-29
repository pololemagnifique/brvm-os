-- BRVM-OS Database Schema v1.0
-- Phase A, Semaine 1

BEGIN;

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    role          VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verification_token VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STOCKS (reference list of BRVM tickers)
-- =============================================
CREATE TABLE IF NOT EXISTS stocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker          VARCHAR(10) UNIQUE NOT NULL,
    company_name    VARCHAR(255) NOT NULL,
    sector          VARCHAR(100),
    market          VARCHAR(20) DEFAULT 'BRVM',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- EOD_PRICES (daily closing prices)
-- =============================================
CREATE TABLE IF NOT EXISTS eod_prices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id      UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    trading_date  DATE NOT NULL,
    open_price    DECIMAL(18, 4),
    high_price    DECIMAL(18, 4),
    low_price     DECIMAL(18, 4),
    close_price   DECIMAL(18, 4) NOT NULL,
    volume         BIGINT DEFAULT 0,
    previous_close DECIMAL(18, 4),
    change_pct    DECIMAL(8, 4),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(stock_id, trading_date)
);

CREATE INDEX IF NOT EXISTS idx_eod_prices_date ON eod_prices(trading_date);
CREATE INDEX IF NOT EXISTS idx_eod_prices_stock ON eod_prices(stock_id);

-- =============================================
-- PORTFOLIOS
-- =============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id  UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    stock_id      UUID NOT NULL REFERENCES stocks(id),
    type          VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity      INTEGER NOT NULL,
    price         DECIMAL(18, 4) NOT NULL,
    fees          DECIMAL(18, 4) DEFAULT 0,
    transaction_date DATE NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stock ON transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- =============================================
-- WATCHLISTS
-- =============================================
CREATE TABLE IF NOT EXISTS watchlists (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WATCHLIST_ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS watchlist_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    stock_id    UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(watchlist_id, stock_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist ON watchlist_items(watchlist_id);

-- =============================================
-- ALERTS
-- =============================================
CREATE TABLE IF NOT EXISTS alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_id     UUID REFERENCES stocks(id) ON DELETE SET NULL,
    type         VARCHAR(30) NOT NULL,
    condition    VARCHAR(20) NOT NULL,
    threshold    DECIMAL(18, 4) NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    last_triggered TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);

-- =============================================
-- INDICES (BRVM market indices)
-- =============================================
CREATE TABLE IF NOT EXISTS indices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_key     VARCHAR(30) UNIQUE NOT NULL,
    name          VARCHAR(100) NOT NULL,
    trading_date  DATE NOT NULL,
    value         DECIMAL(18, 4) NOT NULL,
    change_pct    DECIMAL(8, 4),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(index_key, trading_date)
);

CREATE INDEX IF NOT EXISTS idx_indices_date ON indices(trading_date);

COMMIT;

-- Seed: Insert BRVM stock reference data (47 tickers)
INSERT INTO stocks (ticker, company_name, sector) VALUES
('ABJC', 'SIB SABELLife CI', 'Assurance'),
('BICC', 'BICICI', 'Banque'),
('BNBC', 'Bank Of Africa Niger', 'Banque'),
('BOAB', 'Bank Of Africa Burkina', 'Banque'),
('BOABF', 'Bank Of Africa BF', 'Banque'),
('BOAC', 'Bank Of Africa CI', 'Banque'),
('BOAM', 'Bank Of Africa Mali', 'Banque'),
('BOAN', 'Bank Of Africa Niger', 'Banque'),
('BOAS', 'Bank Of Africa Senegal', 'Banque'),
('BRVM', 'BRVM Indice Composite', 'Indice'),
('CI000', 'SIB SABELLife', 'Assurance'),
('CNCC', 'Cnpr', 'Assurance'),
('ECOC', 'Ecobank CI', 'Banque'),
('FTSC', 'Forts Timber', 'Industrie'),
('GSRC', 'Gtotal.sn', 'Énergie'),
('INTB', 'Bureau De Change Intercontinent', 'Service Financier'),
('IVEY', 'Ivorian Eyab', 'Transport'),
('MAPE', 'MApi', 'Technologie'),
('MTTC', 'MTT Cargo', 'Transport'),
('NCBC', 'NSIA Banque CI', 'Banque'),
('NEIP', 'New India Assurance', 'Assurance'),
('NTLC', 'Soor Insurance', 'Assurance'),
('OHIM', 'Oilm', 'Énergie'),
('ONXB', 'Banca Int', 'Banque'),
('ORAC', 'Orange CI', 'Télécommunications'),
('PALC', 'Pta Bank', 'Banque'),
('PBCP', 'Bcp', 'Finance'),
('PRSC', 'Tractafric Motors CI', 'Automobile'),
('SAFC', 'Safca', 'Finance'),
('SAHM', 'Saham Assurance Mali', 'Assurance'),
('SCRH', 'Sacor Sn', 'Distribution'),
('SDCC', 'La Sudanese', 'Assurance'),
('SEMC', 'Semyong', 'Industrie'),
('SHEC', 'Shell CI', 'Énergie'),
('SIER', 'Sierra Rutile', 'Industrie'),
('SIVC', 'Erium CI', 'Industrie'),
('SLBC', 'S兰花', 'Service'),
('SMBC', 'SMB CI', 'Banque'),
('SOGC', 'SODGCI', 'Service Public'),
('SONABEL', 'SONABEL', 'Énergie'),
('SPHC', 'SepHarma', 'Santé'),
('STAC', 'Setao CI', 'Industrie'),
('SVC', 'S奶奶', 'Finance'),
('TTLS', 'TotalEnergies Marketing Senegal', 'Énergie'),
('TTRC', 'Tramor', 'Transport'),
('UNLC', 'Unilever CI', 'Biens De Consommation')
ON CONFLICT (ticker) DO NOTHING;

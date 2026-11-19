-- Target schema for replacing the localStorage demo layer (Postgres).
create table stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  prompt text not null,
  category text not null,
  palette jsonb not null,
  apps jsonb not null default '{"reviews":true,"popup":false,"email":true,"loyalty":false}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on stores (owner_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer,
  currency text not null default 'USD',
  variants text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'active' check (status in ('active','draft')),
  seo_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products (store_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  number integer not null,
  customer_name text not null,
  customer_email text not null,
  shipping_address jsonb not null,
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  shipping_cents integer not null,
  total_cents integer not null,
  currency text not null default 'USD',
  status text not null default 'paid' check (status in ('paid','fulfilled','refunded')),
  created_at timestamptz not null default now(),
  unique (store_id, number)
);
create index on orders (store_id, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title text not null,
  variant text,
  qty integer not null check (qty > 0),
  unit_cents integer not null
);
create index on order_items (order_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);
create index on reviews (product_id);

create table email_flows (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  kind text not null check (kind in ('welcome','abandoned_checkout','post_purchase','review_request')),
  enabled boolean not null default true,
  delay_minutes integer not null default 60,
  subject text not null,
  unique (store_id, kind)
);

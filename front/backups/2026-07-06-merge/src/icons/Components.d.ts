// Components.d.ts — the complete catalog of the 11 component(s) in
// Components.bundle.js. READ THIS FILE BEFORE USING THE BUNDLE: component
// names are derived from Figma layer names (sanitized to PascalCase,
// deduplicated) and may differ from what the design calls them — the
// "figma layer" comment above each interface maps them back.
// After the bundle <script> loads, every component is a window global
// (e.g. window.PostalCode11) and usable directly in JSX.
import * as React from 'react';

// figma layer: "postal code_1 1" (node 15:66)
export interface PostalCode11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "profile_1 1" (node 15:73)
export interface Profile11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "reports-charts_1 1" (node 15:79)
export interface ReportsCharts11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "search_1 1" (node 15:88)
export interface Search11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "secretary_1 1" (node 15:95)
export interface Secretary11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "seller-cashier_1 1" (node 15:105)
export interface SellerCashier11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "setting_1 1" (node 15:112)
export interface Setting11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "shop-market_1 1" (node 15:117)
export interface ShopMarket11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "support_1 1" (node 15:123)
export interface Support11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "wallet_1 1" (node 15:146)
export interface Wallet11Props {
  className?: string;
  style?: React.CSSProperties;
}

// figma layer: "website_1 1" (node 15:152)
export interface Website11Props {
  className?: string;
  style?: React.CSSProperties;
}

declare const PostalCode11: React.FC<PostalCode11Props>;
declare const Profile11: React.FC<Profile11Props>;
declare const ReportsCharts11: React.FC<ReportsCharts11Props>;
declare const Search11: React.FC<Search11Props>;
declare const Secretary11: React.FC<Secretary11Props>;
declare const SellerCashier11: React.FC<SellerCashier11Props>;
declare const Setting11: React.FC<Setting11Props>;
declare const ShopMarket11: React.FC<ShopMarket11Props>;
declare const Support11: React.FC<Support11Props>;
declare const Wallet11: React.FC<Wallet11Props>;
declare const Website11: React.FC<Website11Props>;
declare global {
  interface Window {
    PostalCode11: React.FC<PostalCode11Props>;
    Profile11: React.FC<Profile11Props>;
    ReportsCharts11: React.FC<ReportsCharts11Props>;
    Search11: React.FC<Search11Props>;
    Secretary11: React.FC<Secretary11Props>;
    SellerCashier11: React.FC<SellerCashier11Props>;
    Setting11: React.FC<Setting11Props>;
    ShopMarket11: React.FC<ShopMarket11Props>;
    Support11: React.FC<Support11Props>;
    Wallet11: React.FC<Wallet11Props>;
    Website11: React.FC<Website11Props>;
  }
}

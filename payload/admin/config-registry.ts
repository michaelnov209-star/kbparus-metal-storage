import type { CollectionConfig, GlobalConfig } from "payload";
import { CalculatorProfiles } from "../collections/CalculatorProfiles";
import { Categories } from "../collections/Categories";
import { Leads } from "../collections/Leads";
import { Media } from "../collections/Media";
import { Products } from "../collections/Products";
import { Subcategories } from "../collections/Subcategories";
import { Users } from "../collections/Users";
import { Contacts } from "../globals/Contacts";
import { HomeContent } from "../globals/HomeContent";
import { LeadManagement } from "../globals/LeadManagement";
import { SiteNavigation } from "../globals/SiteNavigation";

export { Users };

export const payloadCollections: CollectionConfig[] = [
  Users,
  Media,
  Categories,
  Subcategories,
  Products,
  CalculatorProfiles,
  Leads
];

export const payloadGlobals: GlobalConfig[] = [
  HomeContent,
  Contacts,
  LeadManagement,
  SiteNavigation
];

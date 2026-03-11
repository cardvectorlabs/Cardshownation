// Lightweight show type for card/list views (matches showCardSelect in shows.ts)
export type ShowCard = {
  id: string;
  title: string;
  slug: string;
  city: string;
  state: string;
  startDate: Date;
  endDate: Date;
  startTimeLabel: string | null;
  isFree: boolean;
  admissionPrice: string | null;
  categories: string[];
  flyerImageUrl: string | null;
  tableCount: number | null;
  featuredRank: number | null;
  venue: { name: string } | null;
};

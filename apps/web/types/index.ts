export type ShowCard = {
  id: string;
  title: string;
  slug: string;
  city: string;
  state: string;
  startDate: Date;
  endDate: Date;
  startTimeLabel: string | null;
  endTimeLabel: string | null;
  isFree: boolean;
  admissionPrice: string | null;
  categories: string[];
  flyerImageUrl: string | null;
  tableCount: number | null;
  vendorDetails: string | null;
  featuredRank: number | null;
  venue: { name: string } | null;
};

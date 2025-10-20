export type AICategory = "Interested"|"Meeting Booked"|"Not Interested"|"Spam"|"Out of Office"|"Uncategorized";

export interface EmailDocument {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: Date;
  aiCategory: AICategory;
  indexedAt: Date;
}

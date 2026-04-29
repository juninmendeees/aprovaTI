export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date YYYY-MM-DD */
  publishedAt: string;
  /** Markdown body */
  body: string;
};

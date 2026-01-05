# Thinking about Mackerel, Malleable Data Querying

One way is to make the properties that aren't supposed to be accessible to end-users explicitly defined as `strict`—or not available to end-users

```ts
interface Document {
  strict id: string;
  strict createdAt: Date;
  strict updatedAt: Date;
  title: string;
  abstract: string;
  abstract: string;
  author: string;
  venue: string;
  year: number;
  pages: number;
  doi: string;
  tags: string[];
}
```

Or, the other properties that are accessible to end-users are defined as `latent`—available for end-users to fetch

```ts
interface Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  latent title: string;
  latent abstract: string;
  latent abstract: string;
  latent author: string;
  latent venue: string;
  latent year: number;
  latent pages: number;
  latent doi: string;
  latent tags: string[];
}
```

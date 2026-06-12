// Curated Unsplash food photos — deterministic per restaurant id

const BASE = "https://images.unsplash.com/photo-";

export const RESTAURANT_COVERS = [
  `${BASE}1585937421612-70a008356fbe?w=640&q=75&auto=format&fit=crop`, // Indian thali
  `${BASE}1567620905732-2d1ec7ab7445?w=640&q=75&auto=format&fit=crop`, // food spread
  `${BASE}1631515243349-e0cb75fb8d3a?w=640&q=75&auto=format&fit=crop`, // curry bowls
  `${BASE}1546069901-ba9599a7e63c?w=640&q=75&auto=format&fit=crop`,    // healthy bowl
  `${BASE}1512058564366-18510be2db19?w=640&q=75&auto=format&fit=crop`, // rice/biryani
  `${BASE}1606491956689-2ea866880c84?w=640&q=75&auto=format&fit=crop`, // paneer
  `${BASE}1565958011703-44f9829ba187?w=640&q=75&auto=format&fit=crop`, // dal/sabzi
  `${BASE}1596797038530-2c107229654b?w=640&q=75&auto=format&fit=crop`, // Indian plate
];

export const DISH_IMAGES: Record<"veg" | "nonveg" | "mix", string> = {
  veg:    `${BASE}1546069901-ba9599a7e63c?w=200&q=75&auto=format&fit=crop`,
  nonveg: `${BASE}1565299624946-b28f40a0ae38?w=200&q=75&auto=format&fit=crop`,
  mix:    `${BASE}1567620832903-92fcec074b5b?w=200&q=75&auto=format&fit=crop`,
};

export const HERO_BG = `${BASE}1585937421612-70a008356fbe?w=1400&q=80&auto=format&fit=crop`;

/** Picks a cover image deterministically from restaurant id */
export function restaurantCover(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return RESTAURANT_COVERS[Math.abs(h) % RESTAURANT_COVERS.length];
}

/** Fake rating 4.0–4.8 deterministic per id */
export function restaurantRating(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(17, h) + id.charCodeAt(i)) | 0;
  }
  const tenths = Math.abs(h) % 9; // 0-8
  return (4.0 + tenths * 0.1).toFixed(1);
}

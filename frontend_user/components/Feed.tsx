import PostCard, { type FeedPost } from "./PostCard";

const posts: FeedPost[] = [
  {
    id: "bag-01",
    type: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    title: "Missing Red Backpack",
    description:
      "Left near the central library entrance after evening classes. Contains notebooks, an ID card, and a silver water bottle.",
    hashtags: ["lost", "backpack", "campus"],
    username: "ananya.s",
    location: "Rajshahi University Gate 2",
    likeCount: "2.4k",
    commentCount: "184",
    shareCount: "96",
  },
  {
    id: "watch-02",
    type: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    title: "Lost Smartwatch Near Food Court",
    description:
      "Black smartwatch with a cracked edge. Last synced around 2:10 PM. Reward available if recovered.",
    hashtags: ["smartwatch", "reward", "foodcourt"],
    username: "rifat_89",
    location: "Zero Point Food Plaza",
    likeCount: "1.8k",
    commentCount: "143",
    shareCount: "72",
  },
  {
    id: "cat-03",
    type: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=1200&q=80",
    title: "Looking For My Lost Cat, Mimo",
    description:
      "White and ginger cat missing since last night. Friendly, answers to Mimo, and wears a blue collar with a bell.",
    hashtags: ["pet", "cat", "helpfind"],
    username: "sadia.home",
    location: "Shalbagan Residential Area",
    likeCount: "5.1k",
    commentCount: "398",
    shareCount: "220",
  },
];

export default function Feed() {
  return (
    <div className="hide-scrollbar h-screen snap-y snap-mandatory overflow-y-scroll bg-obsidian">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

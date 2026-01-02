import { Link } from "react-router-dom";

import { dashboardData } from "../../../Data/dashboard-data";

export interface Video {
  id: number;
  title: string;
  thumbnail: string;
  status: string;
  videoSrc: string;
}

const VideoCard = ({ video }: { video: Video }) => {
  return (
    <Link
      to={`/video/${video.id}`}
      className="cursor-pointer w-full block group"
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-video bg-zinc-950 border border-zinc-800 mb-3 overflow-hidden group-hover:border-zinc-600 transition-colors rounded-xl">
        {/* Thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <span className="text-3xl font-bold text-zinc-700 group-hover:text-white transition-colors">
            {video.thumbnail}
          </span>
        </div>
      </div>

      {/* Video Info */}
      <div className="px-1">
        <h3 className="text-white font-semibold mb-2 line-clamp-2 leading-tight group-hover:text-zinc-300 transition-colors">
          {video.title}
        </h3>

        {/* Status Tag */}
        <div className="inline-block border border-zinc-800 px-3 py-1 text-xs rounded-full text-zinc-500 bg-zinc-950 group-hover:border-zinc-700 group-hover:text-zinc-300 transition-colors">
          {video.status}
        </div>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const videos: Video[] = dashboardData;
  /* Removed filter state and options */

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">
            Video Library
          </h1>
          <p className="text-zinc-400 text-sm">
            Browse and watch all available content
          </p>
        </div>
      </div>

      {/* Filter Bar Removed */}

      {/* Video Grid */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

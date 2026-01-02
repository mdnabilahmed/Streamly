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
      className="cursor-pointer w-full block group relative"
    >
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-lg transition-all duration-300">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3 border border-zinc-800 group-hover:border-zinc-600 transition-colors">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-zinc-600 group-hover:text-white transition-colors">
              {video.thumbnail}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-zinc-200 font-bold text-sm leading-tight group-hover:text-white truncate">
            {video.title}
          </h3>

          <div className="flex items-center justify-between mt-1">
            <div className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-black text-zinc-500 border border-zinc-800 group-hover:border-zinc-600 group-hover:text-zinc-400 transition-colors">
              {video.status}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const videos: Video[] = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-bl from-zinc-950 via-zinc-900 to-zinc-800 text-white p-6">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter text-white">
          Streamly
          <span className="text-zinc-500 text-2xl font-medium ml-3">
            Video Library
          </span>
        </h1>
        <p className="text-zinc-400 max-w-2xl">
          Browse and watch your collection.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

import { useParams, useNavigate } from "react-router-dom";
import { dashboardData } from "../../../Data/dashboard-data";
import video1 from "../../assets/video1.mp4";
import video2 from "../../assets/video2.mp4";
import video3 from "../../assets/video3.mp4";

const videoMap: Record<string, string> = {
  "video1.mp4": video1,
  "video2.mp4": video2,
  "video3.mp4": video3,
};

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const video = dashboardData.find((v) => v.id === Number(id));

  if (!video) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Video not found</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const videoSrc = videoMap[video.videoSrc];

  return (
    <div className="min-h-screen bg-gradient-to-bl from-zinc-950 via-zinc-900 to-zinc-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Dashboard
        </button>

        <div className="space-y-6 animate-fade-in-up">
          <div className="w-full aspect-video border border-zinc-800 rounded-2xl overflow-hidden bg-black shadow-2xl">
            <video
              src={videoSrc}
              controls
              autoPlay
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-handwriting tracking-wide text-white">
              {video.title}
            </h1>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 border border-zinc-800 rounded-full text-sm text-zinc-400 bg-zinc-900">
                {video.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;

import { FiActivity, FiTool } from "react-icons/fi";

export default function AdminAnalytics() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6">
        <FiActivity size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Analytics & Reporting</h2>
      <p className="text-gray-500 mb-8">
        Advanced analytics, team performance heatmaps, and custom reporting features are currently under development. They will be available in the next major release.
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
        <FiTool /> Coming Soon
      </div>
    </div>
  );
}

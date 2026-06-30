import { FiSettings, FiTool } from "react-icons/fi";

export default function AdminSettings() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-6">
        <FiSettings size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">System Configuration</h2>
      <p className="text-gray-500 mb-8">
        Global settings, third-party integrations (Slack, Google Drive), and API webhooks configuration are currently in development.
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
        <FiTool /> Coming Soon
      </div>
    </div>
  );
}

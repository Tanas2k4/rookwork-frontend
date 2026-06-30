import { FiCreditCard, FiClock } from "react-icons/fi";

export default function AdminBilling() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
        <FiCreditCard size={32} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Billing & Subscription</h2>
      <p className="text-gray-500 mb-8">
        Manage your subscription plans, view invoice history, and monitor seat usage. This feature will be rolled out when premium tiers are introduced.
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-200">
        <FiClock /> Scheduled for Q4
      </div>
    </div>
  );
}

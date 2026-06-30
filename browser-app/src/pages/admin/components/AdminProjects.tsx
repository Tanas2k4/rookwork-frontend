import { useState, useEffect } from "react";
import { adminApi, type AdminProject } from "../../../api/services/adminApi";
import { FiSearch, FiFolder, FiLock, FiGlobe } from "react-icons/fi";
import { useToast } from "../../../hooks/useToast";
import Loading from "../../../components/common/Loading";

export default function AdminProjects() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  const fetchProjects = () => {
    setLoading(true);
    adminApi.getProjects(search)
      .then(setProjects)
      .catch((err: any) => addToast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => fetchProjects(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800">Workspaces & Teams</h2>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
            <tr>
              <th className="px-6 py-4">Project Details</th>
              <th className="px-6 py-4">Visibility</th>
              <th className="px-6 py-4">Members</th>
              <th className="px-6 py-4">Tasks Progress</th>
              <th className="px-6 py-4">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="py-12"><Loading /></td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-500">No projects found.</td></tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                        <FiFolder size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{project.projectName}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[200px]">{project.description || "No description"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      {project.isPrivate ? <><FiLock /> Private</> : <><FiGlobe /> Public</>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {project.memberCount} users
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">{project.issueCount} tasks</span>
                        <span className={project.completionRate === 100 ? "text-green-600" : "text-purple-600"}>{project.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${project.completionRate === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                          style={{ width: `${project.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { MdCheckCircle, MdError, MdInfo, MdClose } from "react-icons/md";
import type { Toast } from "../../types/project";

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        
        const containerClasses = isSuccess 
          ? "border-green-200 text-green-800 bg-green-50/95" 
          : isError 
            ? "border-red-200 text-red-800 bg-red-50/95" 
            : "border-blue-200 text-blue-800 bg-blue-50/95";

        const iconClasses = isSuccess 
          ? "text-green-500" 
          : isError 
            ? "text-red-500" 
            : "text-blue-500";
        
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-xl ${containerClasses} transition-all duration-300 animate-in slide-in-from-right-8 fade-in`}
          >
            <div className={`shrink-0 ${iconClasses}`}>
              {isSuccess ? <MdCheckCircle size={22} /> : isError ? <MdError size={22} /> : <MdInfo size={22} />}
            </div>
            
            <p className="text-sm font-medium pr-2">{t.message}</p>
            
            <button
              onClick={() => onRemove(t.id)}
              className="ml-auto shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-all pointer-events-auto"
            >
              <MdClose size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

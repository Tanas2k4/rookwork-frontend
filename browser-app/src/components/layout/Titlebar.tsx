import { XMarkIcon, MinusIcon, Square2StackIcon } from "@heroicons/react/24/outline";

function Titlebar() {
  if (!window.electron) return null;

  return (
    <div className="h-8 bg-zinc-800 flex items-stretch select-none z-50 relative">
      {/* vùng trống để drag */}
      <div
        onDoubleClick={window.electron.maximize}
        className="flex-1 [-webkit-app-region:drag]"
      />

      {/* controls */}
      <div className="flex [-webkit-app-region:no-drag]">
        <button
          onClick={() => window.electron.minimize()}
          className="h-full w-10 flex items-center justify-center
             text-gray-400 hover:text-white hover:bg-white/10"
        >
          <MinusIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => window.electron.maximize()}
          className="h-full w-10 flex items-center justify-center
             text-gray-400 hover:text-white hover:bg-white/10"
        >
          <Square2StackIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => window.electron.close()}
          className="h-full w-10 flex items-center justify-center
             text-gray-400 hover:text-white hover:bg-red-600"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Titlebar;

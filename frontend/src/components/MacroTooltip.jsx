import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const MacroTooltip = ({ protein, carbs, fat, t, children }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const total = (Number(protein) || 0) + (Number(carbs) || 0) + (Number(fat) || 0);

  if (!protein && !carbs && !fat) return null;

  const pPct = total > 0 ? Math.round((Number(protein) / total) * 100) : 0;
  const cPct = total > 0 ? Math.round((Number(carbs) / total) * 100) : 0;
  const fPct = total > 0 ? Math.round((Number(fat) / total) * 100) : 0;

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.top - 10,
      left: rect.left + rect.width / 2,
    });
    setShow(true);
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-help transition-colors"
      >
        <Info className="w-3 h-3" />
      </span>
      {show &&
        createPortal(
          <span
            className="fixed z-[9999] -translate-x-1/2 -translate-y-full mb-3 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl text-xs"
            style={{ top: coords.top, left: coords.left }}
          >
            <span className="block font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Macro Breakdown
            </span>
            <span className="block space-y-1.5">
              <span className="flex items-center justify-between text-blue-500">
                <span>
                  {t('protein')}: <span className="font-medium text-gray-800 dark:text-gray-100">{protein}g</span> ({pPct}%)
                </span>
                <span className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <span className="block h-full bg-blue-500" style={{ width: `${pPct}%` }} />
                </span>
              </span>
              <span className="flex items-center justify-between text-yellow-500">
                <span>
                  {t('carbs')}: <span className="font-medium text-gray-800 dark:text-gray-100">{carbs}g</span> ({cPct}%)
                </span>
                <span className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <span className="block h-full bg-yellow-500" style={{ width: `${cPct}%` }} />
                </span>
              </span>
              <span className="flex items-center justify-between text-red-500">
                <span>
                  {t('fat')}: <span className="font-medium text-gray-800 dark:text-gray-100">{fat}g</span> ({fPct}%)
                </span>
                <span className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <span className="block h-full bg-red-500" style={{ width: `${fPct}%` }} />
                </span>
              </span>
            </span>
            <span className="flex h-1.5 rounded-full overflow-hidden mt-2">
              <span className="bg-blue-500" style={{ width: `${pPct}%` }} />
              <span className="bg-yellow-500" style={{ width: `${cPct}%` }} />
              <span className="bg-red-500" style={{ width: `${fPct}%` }} />
            </span>
          </span>,
          document.body
        )}
    </>
  );
};

export default MacroTooltip;

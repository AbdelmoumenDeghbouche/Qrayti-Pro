import React from 'react';
import { MindMapUINode, parseMindMapText } from '../utils/mindmapUtils';
import MindMapNodeView from './MindMapNodeView';
import LoadingSpinner from './LoadingSpinner';
import { downloadContentAsPdf } from '../utils/downloadUtils';

interface MindMapViewProps {
  mindMapText: string | null;
  isLoading: boolean;
  title: string;
}

const MindMapView: React.FC<MindMapViewProps> = ({ mindMapText, isLoading, title }) => {
  const mindMapContentId = "mindmap-visual-content-area";

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[350px] flex items-center justify-center">
        <LoadingSpinner size="w-14 h-14" />
      </div>
    );
  }

  if (!mindMapText) {
    return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[350px] flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 italic text-xl">الخريطة الذهنية السحرية ستظهر هنا عند الطلب!</p>
      </div>
    );
  }

  let parsedRootNode: MindMapUINode | null = null;
  let parseError = false;
  try {
    parsedRootNode = parseMindMapText(mindMapText);
  } catch (e) {
    console.error("Error parsing mind map text:", e);
    parseError = true;
  }
  

  if (parseError || !parsedRootNode) {
     return (
      <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8 min-h-[250px]">
        <h3 className="text-3xl font-semibold text-rose-700 dark:text-rose-400 mb-4">خطأ في عرض المخطط الذهني</h3>
        <p className="text-rose-600 dark:text-rose-300 italic mb-5 text-lg">
            عفوًا، لم نتمكن من تحليل نص المخطط الذهني بشكل صحيح. قد يكون التنسيق غير متوقع.
            سنعرض لك النص الخام الذي تم إنشاؤه بدلاً من ذلك.
        </p>
        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-700/80 rounded-xl text-base text-slate-600 dark:text-slate-300 w-full overflow-auto max-h-80 border border-slate-200 dark:border-slate-600">
            <pre className="whitespace-pre-wrap">{mindMapText}</pre>
        </div>
      </div>
    );
  }
  
  const handleDownloadMindmapPdf = () => {
    downloadContentAsPdf(mindMapContentId, "MindMap", title);
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl dark:border dark:border-slate-700/50 rounded-2xl p-6 sm:p-10 my-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-10 gap-4">
        <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <button
            onClick={handleDownloadMindmapPdf}
            className="w-full sm:w-auto px-6 py-3 text-lg font-semibold text-white bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700 transition-all duration-200 ease-in-out flex items-center justify-center space-x-2.5 transform hover:scale-105"
            aria-label={`تحميل ${title} كملف PDF`}
          >
            <span role="img" aria-hidden="true" className="text-2xl">📄</span>
            <span>تحميل PDF</span>
        </button>
      </div>
      <div id={mindMapContentId} className="overflow-x-auto py-5 -mx-4 px-4 sm:-mx-6 sm:px-6"> 
        {/* Added negative margins and padding to allow content to "bleed" for better scrolling on small screens */}
        <MindMapNodeView node={parsedRootNode} level={0} />
      </div>
    </div>
  );
};

export default MindMapView;
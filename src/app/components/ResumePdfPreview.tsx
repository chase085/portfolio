import { useEffect, useRef, useState } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ResumePdfPreviewProps {
  url: string;
}

export function ResumePdfPreview({ url }: ResumePdfPreviewProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const pages = pagesRef.current;
    if (!pages) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(pages);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadingTask = getDocument({ url });
    setPdf(null);
    setStatus("loading");

    loadingTask.promise.then(
      (document) => {
        if (cancelled) return;
        setPdf(document);
      },
      () => {
        if (!cancelled) setStatus("error");
      },
    );

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [url]);

  useEffect(() => {
    const pages = pagesRef.current;
    if (!pdf || !pages || width <= 0) return;

    let cancelled = false;
    const renderTasks: RenderTask[] = [];
    const fragment = document.createDocumentFragment();

    const renderPages = async () => {
      try {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min((width - 32) / baseViewport.width, 1.5);
          const viewport = page.getViewport({ scale });
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is unavailable");

          canvas.className = "resume-pdf-page";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Resume page ${pageNumber} of ${pdf.numPages}`);
          canvas.width = Math.ceil(viewport.width * pixelRatio);
          canvas.height = Math.ceil(viewport.height * pixelRatio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const task = page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
          });
          renderTasks.push(task);
          await task.promise;
          fragment.append(canvas);
        }

        if (!cancelled) {
          pages.replaceChildren(fragment);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void renderPages();
    return () => {
      cancelled = true;
      renderTasks.forEach((task) => task.cancel());
    };
  }, [pdf, width]);

  return (
    <div className="resume-viewer-body">
      <div ref={pagesRef} className="resume-pdf-pages" />
      {status !== "ready" && (
        <div className="resume-pdf-status" role={status === "error" ? "alert" : "status"}>
          {status === "error" ? "Could not display this PDF." : "Loading resume…"}
        </div>
      )}
    </div>
  );
}
